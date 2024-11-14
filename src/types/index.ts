import { User, Account, Transaction, TransactionCategory, ScheduledPayment, RecurringTransfer, BillPay, MonthlyAnalytics, Address } from './baseTypes';

export interface Card {
  id: string;
  accountId: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED';
  limit?: number;
  availableCredit?: number;
  rewards?: {
    points: number;
    cashback: number;
  };
  transactions: Transaction[];
}

export interface SavingsGoal {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'EMERGENCY' | 'VACATION' | 'HOME' | 'CAR' | 'EDUCATION' | 'RETIREMENT' | 'OTHER';
  autoSave?: {
    amount: number;
    frequency: 'WEEKLY' | 'MONTHLY';
    nextDeduction: string;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  progress: number;
}

export type { User, Account, Transaction, TransactionCategory, ScheduledPayment, RecurringTransfer, BillPay, MonthlyAnalytics, Address };