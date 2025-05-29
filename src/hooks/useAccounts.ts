import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { Account, Transaction } from '../types'
import { dataService } from '../services/dataService'
import { queryKeys, cacheUtils } from '../lib/queryClient'
import { useAppStore } from '../store/useAppStore'
import toast from 'react-hot-toast'

// Hook to fetch all accounts for the current user
export function useAccounts() {
  const { user } = useAppStore()
  
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      const accounts = await dataService.accounts.getAll()
      return accounts.filter(account => account.userId === user.id)
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Hook to fetch a specific account
export function useAccount(accountId: string) {
  return useQuery({
    queryKey: queryKeys.account(accountId),
    queryFn: () => dataService.accounts.getById(accountId),
    enabled: !!accountId,
  })
}

// Hook to fetch account balance
export function useAccountBalance(accountId: string) {
  const { connection } = useWallet()
  
  return useQuery({
    queryKey: queryKeys.accountBalance(accountId),
    queryFn: async () => {
      const account = await dataService.accounts.getById(accountId)
      // In a real app, you'd fetch the actual balance from the blockchain
      return account.balance
    },
    enabled: !!accountId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Hook to fetch account transactions
export function useAccountTransactions(accountId: string) {
  return useQuery({
    queryKey: queryKeys.accountTransactions(accountId),
    queryFn: () => dataService.transactions.getByAccountId(accountId),
    enabled: !!accountId,
  })
}

// Hook to create a new account
export function useCreateAccount() {
  const queryClient = useQueryClient()
  const { addAccount } = useAppStore()
  
  return useMutation({
    mutationFn: (accountData: Omit<Account, 'id'>) => 
      dataService.accounts.create(accountData),
    onSuccess: (newAccount) => {
      // Update the store
      addAccount(newAccount)
      
      // Invalidate and refetch accounts
      cacheUtils.invalidateAccountQueries()
      
      toast.success('Account created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create account')
    },
  })
}

// Hook to update an account
export function useUpdateAccount() {
  const queryClient = useQueryClient()
  const { updateAccount } = useAppStore()
  
  return useMutation({
    mutationFn: ({ accountId, updates }: { accountId: string; updates: Partial<Account> }) =>
      dataService.accounts.update(accountId, updates),
    onSuccess: (updatedAccount) => {
      // Update the store
      updateAccount(updatedAccount.id, updatedAccount)
      
      // Update the cache
      queryClient.setQueryData(queryKeys.account(updatedAccount.id), updatedAccount)
      cacheUtils.invalidateAccountQueries(updatedAccount.id)
      
      toast.success('Account updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update account')
    },
  })
}

// Hook to delete an account
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const { deleteAccount } = useAppStore()
  
  return useMutation({
    mutationFn: (accountId: string) => dataService.accounts.delete(accountId),
    onSuccess: (_, accountId) => {
      // Update the store
      deleteAccount(accountId)
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.account(accountId) })
      cacheUtils.invalidateAccountQueries()
      
      toast.success('Account deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })
}

// Hook to transfer funds between accounts
export function useTransferFunds() {
  const queryClient = useQueryClient()
  const { addTransaction } = useAppStore()
  
  return useMutation({
    mutationFn: async ({
      fromAccountId,
      toAccountId,
      amount,
      description
    }: {
      fromAccountId: string
      toAccountId: string
      amount: number
      description?: string
    }) => {
      // Create transfer transactions
      const transferOut: Omit<Transaction, 'id'> = {
        timestamp: new Date().toISOString(),
        amount: -amount,
        type: 'transfer',
        status: 'completed',
        description: description || `Transfer to account ${toAccountId.slice(0, 8)}...`,
        fromAccount: fromAccountId,
        toAccount: toAccountId,
      }
      
      const transferIn: Omit<Transaction, 'id'> = {
        timestamp: new Date().toISOString(),
        amount: amount,
        type: 'transfer',
        status: 'completed',
        description: description || `Transfer from account ${fromAccountId.slice(0, 8)}...`,
        fromAccount: fromAccountId,
        toAccount: toAccountId,
      }
      
      // Create both transactions
      const [outTransaction, inTransaction] = await Promise.all([
        dataService.transactions.create(transferOut),
        dataService.transactions.create(transferIn)
      ])
      
      // Update account balances
      const [fromAccount, toAccount] = await Promise.all([
        dataService.accounts.getById(fromAccountId),
        dataService.accounts.getById(toAccountId)
      ])
      
      await Promise.all([
        dataService.accounts.update(fromAccountId, { 
          balance: fromAccount.balance - amount 
        }),
        dataService.accounts.update(toAccountId, { 
          balance: toAccount.balance + amount 
        })
      ])
      
      return { outTransaction, inTransaction }
    },
    onSuccess: ({ outTransaction, inTransaction }) => {
      // Update the store
      addTransaction(outTransaction)
      addTransaction(inTransaction)
      
      // Invalidate relevant queries
      cacheUtils.invalidateAccountQueries()
      cacheUtils.invalidateTransactionQueries()
      
      toast.success('Transfer completed successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Transfer failed')
    },
  })
}

// Hook to get account summary statistics
export function useAccountSummary() {
  const { data: accounts, isLoading } = useAccounts()
  
  const summary = {
    totalBalance: accounts?.reduce((sum, account) => sum + account.balance, 0) || 0,
    totalAccounts: accounts?.length || 0,
    accountsByType: accounts?.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {},
    activeAccounts: accounts?.filter(account => account.status === 'active').length || 0,
  }
  
  return {
    summary,
    isLoading,
  }
}

// Hook to get recent account activity
export function useRecentAccountActivity(limit: number = 10) {
  const { data: accounts } = useAccounts()
  
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      if (!accounts) return []
      
      const allTransactions: Transaction[] = []
      
      // Fetch transactions for all accounts
      for (const account of accounts) {
        const transactions = await dataService.transactions.getByAccountId(account.id)
        allTransactions.push(...transactions)
      }
      
      // Sort by timestamp and limit
      return allTransactions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    },
    enabled: !!accounts && accounts.length > 0,
  })
}
