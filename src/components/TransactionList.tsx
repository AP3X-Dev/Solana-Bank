import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, ArrowRight } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownRight className="text-green-500" size={20} />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="text-red-500" size={20} />;
      case 'TRANSFER':
        return <ArrowLeftRight className="text-blue-500" size={20} />;
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return 'text-green-600';
      case 'WITHDRAWAL':
        return 'text-red-600';
      case 'TRANSFER':
        return 'text-blue-600';
    }
  };

  return (
    <div>
      {transactions.length === 0 ? (
        <div className="p-6 text-center text-muted-text">No transactions found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-dark-light">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-text uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-text uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-text uppercase">Description</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-text uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-light">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-dark-light/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {transaction.type === 'TRANSFER' && (
                        <ArrowRight size={14} className="text-blue-500" />
                      )}
                      <span className="ml-2 text-xs text-muted-text uppercase">{transaction.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-text">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-xs text-light-text">
                    {transaction.description}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-xs font-medium text-right ${getAmountColor(transaction.type)}`}>
                    {transaction.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};