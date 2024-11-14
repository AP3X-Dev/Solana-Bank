import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Receipt, 
  CreditCard, 
  PiggyBank, 
  Bell, 
  Plus,
  Wallet,
  Settings
} from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: Plus, label: 'New Account', path: '/account/new' },
    { icon: Wallet, label: 'My Accounts', path: '/accounts' },
    { icon: Send, label: 'Send Money', path: '/transfer' },
    { icon: Receipt, label: 'Pay Bills', path: '/bill-pay' },
    { icon: CreditCard, label: 'Cards', path: '/cards' },
    { icon: PiggyBank, label: 'Savings Goals', path: '/goals' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {actions.map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
              <Icon className="text-indigo-600" size={24} />
            </div>
            <span className="text-sm text-gray-700 text-center">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};