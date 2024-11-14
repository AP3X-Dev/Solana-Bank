import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut } from 'lucide-react';
import { WalletButton } from './WalletButton';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-indigo-600 text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2" onClick={() => navigate('/')} role="button">
            <Building2 size={24} />
            <span className="text-xl font-bold">SolanaBank</span>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <WalletButton />
              <span>Welcome, {user.firstName}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 hover:text-indigo-200"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};