import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { User } from '../types';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loginWithWallet: () => Promise<boolean>;
  logout: () => void;
  registerWithWallet: (userData: Omit<User, 'id' | 'walletAddress'>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(storage.getCurrentUser());
  const wallet = useWallet();

  useEffect(() => {
    // Check if wallet is connected and user exists
    if (wallet.connected && wallet.publicKey) {
      const users = storage.getUsers();
      const existingUser = users.find(u => u.walletAddress === wallet.publicKey?.toString());
      if (existingUser) {
        setUser(existingUser);
        storage.setCurrentUser(existingUser);
      }
    }
  }, [wallet.connected, wallet.publicKey]);

  const loginWithWallet = async (): Promise<boolean> => {
    if (!wallet.connected || !wallet.publicKey) {
      return false;
    }

    const users = storage.getUsers();
    const existingUser = users.find(u => u.walletAddress === wallet.publicKey?.toString());

    if (existingUser) {
      setUser(existingUser);
      storage.setCurrentUser(existingUser);
      return true;
    }

    return false;
  };

  const registerWithWallet = async (userData: Omit<User, 'id' | 'walletAddress'>): Promise<boolean> => {
    if (!wallet.connected || !wallet.publicKey) {
      return false;
    }

    const users = storage.getUsers();
    if (users.some(u => u.walletAddress === wallet.publicKey?.toString())) {
      return false;
    }

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      walletAddress: wallet.publicKey.toString(),
      notifications: [],
      preferences: {
        theme: 'light',
        notificationsEnabled: true,
        twoFactorEnabled: false
      }
    };

    storage.setUsers([...users, newUser]);
    setUser(newUser);
    storage.setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    storage.setCurrentUser(null);
    if (wallet.connected) {
      wallet.disconnect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginWithWallet, logout, registerWithWallet }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};