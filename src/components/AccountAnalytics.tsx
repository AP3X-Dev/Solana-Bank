import React from 'react';
import { Account, TransactionCategory } from '../types';
import { formatCurrency } from '../utils/format';
import { PieChart, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';
import { Card } from './Card';

interface AccountAnalyticsProps {
  account: Account;
}

export const AccountAnalytics: React.FC<AccountAnalyticsProps> = ({ account }) => {
  const calculateMonthlyAnalytics = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = account.transactions.filter(t =>
      new Date(t.date) >= monthStart
    );

    const income = monthlyTransactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryBreakdown = monthlyTransactions.reduce((acc, t) => {
      if (t.category && t.type === 'WITHDRAWAL') {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      }
      return acc;
    }, {} as Record<TransactionCategory, number>);

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      categoryBreakdown,
      savingsRate
    };
  };

  const analytics = calculateMonthlyAnalytics();

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <PieChart className="text-muted-text mr-2" size={16} />
          <h3 className="text-sm font-medium text-light-text">Monthly Analytics</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <DollarSign className="text-green-500" size={14} />
              <h4 className="text-xs font-medium text-muted-text">Total Income</h4>
            </div>
            <p className="text-lg font-bold text-green-500">
              ${analytics.totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <DollarSign className="text-red-500" size={14} />
              <h4 className="text-xs font-medium text-muted-text">Total Expenses</h4>
            </div>
            <p className="text-lg font-bold text-red-500">
              ${analytics.totalExpenses.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <ArrowUpRight className="text-blue-500" size={14} />
              <h4 className="text-xs font-medium text-muted-text">Savings Rate</h4>
            </div>
            <p className="text-lg font-bold text-blue-500">
              {analytics.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {Object.keys(analytics.categoryBreakdown).length > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-light">
            <h4 className="text-xs font-medium text-muted-text mb-2">Expense Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(analytics.categoryBreakdown).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-xs text-muted-text">{category}</span>
                  <span className="text-xs font-medium text-light-text">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};