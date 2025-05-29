import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
// Temporarily commented out until dependencies are installed
// import { motion } from 'framer-motion'
import {
  PlusCircle,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  BarChart3,
  Target,
  CreditCard,
  Zap,
  Bot
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
// import { useAccounts, useAccountSummary, useRecentAccountActivity } from '../hooks/useAccounts'
// import { useEnhancedWallet } from '../hooks/useWallet'
import { Button } from '../components/Button'
import { Card, CardGrid } from '../components/Card'
import { AccountCard } from '../components/AccountCard'
import { QuickActions } from '../components/QuickActions'
import { WalletInsights } from '../components/WalletInsights'
// import { Loading, CardSkeleton, AccountCardSkeleton } from '../components/ui/Loading'
// import { useAppStore } from '../store/useAppStore'
// import { formatSOL, formatCurrency, formatPercentage, getRelativeTime } from '../lib/utils'
import { Account } from '../types'
import { getTokenBalance } from '../utils/solana'
import { storage } from '../utils/storage'

export const Dashboard = () => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const { connection } = useConnection()
  const wallet = useWallet()
  const [solBalance, setSolBalance] = useState<number>(0)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login')
      return
    }

    const fetchBalances = async () => {
      if (wallet.publicKey && user) {
        const balance = await getTokenBalance(connection, wallet.publicKey)
        setSolBalance(balance)

        // Get existing accounts from storage
        const existingAccounts = storage.getAccounts()
          .filter(a => a.userId === user.id)

        // Create a Solana account representation for the main wallet
        const mainWalletAccount: Account = {
          id: wallet.publicKey.toString(),
          userId: user.id,
          type: 'trading',
          name: 'Main Trading Account',
          balance: balance,
          accountNumber: wallet.publicKey.toString(),
          routingNumber: 'SOLANA',
          transactions: [],
          scheduledPayments: [],
          recurringTransfers: [],
          status: 'active',
          visibility: 'visible',
          openedDate: new Date().toISOString(),
          lastActivityDate: new Date().toISOString()
        }

        // Check if main wallet account already exists in storage
        const mainAccountExists = existingAccounts.some(a => a.id === wallet.publicKey?.toString())

        // If main account doesn't exist, add it to storage
        if (!mainAccountExists) {
          const updatedAccounts = [...existingAccounts, mainWalletAccount]
          storage.setAccounts(updatedAccounts)
        } else {
          // Update the balance of the existing main account
          const updatedAccounts = existingAccounts.map(account =>
            account.id === wallet.publicKey?.toString()
              ? { ...account, balance: balance, lastActivityDate: new Date().toISOString() }
              : account
          )
          storage.setAccounts(updatedAccounts)
        }

        // Get all accounts after update
        const allAccounts = storage.getAccounts()
          .filter(a => a.userId === user.id)

        setAccounts(allAccounts)
      }
    }

    fetchBalances()
  }, [user, navigate, wallet.publicKey, connection])

  // Show loading state while user is being determined
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana-teal mx-auto mb-4"></div>
            <p className="text-muted-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // If not loading and no user, redirect will happen in useEffect
  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-light-text bg-solana-gradient bg-clip-text text-transparent">
          Welcome back, {user?.firstName || user?.name || 'User'}
        </h1>
        <p className="text-muted-text">Manage your Solana wallet and transactions</p>
      </div>

      <div className="grid gap-6">
        <QuickActions />

        <WalletInsights />

        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-light-text">Your Accounts</h2>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/account/new')}
          >
            New Account
          </Button>
        </div>

        <CardGrid columns={2}>
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/account/${account.id}`)}
            />
          ))}

          {accounts.length < 2 && (
            <Card
              title="Bot Trading"
              icon={Bot}
              iconBackground="blue"
              hoverable
              onClick={() => navigate('/account/new')}
            >
              <div className="flex flex-col h-full">
                <p className="text-muted-text text-sm mb-4">
                  Create a trading bot account to automate your Solana trading strategies.
                </p>
                <div className="mt-auto">
                  <div className="text-2xl font-bold bg-solana-gradient bg-clip-text text-transparent">
                    0.5000 SOL
                  </div>
                  <div className="mt-4 pt-2 border-t border-dark-light flex justify-between items-center">
                    <span className="text-xs text-muted-text">Trading</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-dark-light text-muted-text">
                      Bot
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!wallet.connected && (
            <div className="border border-dark-light border-dashed rounded-2xl p-6 bg-dark-card">
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-medium text-light-text">Connect Your Wallet</h3>
                <p className="text-muted-text">Connect your Solana wallet to view your balance and make transactions.</p>
              </div>
            </div>
          )}
        </CardGrid>
      </div>
    </div>
  )
}