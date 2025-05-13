import { Transaction, Account, MonthlyAnalytics, TransactionCategory, TokenBalance } from '../types';
import { dataService } from './dataService';

// Time periods for analytics
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

// Transaction analytics
export interface TransactionAnalytics {
  totalTransactions: number;
  totalVolume: number;
  averageAmount: number;
  largestTransaction: number;
  smallestTransaction: number;
  successRate: number;
  failureRate: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory?: Record<string, number>;
  timeline: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
}

// Portfolio analytics
export interface PortfolioAnalytics {
  totalBalance: number;
  solBalance: number;
  tokenBalance: number;
  tokenCount: number;
  topTokens: TokenBalance[];
  allocation: Array<{
    asset: string;
    amount: number;
    percentage: number;
  }>;
  performance: {
    day: number;
    week: number;
    month: number;
    quarter: number;
    year: number;
    allTime: number;
  };
  riskScore: number;
  diversificationScore: number;
}

// Spending analytics
export interface SpendingAnalytics {
  totalSpending: number;
  averageDailySpending: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthOverMonth: number;
  yearOverYear: number;
  spendingTrend: Array<{
    date: string;
    amount: number;
  }>;
  budgetStatus: Array<{
    category: string;
    spent: number;
    limit: number;
    percentage: number;
  }>;
}

// Analytics service
export const analyticsService = {
  /**
   * Get transaction analytics for a user
   */
  getTransactionAnalytics: async (
    userId: string,
    period: TimePeriod = 'month'
  ): Promise<TransactionAnalytics> => {
    try {
      // Get all accounts for the user
      const accounts = await dataService.accounts.getAll();
      const userAccounts = accounts.filter(account => account.userId === userId);
      
      // Get all transactions from all accounts
      let allTransactions: Transaction[] = [];
      for (const account of userAccounts) {
        const transactions = await dataService.transactions.getByAccountId(account.id);
        allTransactions = [...allTransactions, ...transactions];
      }
      
      // Filter transactions by time period
      const filteredTransactions = filterTransactionsByPeriod(allTransactions, period);
      
      // Calculate analytics
      const analytics = calculateTransactionAnalytics(filteredTransactions);
      
      return analytics;
    } catch (error) {
      console.error('Error getting transaction analytics:', error);
      throw error;
    }
  },
  
  /**
   * Get portfolio analytics for a user
   */
  getPortfolioAnalytics: async (
    userId: string
  ): Promise<PortfolioAnalytics> => {
    try {
      // Get all accounts for the user
      const accounts = await dataService.accounts.getAll();
      const userAccounts = accounts.filter(account => account.userId === userId);
      
      // Calculate portfolio analytics
      const analytics = calculatePortfolioAnalytics(userAccounts);
      
      return analytics;
    } catch (error) {
      console.error('Error getting portfolio analytics:', error);
      throw error;
    }
  },
  
  /**
   * Get spending analytics for a user
   */
  getSpendingAnalytics: async (
    userId: string,
    period: TimePeriod = 'month'
  ): Promise<SpendingAnalytics> => {
    try {
      // Get all accounts for the user
      const accounts = await dataService.accounts.getAll();
      const userAccounts = accounts.filter(account => account.userId === userId);
      
      // Get all transactions from all accounts
      let allTransactions: Transaction[] = [];
      for (const account of userAccounts) {
        const transactions = await dataService.transactions.getByAccountId(account.id);
        allTransactions = [...allTransactions, ...transactions];
      }
      
      // Filter transactions by time period
      const filteredTransactions = filterTransactionsByPeriod(allTransactions, period);
      
      // Calculate spending analytics
      const analytics = calculateSpendingAnalytics(filteredTransactions, period);
      
      return analytics;
    } catch (error) {
      console.error('Error getting spending analytics:', error);
      throw error;
    }
  },
  
  /**
   * Get monthly analytics for a user
   */
  getMonthlyAnalytics: async (
    userId: string,
    month: string
  ): Promise<MonthlyAnalytics> => {
    try {
      // Get all accounts for the user
      const accounts = await dataService.accounts.getAll();
      const userAccounts = accounts.filter(account => account.userId === userId);
      
      // Get all transactions from all accounts
      let allTransactions: Transaction[] = [];
      for (const account of userAccounts) {
        const transactions = await dataService.transactions.getByAccountId(account.id);
        allTransactions = [...allTransactions, ...transactions];
      }
      
      // Filter transactions by month
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
      
      const filteredTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= startDate && txDate <= endDate;
      });
      
      // Calculate monthly analytics
      const analytics = calculateMonthlyAnalytics(filteredTransactions, month);
      
      return analytics;
    } catch (error) {
      console.error('Error getting monthly analytics:', error);
      throw error;
    }
  }
};

