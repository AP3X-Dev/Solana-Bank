export interface User {
  id: string;
  walletAddress: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: Address;
  notifications: Notification[];
  preferences: UserPreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  twoFactorEnabled: boolean;
  defaultAccount?: string;
}

export interface Notification {
  id: string;
  type: 'ALERT' | 'TRANSFER' | 'SECURITY' | 'PROMOTION';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Account {
  id: string;
  userId: string;
  type: 'trading' | 'hodl' | 'savings' | 'checking' | 'investment' | 'staking';
  balance: number;
  solBalance?: number;
  tokenBalances?: TokenBalance[];
  accountNumber?: string;
  routingNumber?: string;
  transactions: Transaction[];
  scheduledPayments?: ScheduledPayment[];
  recurringTransfers?: RecurringTransfer[];
  name: string;
  description?: string;
  creditLimit?: number;
  interestRate?: number;
  apy?: number;
  status: 'active' | 'frozen' | 'closed';
  visibility: 'visible' | 'hidden';
  isDefault?: boolean;
  openedDate: string;
  lastActivityDate: string;
  riskLevel?: 'low' | 'medium' | 'high';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  name?: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  logo?: string;
  price?: number;
  value?: number;
}

export interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  type: 'transfer' | 'token_transfer' | 'swap' | 'stake' | 'unstake' | 'create_account' | 'close_account' | 'custom' | 'deposit' | 'withdrawal' | 'payment' | 'fee' | 'interest';
  status: 'pending' | 'confirmed' | 'finalized' | 'failed' | 'timeout' | 'rejected' | 'completed' | 'cancelled';
  description?: string;
  category?: TransactionCategory;
  reference?: string;
  fromAccount?: string;
  toAccount?: string;
  sender?: string;
  recipient?: string;
  signature?: string;
  blockTime?: number;
  slot?: number;
  fee?: number;
  confirmations?: number;
  memo?: string;
  tokenAddress?: string;
  tokenAmount?: number;
  tokenDecimals?: number;
  metadata?: Record<string, any>;
}

export type TransactionCategory =
  | 'INCOME'
  | 'SALARY'
  | 'INVESTMENT'
  | 'BILLS'
  | 'UTILITIES'
  | 'RENT'
  | 'MORTGAGE'
  | 'SHOPPING'
  | 'GROCERIES'
  | 'ENTERTAINMENT'
  | 'DINING'
  | 'TRAVEL'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'OTHER';

export interface ScheduledPayment {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  recipient: string;
  recipientAccount: string;
  frequency: 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  nextDate: string;
  category: TransactionCategory;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  metadata?: Record<string, any>;
}

export interface RecurringTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  nextDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
}

export interface BillPay {
  id: string;
  accountId: string;
  payee: {
    name: string;
    accountNumber: string;
    routingNumber: string;
    address?: Address;
  };
  amount: number;
  dueDate: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recurring?: {
    frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    endDate?: string;
  };
}

export interface MonthlyAnalytics {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  categoryBreakdown: Record<TransactionCategory, number>;
  savingsRate: number;
  monthOverMonthGrowth: number;
  topExpenseCategories: Array<{
    category: TransactionCategory;
    amount: number;
    percentage: number;
  }>;
  budgetStatus: {
    category: TransactionCategory;
    spent: number;
    limit: number;
    percentage: number;
  }[];
}