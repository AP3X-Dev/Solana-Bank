import React from 'react';
import { Account, TransactionCategory } from '../types';
import { formatCurrency } from '../utils/format';
import { PieChart, TrendingUp, DollarSign } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <PieChart className="mr-2" size={20} />
        Monthly Analytics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <DollarSign className="text-green-600" size={20} />
            <h4 className="text-sm font-medium text-green-800">Total Income</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(analytics.totalIncome)}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <DollarSign className="text-red-600" size={20} />
            <h4 className="text-sm font-medium text-red-800">Total Expenses</h4>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(analytics.totalExpenses)}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingUp className="text-blue-600" size={20} />
            <h4 className="text-sm font-medium text-blue-800">Savings Rate</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {analytics.savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {Object.keys(analytics.categoryBreakdown).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Expense Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(analytics.categoryBreakdown).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};