/**
 * Filter transactions by time period
 */
const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod
): Transaction[] => {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      return transactions;
  }
  
  return transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return txDate >= startDate && txDate <= now;
  });
};

/**
 * Calculate transaction analytics
 */
const calculateTransactionAnalytics = (
  transactions: Transaction[]
): TransactionAnalytics => {
  // Initialize analytics
  const analytics: TransactionAnalytics = {
    totalTransactions: transactions.length,
    totalVolume: 0,
    averageAmount: 0,
    largestTransaction: 0,
    smallestTransaction: 0,
    successRate: 0,
    failureRate: 0,
    byType: {},
    byStatus: {},
    byCategory: {},
    timeline: []
  };
  
  // Return empty analytics if no transactions
  if (transactions.length === 0) {
    return analytics;
  }
  
  // Calculate total volume and find largest/smallest transaction
  let totalAmount = 0;
  let largestAmount = 0;
  let smallestAmount = Number.MAX_VALUE;
  
  for (const tx of transactions) {
    const amount = Math.abs(tx.amount);
    totalAmount += amount;
    
    if (amount > largestAmount) {
      largestAmount = amount;
    }
    
    if (amount < smallestAmount) {
      smallestAmount = amount;
    }
    
    // Count by type
    analytics.byType[tx.type] = (analytics.byType[tx.type] || 0) + 1;
    
    // Count by status
    analytics.byStatus[tx.status] = (analytics.byStatus[tx.status] || 0) + 1;
    
    // Count by category
    if (tx.category) {
      analytics.byCategory![tx.category] = (analytics.byCategory![tx.category] || 0) + 1;
    }
  }
  
  // Calculate success and failure rates
  const successStatuses = ['confirmed', 'finalized', 'completed'];
  const failureStatuses = ['failed', 'timeout', 'rejected', 'cancelled'];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const status of successStatuses) {
    successCount += analytics.byStatus[status] || 0;
  }
  
  for (const status of failureStatuses) {
    failureCount += analytics.byStatus[status] || 0;
  }
  
  analytics.successRate = successCount / transactions.length;
  analytics.failureRate = failureCount / transactions.length;
  
  // Calculate average amount
  analytics.totalVolume = totalAmount;
  analytics.averageAmount = totalAmount / transactions.length;
  analytics.largestTransaction = largestAmount;
  analytics.smallestTransaction = smallestAmount;
  
  // Generate timeline
  const timelineMap = new Map<string, { count: number; volume: number }>();
  
  for (const tx of transactions) {
    const date = tx.timestamp.split('T')[0];
    const existing = timelineMap.get(date) || { count: 0, volume: 0 };
    
    timelineMap.set(date, {
      count: existing.count + 1,
      volume: existing.volume + Math.abs(tx.amount)
    });
  }
  
  // Sort timeline by date
  analytics.timeline = Array.from(timelineMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      volume: data.volume
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return analytics;
};

/**
 * Calculate portfolio analytics
 */
const calculatePortfolioAnalytics = (
  accounts: Account[]
): PortfolioAnalytics => {
  // Initialize analytics
  const analytics: PortfolioAnalytics = {
    totalBalance: 0,
    solBalance: 0,
    tokenBalance: 0,
    tokenCount: 0,
    topTokens: [],
    allocation: [],
    performance: {
      day: 0,
      week: 0,
      month: 0,
      quarter: 0,
      year: 0,
      allTime: 0
    },
    riskScore: 0,
    diversificationScore: 0
  };
  
  // Return empty analytics if no accounts
  if (accounts.length === 0) {
    return analytics;
  }
  
  // Calculate total balance
  let totalBalance = 0;
  let solBalance = 0;
  let tokenBalance = 0;
  let tokenCount = 0;
  const allTokens: TokenBalance[] = [];
  
  for (const account of accounts) {
    totalBalance += account.balance;
    
    if (account.solBalance) {
      solBalance += account.solBalance;
    }
    
    if (account.tokenBalances) {
      for (const token of account.tokenBalances) {
        tokenCount++;
        tokenBalance += token.value || 0;
        allTokens.push(token);
      }
    }
  }
  
  // Sort tokens by value
  allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
  
  // Get top tokens
  analytics.topTokens = allTokens.slice(0, 5);
  
  // Calculate allocation
  const allocation: Array<{ asset: string; amount: number; percentage: number }> = [];
  
  // Add SOL allocation
  if (solBalance > 0) {
    allocation.push({
      asset: 'SOL',
      amount: solBalance,
      percentage: solBalance / totalBalance
    });
  }
  
  // Add token allocations
  for (const token of analytics.topTokens) {
    allocation.push({
      asset: token.symbol || token.mint.slice(0, 8),
      amount: token.value || 0,
      percentage: (token.value || 0) / totalBalance
    });
  }
  
  // Calculate risk and diversification scores
  // This is a simplified calculation
  const diversificationScore = Math.min(1, tokenCount / 10) * 100;
  const riskScore = 50; // Default medium risk
  
  // Update analytics
  analytics.totalBalance = totalBalance;
  analytics.solBalance = solBalance;
  analytics.tokenBalance = tokenBalance;
  analytics.tokenCount = tokenCount;
  analytics.allocation = allocation;
  analytics.riskScore = riskScore;
  analytics.diversificationScore = diversificationScore;
  
  return analytics;
};

