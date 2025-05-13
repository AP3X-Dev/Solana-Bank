import React from 'react';
import { Account } from '../types';
import { ArrowUpRight, Wallet, CreditCard, PiggyBank, BarChart2 } from 'lucide-react';
import { Card } from './Card';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  // Get the appropriate icon based on account type
  const getAccountIcon = () => {
    switch (account.type.toLowerCase()) {
      case 'trading':
        return BarChart2;
      case 'hodl':
        return Wallet;
      case 'savings':
        return PiggyBank;
      default:
        return CreditCard;
    }
  };

  // Get the appropriate color based on account type
  const getAccountColor = () => {
    switch (account.type.toLowerCase()) {
      case 'trading':
        return 'blue';
      case 'hodl':
        return 'purple';
      case 'savings':
        return 'teal';
      default:
        return 'gradient';
    }
  };

  return (
    <Card
      icon={getAccountIcon()}
      iconBackground={getAccountColor() as any}
      onClick={onClick}
      hoverable
      className="h-full"
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-light-text">{account.name || 'Solana Wallet'}</h3>
          <ArrowUpRight size={18} className="text-muted-text" />
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold bg-solana-gradient bg-clip-text text-transparent">
            {account.balance.toFixed(4)} SOL
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center pt-2 border-t border-dark-light">
          <span className="text-muted-text font-mono text-xs">
            {account.accountNumber.slice(0, 4)}...{account.accountNumber.slice(-4)}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-dark-light text-muted-text capitalize">
            {account.type.toLowerCase()}
          </span>
        </div>
      </div>
    </Card>
  );
};