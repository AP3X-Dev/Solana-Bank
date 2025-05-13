import { User, Account, Transaction, SavingsGoal, Card } from '../types';
import { SecuritySession, validateSecuritySession, extendSecuritySession } from '../utils/security';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.solanabank.example.com/v1';
const API_TIMEOUT = 15000; // 15 seconds

// Error types
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

// Request helpers
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Add authentication if available
  const sessionData = sessionStorage.getItem('solana_bank_session');
  if (sessionData) {
    try {
      const session: SecuritySession = JSON.parse(sessionData);
      headers['Authorization'] = `Bearer ${session.signature}`;
      headers['X-Wallet-Address'] = session.publicKey;
    } catch (error) {
      console.error('Error parsing session data:', error);
    }
  }
  
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthenticationError();
    }
    
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Ignore JSON parsing errors
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  // Extend session on successful API call
  if (validateSecuritySession()) {
    extendSecuritySession();
  }
  
  return response.json();
};

const fetchWithTimeout = async (
  url: string, 
  options: RequestInit
): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw error;
  }
};

// API Service
export const api = {
  // Auth endpoints
  auth: {
    login: async (walletAddress: string, signature: string): Promise<User> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ walletAddress, signature })
      });
      
      return handleResponse<User>(response);
    },
    
    register: async (userData: Omit<User, 'id'>): Promise<User> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      
      return handleResponse<User>(response);
    },
    
    logout: async (): Promise<void> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
      });
      
      return handleResponse<void>(response);
    }
  },
  
  // User endpoints
  users: {
    getCurrent: async (): Promise<User> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      return handleResponse<User>(response);
    },
    
    update: async (userData: Partial<User>): Promise<User> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      
      return handleResponse<User>(response);
    }
  },
  
  // Account endpoints
  accounts: {
    getAll: async (): Promise<Account[]> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/accounts`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      return handleResponse<Account[]>(response);
    },
    
    getById: async (accountId: string): Promise<Account> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/accounts/${accountId}`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      return handleResponse<Account>(response);
    },
    
    create: async (accountData: Omit<Account, 'id'>): Promise<Account> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(accountData)
      });
      
      return handleResponse<Account>(response);
    },
    
    update: async (accountId: string, accountData: Partial<Account>): Promise<Account> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/accounts/${accountId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(accountData)
      });
      
      return handleResponse<Account>(response);
    }
  },
  
  // Transaction endpoints
  transactions: {
    getByAccountId: async (accountId: string): Promise<Transaction[]> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/accounts/${accountId}/transactions`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      return handleResponse<Transaction[]>(response);
    },
    
    create: async (accountId: string, transactionData: Omit<Transaction, 'id'>): Promise<Transaction> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/accounts/${accountId}/transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transactionData)
      });
      
      return handleResponse<Transaction>(response);
    }
  },
  
  // Savings goals endpoints
  savingsGoals: {
    getAll: async (): Promise<SavingsGoal[]> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/savings-goals`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      return handleResponse<SavingsGoal[]>(response);
    },
    
    create: async (goalData: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/savings-goals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(goalData)
      });
      
      return handleResponse<SavingsGoal>(response);
    },
    
    update: async (goalId: string, goalData: Partial<SavingsGoal>): Promise<SavingsGoal> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/savings-goals/${goalId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(goalData)
      });
      
      return handleResponse<SavingsGoal>(response);
    },
    
    delete: async (goalId: string): Promise<void> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/savings-goals/${goalId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      return handleResponse<void>(response);
    }
  }
};