/**
 * Calculate spending analytics
 */
const calculateSpendingAnalytics = (
  transactions: Transaction[],
  period: TimePeriod
): SpendingAnalytics => {
  // Initialize analytics
  const analytics: SpendingAnalytics = {
    totalSpending: 0,
    averageDailySpending: 0,
    topCategories: [],
    monthOverMonth: 0,
    yearOverYear: 0,
    spendingTrend: [],
    budgetStatus: []
  };
  
  // Return empty analytics if no transactions
  if (transactions.length === 0) {
    return analytics;
  }
  
  // Filter out income transactions
  const spendingTransactions = transactions.filter(tx => tx.amount < 0);
  
  // Calculate total spending
  let totalSpending = 0;
  for (const tx of spendingTransactions) {
    totalSpending += Math.abs(tx.amount);
  }
  
  // Calculate average daily spending
  const days = getPeriodDays(period);
  const averageDailySpending = totalSpending / days;
  
  // Calculate spending by category
  const categorySpending: Record<string, number> = {};
  for (const tx of spendingTransactions) {
    const category = tx.category || 'OTHER';
    categorySpending[category] = (categorySpending[category] || 0) + Math.abs(tx.amount);
  }
  
  // Sort categories by spending
  const topCategories = Object.entries(categorySpending)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: amount / totalSpending
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  // Generate spending trend
  const trendMap = new Map<string, number>();
  for (const tx of spendingTransactions) {
    const date = tx.timestamp.split('T')[0];
    const existing = trendMap.get(date) || 0;
    trendMap.set(date, existing + Math.abs(tx.amount));
  }
  
  // Sort trend by date
  const spendingTrend = Array.from(trendMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Update analytics
  analytics.totalSpending = totalSpending;
  analytics.averageDailySpending = averageDailySpending;
  analytics.topCategories = topCategories;
  analytics.spendingTrend = spendingTrend;
  
  return analytics;
};

/**
 * Calculate monthly analytics
 */
const calculateMonthlyAnalytics = (
  transactions: Transaction[],
  month: string
): MonthlyAnalytics => {
  // Initialize analytics
  const analytics: MonthlyAnalytics = {
    month,
    totalIncome: 0,
    totalExpenses: 0,
    categoryBreakdown: {} as Record<TransactionCategory, number>,
    savingsRate: 0,
    monthOverMonthGrowth: 0,
    topExpenseCategories: [],
    budgetStatus: []
  };
  
  // Return empty analytics if no transactions
  if (transactions.length === 0) {
    return analytics;
  }
  
  // Calculate income and expenses
  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpending: Record<string, number> = {};
  
  for (const tx of transactions) {
    if (tx.amount > 0) {
      totalIncome += tx.amount;
    } else {
      totalExpenses += Math.abs(tx.amount);
      
      const category = tx.category || 'OTHER';
      categorySpending[category] = (categorySpending[category] || 0) + Math.abs(tx.amount);
    }
  }
  
  // Calculate savings rate
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  
  // Sort categories by spending
  const topExpenseCategories = Object.entries(categorySpending)
    .map(([category, amount]) => ({
      category: category as TransactionCategory,
      amount,
      percentage: amount / totalExpenses
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  // Update analytics
  analytics.totalIncome = totalIncome;
  analytics.totalExpenses = totalExpenses;
  analytics.categoryBreakdown = categorySpending as Record<TransactionCategory, number>;
  analytics.savingsRate = savingsRate;
  analytics.topExpenseCategories = topExpenseCategories;
  
  return analytics;
};

/**
 * Get number of days in a period
 */
const getPeriodDays = (period: TimePeriod): number => {
  switch (period) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'quarter':
      return 90;
    case 'year':
      return 365;
    case 'all':
    default:
      return 365; // Default to a year
  }
};
