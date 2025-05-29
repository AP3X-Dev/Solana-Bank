import React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { queryKeys, cacheUtils } from '../lib/queryClient'
import { useAppStore } from '../store/useAppStore'
import { tokenService } from '../services/tokenService'
import { getTokenBalance } from '../utils/solana'
import toast from 'react-hot-toast'

// Enhanced wallet hook with additional functionality
export function useEnhancedWallet() {
  const wallet = useSolanaWallet()
  const { connection } = useConnection()
  const {
    setWalletConnected,
    setWalletAddress,
    setSolBalance,
    walletConnected,
    walletAddress,
    solBalance
  } = useAppStore()

  // Update store when wallet state changes
  React.useEffect(() => {
    setWalletConnected(wallet.connected)
    setWalletAddress(wallet.publicKey?.toString() || null)
  }, [wallet.connected, wallet.publicKey, setWalletConnected, setWalletAddress])

  // Fetch SOL balance
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: queryKeys.walletBalance(walletAddress || ''),
    queryFn: async () => {
      if (!wallet.publicKey) return 0
      const balance = await getTokenBalance(connection, wallet.publicKey)
      setSolBalance(balance)
      return balance
    },
    enabled: !!wallet.publicKey && wallet.connected,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch token balances
  const { data: tokens, isLoading: tokensLoading } = useQuery({
    queryKey: queryKeys.walletTokens(walletAddress || ''),
    queryFn: async () => {
      if (!wallet.publicKey) return []
      return await tokenService.getTokenAccounts(connection, wallet.publicKey.toString())
    },
    enabled: !!wallet.publicKey && wallet.connected,
    refetchInterval: 60000, // Refetch every minute
  })

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: queryKeys.walletTransactions(walletAddress || ''),
    queryFn: async () => {
      if (!wallet.publicKey) return []

      // Fetch recent transactions
      const signatures = await connection.getSignaturesForAddress(
        wallet.publicKey,
        { limit: 50 }
      )

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            })
            return {
              signature: sig.signature,
              blockTime: sig.blockTime,
              slot: sig.slot,
              err: sig.err,
              transaction: tx,
            }
          } catch (error) {
            console.error('Error fetching transaction:', error)
            return null
          }
        })
      )

      return transactions.filter(Boolean)
    },
    enabled: !!wallet.publicKey && wallet.connected,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Connect wallet mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.connect) throw new Error('Wallet connect function not available')
      await wallet.connect()
    },
    onSuccess: () => {
      toast.success('Wallet connected successfully!')
      cacheUtils.invalidateWalletQueries(wallet.publicKey?.toString())
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect wallet')
    },
  })

  // Disconnect wallet mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.disconnect) throw new Error('Wallet disconnect function not available')
      await wallet.disconnect()
    },
    onSuccess: () => {
      toast.success('Wallet disconnected')
      cacheUtils.invalidateWalletQueries()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect wallet')
    },
  })

  // Send SOL mutation
  const sendSolMutation = useMutation({
    mutationFn: async ({
      recipient,
      amount,
      memo
    }: {
      recipient: string;
      amount: number;
      memo?: string
    }) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected')
      }

      const recipientPubkey = new PublicKey(recipient)
      const lamports = amount * LAMPORTS_PER_SOL

      // Create transaction
      const { Transaction, SystemProgram } = await import('@solana/web3.js')
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      )

      // Add memo if provided
      if (memo) {
        const { createMemoInstruction } = await import('@solana/spl-memo')
        transaction.add(createMemoInstruction(memo))
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet.publicKey

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed')

      return { signature, amount, recipient }
    },
    onSuccess: ({ signature, amount, recipient }) => {
      toast.success(`Successfully sent ${amount} SOL`)

      // Invalidate wallet queries to refresh balance
      cacheUtils.invalidateWalletQueries(wallet.publicKey?.toString())

      // Refetch balance immediately
      refetchBalance()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send SOL')
    },
  })

  // Request airdrop (devnet only)
  const requestAirdropMutation = useMutation({
    mutationFn: async (amount: number = 1) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const lamports = amount * LAMPORTS_PER_SOL
      const signature = await connection.requestAirdrop(wallet.publicKey, lamports)
      await connection.confirmTransaction(signature, 'confirmed')

      return { signature, amount }
    },
    onSuccess: ({ amount }) => {
      toast.success(`Successfully received ${amount} SOL airdrop`)
      cacheUtils.invalidateWalletQueries(wallet.publicKey?.toString())
      refetchBalance()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request airdrop')
    },
  })

  return {
    // Wallet state
    ...wallet,
    balance: balance || solBalance,
    tokens: tokens || [],
    transactions: transactions || [],

    // Loading states
    balanceLoading,
    tokensLoading,
    transactionsLoading,

    // Actions
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sendSol: sendSolMutation.mutate,
    requestAirdrop: requestAirdropMutation.mutate,
    refetchBalance,

    // Mutation states
    connecting: connectMutation.isPending,
    disconnecting: disconnectMutation.isPending,
    sending: sendSolMutation.isPending,
    requestingAirdrop: requestAirdropMutation.isPending,
  }
}

// Hook for wallet portfolio summary
export function useWalletPortfolio() {
  const { balance, tokens } = useEnhancedWallet()

  const portfolio = {
    totalValue: balance || 0, // In a real app, you'd calculate USD value
    solBalance: balance || 0,
    tokenCount: tokens?.length || 0,
    tokens: tokens || [],
    allocation: {
      sol: balance || 0,
      tokens: tokens?.reduce((sum, token) => sum + (token.uiAmount || 0), 0) || 0,
    },
  }

  return portfolio
}

// Hook for wallet validation
export function useWalletValidation() {
  const wallet = useSolanaWallet()

  const isValidAddress = (address: string): boolean => {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }

  const canSend = (amount: number): { valid: boolean; error?: string } => {
    if (!wallet.connected) {
      return { valid: false, error: 'Wallet not connected' }
    }

    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' }
    }

    // Add more validation logic here
    return { valid: true }
  }

  return {
    isValidAddress,
    canSend,
    isConnected: wallet.connected,
    hasPublicKey: !!wallet.publicKey,
  }
}
