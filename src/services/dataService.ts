import { User, Account, Transaction, SavingsGoal, Card } from '../types';
import { api, ApiError, AuthenticationError } from './api';
import { fallbackService, OfflineOperation } from './fallbackService';
import { generateSecureId } from '../utils/security';

/**
 * Unified data service that tries the API first and falls back to local storage if needed
 * Provides offline support and data synchronization
 */

// Service state
let isOnline = navigator.onLine;
let isSyncing = false;

// Update online status when it changes
window.addEventListener('online', () => {
  isOnline = true;
  syncOfflineOperations();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

// Queue for offline operations
const queueOfflineOperation = (
  endpoint: string,
  method: string,
  data: any
): void => {
  try {
    const offlineQueue = JSON.parse(
      localStorage.getItem('solana_bank_offline_queue') || '[]'
    ) as OfflineOperation[];

    const operation: OfflineOperation = {
      id: generateSecureId(),
      timestamp: Date.now(),
      endpoint,
      method,
      data,
      retryCount: 0
    };

    offlineQueue.push(operation);
    localStorage.setItem('solana_bank_offline_queue', JSON.stringify(offlineQueue));
  } catch (error) {
    console.error('Error queueing offline operation:', error);
  }
};

// Sync offline operations when back online
const syncOfflineOperations = async (): Promise<void> => {
  if (!isOnline || isSyncing) return;

  try {
    isSyncing = true;

    const offlineQueue = JSON.parse(
      localStorage.getItem('solana_bank_offline_queue') || '[]'
    ) as OfflineOperation[];

    if (offlineQueue.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`Syncing ${offlineQueue.length} offline operations...`);

    // Sort by timestamp (oldest first)
    offlineQueue.sort((a, b) => a.timestamp - b.timestamp);

    const remainingOperations: OfflineOperation[] = [];

    for (const operation of offlineQueue) {
      try {
        // Process operation based on endpoint and method
        await processOfflineOperation(operation);
      } catch (error) {
        console.error(`Error processing offline operation ${operation.id}:`, error);

        // Increment retry count and keep in queue if under max retries
        if (operation.retryCount < 3) {
          remainingOperations.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        }
      }
    }

    // Update offline queue with remaining operations
    localStorage.setItem('solana_bank_offline_queue', JSON.stringify(remainingOperations));

    console.log(`Sync complete. ${offlineQueue.length - remainingOperations.length} operations processed, ${remainingOperations.length} remaining.`);
  } catch (error) {
    console.error('Error syncing offline operations:', error);
  } finally {
    isSyncing = false;
  }
};

// Process a single offline operation
const processOfflineOperation = async (operation: OfflineOperation): Promise<void> => {
  const { endpoint, method, data } = operation;

  // Handle different endpoints
  if (endpoint.startsWith('/users')) {
    if (endpoint === '/users/me' && method === 'PATCH') {
      await api.users.update(data);
    }
  } else if (endpoint.startsWith('/accounts')) {
    if (method === 'POST') {
      await api.accounts.create(data);
    } else if (method === 'PATCH') {
      const accountId = endpoint.split('/')[2];
      await api.accounts.update(accountId, data);
    }
  } else if (endpoint.includes('/transactions')) {
    if (method === 'POST') {
      const accountId = endpoint.split('/')[2];
      await api.transactions.create(accountId, data);
    }
  } else if (endpoint.startsWith('/savings-goals')) {
    if (method === 'POST') {
      await api.savingsGoals.create(data);
    } else if (method === 'PATCH') {
      const goalId = endpoint.split('/')[2];
      await api.savingsGoals.update(goalId, data);
    } else if (method === 'DELETE') {
      const goalId = endpoint.split('/')[2];
      await api.savingsGoals.delete(goalId);
    }
  }
};

// Unified data service
export const dataService = {
  // User operations
  users: {
    getCurrentUser: async (): Promise<User | null> => {
      // First check local storage for a user
      const localUser = fallbackService.users.getCurrentUser();
      if (localUser) {
        return localUser;
      }

      // Only try API if local storage doesn't have a user and we're online
      try {
        if (isOnline) {
          // Disable API calls for now since we don't have a real API
          // return await api.users.getCurrent();
          return null;
        }
      } catch (error) {
        if (!(error instanceof AuthenticationError)) {
          console.error('Error getting current user from API:', error);
        }
      }

      return null;
    },

    update: async (userData: Partial<User>): Promise<User> => {
      try {
        if (isOnline) {
          return await api.users.update(userData);
        }
      } catch (error) {
        console.error('Error updating user in API:', error);
        queueOfflineOperation('/users/me', 'PATCH', userData);
      }

      const currentUser = fallbackService.users.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user found');
      }

      return fallbackService.users.update(currentUser.id, userData);
    }
  },

  // Account operations
  accounts: {
    getAll: async (): Promise<Account[]> => {
      try {
        if (isOnline) {
          return await api.accounts.getAll();
        }
      } catch (error) {
        console.error('Error getting accounts from API:', error);
      }

      const currentUser = fallbackService.users.getCurrentUser();
      return currentUser ? fallbackService.accounts.getByUserId(currentUser.id) : [];
    },

    getById: async (accountId: string): Promise<Account | null> => {
      try {
        if (isOnline) {
          return await api.accounts.getById(accountId);
        }
      } catch (error) {
        console.error(`Error getting account ${accountId} from API:`, error);
      }

      return fallbackService.accounts.getById(accountId);
    },

    create: async (accountData: Omit<Account, 'id'>): Promise<Account> => {
      try {
        if (isOnline) {
          return await api.accounts.create(accountData);
        }
      } catch (error) {
        console.error('Error creating account in API:', error);
        queueOfflineOperation('/accounts', 'POST', accountData);
      }

      return fallbackService.accounts.create(accountData);
    },

    update: async (accountId: string, accountData: Partial<Account>): Promise<Account> => {
      try {
        if (isOnline) {
          return await api.accounts.update(accountId, accountData);
        }
      } catch (error) {
        console.error(`Error updating account ${accountId} in API:`, error);
        queueOfflineOperation(`/accounts/${accountId}`, 'PATCH', accountData);
      }

      return fallbackService.accounts.update(accountId, accountData);
    }
  },

  // Transaction operations
  transactions: {
    getByAccountId: async (accountId: string): Promise<Transaction[]> => {
      try {
        if (isOnline) {
          return await api.transactions.getByAccountId(accountId);
        }
      } catch (error) {
        console.error(`Error getting transactions for account ${accountId} from API:`, error);
      }

      return fallbackService.transactions.getByAccountId(accountId);
    },

    create: async (accountId: string, transactionData: Omit<Transaction, 'id'>): Promise<Transaction> => {
      try {
        if (isOnline) {
          return await api.transactions.create(accountId, transactionData);
        }
      } catch (error) {
        console.error(`Error creating transaction for account ${accountId} in API:`, error);
        queueOfflineOperation(`/accounts/${accountId}/transactions`, 'POST', transactionData);
      }

      return fallbackService.transactions.create(accountId, transactionData);
    }
  },

  // Savings goals operations
  savingsGoals: {
    getAll: async (): Promise<SavingsGoal[]> => {
      try {
        if (isOnline) {
          return await api.savingsGoals.getAll();
        }
      } catch (error) {
        console.error('Error getting savings goals from API:', error);
      }

      const currentUser = fallbackService.users.getCurrentUser();
      return currentUser ? fallbackService.savingsGoals.getByUserId(currentUser.id) : [];
    },

    create: async (goalData: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> => {
      try {
        if (isOnline) {
          return await api.savingsGoals.create(goalData);
        }
      } catch (error) {
        console.error('Error creating savings goal in API:', error);
        queueOfflineOperation('/savings-goals', 'POST', goalData);
      }

      return fallbackService.savingsGoals.create(goalData);
    },

    update: async (goalId: string, goalData: Partial<SavingsGoal>): Promise<SavingsGoal> => {
      try {
        if (isOnline) {
          return await api.savingsGoals.update(goalId, goalData);
        }
      } catch (error) {
        console.error(`Error updating savings goal ${goalId} in API:`, error);
        queueOfflineOperation(`/savings-goals/${goalId}`, 'PATCH', goalData);
      }

      return fallbackService.savingsGoals.update(goalId, goalData);
    },

    delete: async (goalId: string): Promise<void> => {
      try {
        if (isOnline) {
          return await api.savingsGoals.delete(goalId);
        }
      } catch (error) {
        console.error(`Error deleting savings goal ${goalId} in API:`, error);
        queueOfflineOperation(`/savings-goals/${goalId}`, 'DELETE', null);
      }

      return fallbackService.savingsGoals.delete(goalId);
    }
  },

  // Sync operations
  sync: {
    syncOfflineOperations
  }
};
