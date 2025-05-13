import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Receipt,
  CreditCard,
  PiggyBank,
  Bell,
  Plus,
  LayoutGrid,
  Settings
} from 'lucide-react';
import { Card } from './Card';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'New Account',
      path: '/account/new',
      color: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      icon: LayoutGrid,
      label: 'My Accounts',
      path: '/accounts',
      color: 'bg-indigo-500/10',
      textColor: 'text-indigo-500'
    },
    {
      icon: Send,
      label: 'Send Money',
      path: '/transfer',
      color: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    },
    {
      icon: Receipt,
      label: 'Pay Bills',
      path: '/bill-pay',
      color: 'bg-teal-500/10',
      textColor: 'text-teal-500'
    },
    {
      icon: CreditCard,
      label: 'Cards',
      path: '/cards',
      color: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      icon: PiggyBank,
      label: 'Savings Goals',
      path: '/goals',
      color: 'bg-indigo-500/10',
      textColor: 'text-indigo-500'
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
      color: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      color: 'bg-teal-500/10',
      textColor: 'text-teal-500'
    },
  ];

  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-4 gap-4">
        {actions.map(({ icon: Icon, label, path, color, textColor }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-dark-light transition-colors"
          >
            <div className={`p-3 ${color} rounded-full mb-2 ${textColor}`}>
              <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-light-text text-center">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};