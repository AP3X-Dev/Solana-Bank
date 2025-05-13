import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Home, CreditCard, Send, PiggyBank, Bell, Settings, User, ChevronDown } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { BankLogo } from './BankLogo';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { name: 'Accounts', icon: <CreditCard size={20} />, path: '/accounts' },
    { name: 'Transfer', icon: <Send size={20} />, path: '/transfer' },
    { name: 'Goals', icon: <PiggyBank size={20} />, path: '/goals' },
  ];

  return (
    <header className="bg-dark-card text-light-text border-b border-dark-light">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <BankLogo size="md" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className="flex items-center space-x-1 text-muted-text hover:text-light-text transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* User Actions */}
          {user && (
            <div className="flex items-center space-x-4">
              <WalletButton />

              <div className="hidden md:flex items-center">
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-dark-light transition-colors"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="w-8 h-8 rounded-full bg-solana-gradient flex items-center justify-center text-white font-bold">
                      {user?.firstName ? user.firstName.charAt(0) : 'U'}
                    </div>
                    <span className="hidden lg:inline-block">{user?.firstName || 'User'}</span>
                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-xl shadow-card border border-dark-light z-10">
                      <div className="p-3 border-b border-dark-light">
                        <p className="font-medium">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                        <p className="text-sm text-muted-text truncate">{user?.email || 'No email'}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-dark-light text-left"
                        >
                          <User size={18} />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-dark-light text-left"
                        >
                          <Settings size={18} />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-dark-light text-left text-red-400"
                        >
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-dark-light"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden bg-dark-card border-t border-dark-light">
          <div className="container mx-auto px-4 py-2">
            <div className="space-y-2 py-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-dark-light"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
              <div className="border-t border-dark-light my-2"></div>
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-dark-light"
              >
                <User size={20} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-dark-light"
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-dark-light text-red-400"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};