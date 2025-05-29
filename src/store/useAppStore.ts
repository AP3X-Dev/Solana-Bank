import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, Account, Transaction, SavingsGoal } from '../types'

interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // Accounts state
  accounts: Account[]
  selectedAccount: Account | null
  
  // Transactions state
  transactions: Transaction[]
  
  // Savings goals state
  savingsGoals: SavingsGoal[]
  
  // UI state
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  loading: boolean
  error: string | null
  
  // Wallet state
  walletConnected: boolean
  walletAddress: string | null
  solBalance: number
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>
}

interface AppActions {
  // User actions
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  logout: () => void
  
  // Account actions
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (accountId: string, updates: Partial<Account>) => void
  deleteAccount: (accountId: string) => void
  setSelectedAccount: (account: Account | null) => void
  
  // Transaction actions
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void
  
  // Savings goals actions
  setSavingsGoals: (goals: SavingsGoal[]) => void
  addSavingsGoal: (goal: SavingsGoal) => void
  updateSavingsGoal: (goalId: string, updates: Partial<SavingsGoal>) => void
  deleteSavingsGoal: (goalId: string) => void
  
  // UI actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Wallet actions
  setWalletConnected: (connected: boolean) => void
  setWalletAddress: (address: string | null) => void
  setSolBalance: (balance: number) => void
  
  // Notification actions
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        accounts: [],
        selectedAccount: null,
        transactions: [],
        savingsGoals: [],
        theme: 'system',
        sidebarOpen: false,
        loading: false,
        error: null,
        walletConnected: false,
        walletAddress: null,
        solBalance: 0,
        notifications: [],

        // User actions
        setUser: (user) => set({ user }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        logout: () => set({
          user: null,
          isAuthenticated: false,
          accounts: [],
          selectedAccount: null,
          transactions: [],
          savingsGoals: [],
          walletConnected: false,
          walletAddress: null,
          solBalance: 0,
        }),

        // Account actions
        setAccounts: (accounts) => set({ accounts }),
        addAccount: (account) => set((state) => ({
          accounts: [...state.accounts, account]
        })),
        updateAccount: (accountId, updates) => set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId ? { ...account, ...updates } : account
          )
        })),
        deleteAccount: (accountId) => set((state) => ({
          accounts: state.accounts.filter(account => account.id !== accountId),
          selectedAccount: state.selectedAccount?.id === accountId ? null : state.selectedAccount
        })),
        setSelectedAccount: (account) => set({ selectedAccount: account }),

        // Transaction actions
        setTransactions: (transactions) => set({ transactions }),
        addTransaction: (transaction) => set((state) => ({
          transactions: [transaction, ...state.transactions]
        })),
        updateTransaction: (transactionId, updates) => set((state) => ({
          transactions: state.transactions.map(transaction =>
            transaction.id === transactionId ? { ...transaction, ...updates } : transaction
          )
        })),

        // Savings goals actions
        setSavingsGoals: (goals) => set({ savingsGoals: goals }),
        addSavingsGoal: (goal) => set((state) => ({
          savingsGoals: [...state.savingsGoals, goal]
        })),
        updateSavingsGoal: (goalId, updates) => set((state) => ({
          savingsGoals: state.savingsGoals.map(goal =>
            goal.id === goalId ? { ...goal, ...updates } : goal
          )
        })),
        deleteSavingsGoal: (goalId) => set((state) => ({
          savingsGoals: state.savingsGoals.filter(goal => goal.id !== goalId)
        })),

        // UI actions
        setTheme: (theme) => set({ theme }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // Wallet actions
        setWalletConnected: (connected) => set({ walletConnected: connected }),
        setWalletAddress: (address) => set({ walletAddress: address }),
        setSolBalance: (balance) => set({ solBalance: balance }),

        // Notification actions
        addNotification: (notification) => set((state) => ({
          notifications: [{
            ...notification,
            id: Math.random().toString(36).substring(2),
            timestamp: new Date(),
            read: false
          }, ...state.notifications]
        })),
        markNotificationRead: (id) => set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        })),
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(notification => notification.id !== id)
        })),
        clearNotifications: () => set({ notifications: [] }),
      }),
      {
        name: 'solana-bank-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          // Don't persist sensitive data like user info or wallet details
        }),
      }
    ),
    {
      name: 'solana-bank-store',
    }
  )
)

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user)
export const useAccounts = () => useAppStore((state) => state.accounts)
export const useSelectedAccount = () => useAppStore((state) => state.selectedAccount)
export const useTransactions = () => useAppStore((state) => state.transactions)
export const useSavingsGoals = () => useAppStore((state) => state.savingsGoals)
export const useTheme = () => useAppStore((state) => state.theme)
export const useWalletState = () => useAppStore((state) => ({
  connected: state.walletConnected,
  address: state.walletAddress,
  balance: state.solBalance
}))
export const useNotifications = () => useAppStore((state) => state.notifications)
