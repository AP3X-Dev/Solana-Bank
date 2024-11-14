import React from 'react';
import { Account } from '../types';
import { formatCurrency } from '../utils/format';
import { Wallet, ExternalLink } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow relative group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="text-indigo-600" size={24} />
          <h3 className="text-lg font-semibold">{account.name || 'Solana Wallet'}</h3>
        </div>
        <ExternalLink 
          size={20} 
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div>
        <div className="text-2xl font-bold text-indigo-600 mb-2">
          {account.balance.toFixed(4)} SOL
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-mono text-sm">
            {account.accountNumber.slice(0, 4)}...{account.accountNumber.slice(-4)}
          </span>
          <span className="text-sm text-gray-500 capitalize">
            {account.type.toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  );
};