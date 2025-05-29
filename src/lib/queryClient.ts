import { QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: (error: any) => {
        // Global error handling for mutations
        const message = error?.message || 'An error occurred'
        toast.error(message)
      },
    },
  },
})

// Query keys factory for better organization
export const queryKeys = {
  // User queries
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  
  // Account queries
  accounts: ['accounts'] as const,
  account: (accountId: string) => ['accounts', accountId] as const,
  accountBalance: (accountId: string) => ['accounts', accountId, 'balance'] as const,
  accountTransactions: (accountId: string) => ['accounts', accountId, 'transactions'] as const,
  
  // Transaction queries
  transactions: ['transactions'] as const,
  transaction: (transactionId: string) => ['transactions', transactionId] as const,
  transactionsByAccount: (accountId: string) => ['transactions', 'account', accountId] as const,
  
  // Wallet queries
  wallet: ['wallet'] as const,
  walletBalance: (address: string) => ['wallet', 'balance', address] as const,
  walletTokens: (address: string) => ['wallet', 'tokens', address] as const,
  walletTransactions: (address: string) => ['wallet', 'transactions', address] as const,
  
  // Token queries
  tokens: ['tokens'] as const,
  tokenPrice: (symbol: string) => ['tokens', 'price', symbol] as const,
  tokenPrices: (symbols: string[]) => ['tokens', 'prices', ...symbols] as const,
  
  // Analytics queries
  analytics: ['analytics'] as const,
  portfolioAnalytics: (userId: string) => ['analytics', 'portfolio', userId] as const,
  transactionAnalytics: (userId: string, period: string) => ['analytics', 'transactions', userId, period] as const,
  
  // Savings goals queries
  savingsGoals: ['savingsGoals'] as const,
  savingsGoal: (goalId: string) => ['savingsGoals', goalId] as const,
  savingsGoalsByAccount: (accountId: string) => ['savingsGoals', 'account', accountId] as const,
  
  // Market data queries
  market: ['market'] as const,
  solPrice: () => ['market', 'sol', 'price'] as const,
  marketData: (symbol: string) => ['market', symbol] as const,
  
  // Notifications queries
  notifications: ['notifications'] as const,
  unreadNotifications: () => ['notifications', 'unread'] as const,
} as const

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all user-related queries
  invalidateUserQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user })
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
  },
  
  // Invalidate wallet-related queries
  invalidateWalletQueries: (address?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
    if (address) {
      queryClient.invalidateQueries({ queryKey: queryKeys.walletBalance(address) })
      queryClient.invalidateQueries({ queryKey: queryKeys.walletTokens(address) })
      queryClient.invalidateQueries({ queryKey: queryKeys.walletTransactions(address) })
    }
  },
  
  // Invalidate account-related queries
  invalidateAccountQueries: (accountId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    if (accountId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.account(accountId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accountBalance(accountId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTransactions(accountId) })
    }
  },
  
  // Invalidate transaction-related queries
  invalidateTransactionQueries: (accountId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    if (accountId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByAccount(accountId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accountTransactions(accountId) })
    }
  },
  
  // Clear all cache
  clearCache: () => {
    queryClient.clear()
  },
  
  // Remove specific queries
  removeQueries: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey })
  },
  
  // Set query data manually
  setQueryData: <T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data)
  },
  
  // Get query data
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  },
  
  // Prefetch query
  prefetchQuery: (queryKey: any[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
    })
  },
}

// Error handling utilities
export const errorUtils = {
  // Check if error is network related
  isNetworkError: (error: any): boolean => {
    return error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')
  },
  
  // Check if error is authentication related
  isAuthError: (error: any): boolean => {
    return error?.status === 401 || error?.code === 'UNAUTHORIZED'
  },
  
  // Check if error is rate limit related
  isRateLimitError: (error: any): boolean => {
    return error?.status === 429 || error?.code === 'RATE_LIMIT_EXCEEDED'
  },
  
  // Get user-friendly error message
  getErrorMessage: (error: any): string => {
    if (errorUtils.isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.'
    }
    if (errorUtils.isAuthError(error)) {
      return 'Authentication required. Please log in again.'
    }
    if (errorUtils.isRateLimitError(error)) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    return error?.message || 'An unexpected error occurred.'
  },
}

// Optimistic update utilities
export const optimisticUtils = {
  // Update account balance optimistically
  updateAccountBalance: (accountId: string, newBalance: number) => {
    const queryKey = queryKeys.accountBalance(accountId)
    const previousBalance = queryClient.getQueryData(queryKey)
    
    queryClient.setQueryData(queryKey, newBalance)
    
    return () => {
      queryClient.setQueryData(queryKey, previousBalance)
    }
  },
  
  // Add transaction optimistically
  addTransaction: (accountId: string, transaction: any) => {
    const queryKey = queryKeys.accountTransactions(accountId)
    const previousTransactions = queryClient.getQueryData(queryKey) as any[]
    
    if (previousTransactions) {
      queryClient.setQueryData(queryKey, [transaction, ...previousTransactions])
    }
    
    return () => {
      queryClient.setQueryData(queryKey, previousTransactions)
    }
  },
}
