import { User, Account, Transaction, SavingsGoal, Card } from '../types';
import { generateSecureId } from '../utils/security';

/**
 * Fallback service that uses localStorage when the API is not available
 * This provides offline functionality and graceful degradation
 */

// Storage keys
const STORAGE_KEYS = {
  USERS: 'solana_bank_users',
  CURRENT_USER: 'solana_bank_current_user',
  ACCOUNTS: 'solana_bank_accounts',
  SAVINGS_GOALS: 'solana_bank_savings_goals',
  CARDS: 'solana_bank_cards',
  OFFLINE_QUEUE: 'solana_bank_offline_queue'
};

// Offline queue for operations that need to be synced later
export interface OfflineOperation {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  data: any;
  retryCount: number;
}

// Helper functions
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error);
  }
};

// Fallback service implementation
export const fallbackService = {
  // User operations
  users: {
    getAll: (): User[] => {
      return getItem<User[]>(STORAGE_KEYS.USERS, []);
    },
    
    getById: (userId: string): User | null => {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      return users.find(user => user.id === userId) || null;
    },
    
    getByWalletAddress: (walletAddress: string): User | null => {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      return users.find(user => user.walletAddress === walletAddress) || null;
    },
    
    create: (userData: Omit<User, 'id'>): User => {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      
      // Check if user with this wallet address already exists
      if (users.some(user => user.walletAddress === userData.walletAddress)) {
        throw new Error('User with this wallet address already exists');
      }
      
      const newUser: User = {
        ...userData,
        id: generateSecureId()
      };
      
      setItem(STORAGE_KEYS.USERS, [...users, newUser]);
      return newUser;
    },
    
    update: (userId: string, userData: Partial<User>): User => {
      const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      const updatedUser = {
        ...users[userIndex],
        ...userData
      };
      
      users[userIndex] = updatedUser;
      setItem(STORAGE_KEYS.USERS, users);
      
      // Update current user if it's the same
      const currentUser = getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
      if (currentUser && currentUser.id === userId) {
        setItem(STORAGE_KEYS.CURRENT_USER, updatedUser);
      }
      
      return updatedUser;
    },
    
    getCurrentUser: (): User | null => {
      return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    },
    
    setCurrentUser: (user: User | null): void => {
      setItem(STORAGE_KEYS.CURRENT_USER, user);
    }
  },
  
  // Account operations
  accounts: {
    getAll: (): Account[] => {
      return getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    },
    
    getByUserId: (userId: string): Account[] => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      return accounts.filter(account => account.userId === userId);
    },
    
    getById: (accountId: string): Account | null => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      return accounts.find(account => account.id === accountId) || null;
    },
    
    create: (accountData: Omit<Account, 'id'>): Account => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      
      const newAccount: Account = {
        ...accountData,
        id: generateSecureId()
      };
      
      setItem(STORAGE_KEYS.ACCOUNTS, [...accounts, newAccount]);
      return newAccount;
    },
    
    update: (accountId: string, accountData: Partial<Account>): Account => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      const accountIndex = accounts.findIndex(account => account.id === accountId);
      
      if (accountIndex === -1) {
        throw new Error('Account not found');
      }
      
      const updatedAccount = {
        ...accounts[accountIndex],
        ...accountData
      };
      
      accounts[accountIndex] = updatedAccount;
      setItem(STORAGE_KEYS.ACCOUNTS, accounts);
      
      return updatedAccount;
    },
    
    delete: (accountId: string): void => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      const filteredAccounts = accounts.filter(account => account.id !== accountId);
      
      if (accounts.length === filteredAccounts.length) {
        throw new Error('Account not found');
      }
      
      setItem(STORAGE_KEYS.ACCOUNTS, filteredAccounts);
    }
  },
  
  // Transaction operations
  transactions: {
    getByAccountId: (accountId: string): Transaction[] => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      const account = accounts.find(account => account.id === accountId);
      
      return account?.transactions || [];
    },
    
    create: (accountId: string, transactionData: Omit<Transaction, 'id'>): Transaction => {
      const accounts = getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
      const accountIndex = accounts.findIndex(account => account.id === accountId);
      
      if (accountIndex === -1) {
        throw new Error('Account not found');
      }
      
      const newTransaction: Transaction = {
        ...transactionData,
        id: generateSecureId()
      };
      
      // Update account with new transaction
      const account = accounts[accountIndex];
      const updatedAccount = {
        ...account,
        transactions: [newTransaction, ...account.transactions],
        balance: account.balance + (transactionData.amount || 0),
        lastActivityDate: new Date().toISOString()
      };
      
      accounts[accountIndex] = updatedAccount;
      setItem(STORAGE_KEYS.ACCOUNTS, accounts);
      
      return newTransaction;
    }
  },
  
  // Savings goals operations
  savingsGoals: {
    getAll: (): SavingsGoal[] => {
      return getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
    },
    
    getByUserId: (userId: string): SavingsGoal[] => {
      const goals = getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
      return goals.filter(goal => goal.userId === userId);
    },
    
    create: (goalData: Omit<SavingsGoal, 'id'>): SavingsGoal => {
      const goals = getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
      
      const newGoal: SavingsGoal = {
        ...goalData,
        id: generateSecureId()
      };
      
      setItem(STORAGE_KEYS.SAVINGS_GOALS, [...goals, newGoal]);
      return newGoal;
    },
    
    update: (goalId: string, goalData: Partial<SavingsGoal>): SavingsGoal => {
      const goals = getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
      const goalIndex = goals.findIndex(goal => goal.id === goalId);
      
      if (goalIndex === -1) {
        throw new Error('Savings goal not found');
      }
      
      const updatedGoal = {
        ...goals[goalIndex],
        ...goalData
      };
      
      goals[goalIndex] = updatedGoal;
      setItem(STORAGE_KEYS.SAVINGS_GOALS, goals);
      
      return updatedGoal;
    },
    
    delete: (goalId: string): void => {
      const goals = getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
      const filteredGoals = goals.filter(goal => goal.id !== goalId);
      
      if (goals.length === filteredGoals.length) {
        throw new Error('Savings goal not found');
      }
      
      setItem(STORAGE_KEYS.SAVINGS_GOALS, filteredGoals);
    }
  }
};
