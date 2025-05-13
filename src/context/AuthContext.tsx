import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { User } from '../types';
import { fallbackService } from '../services/fallbackService';
import {
  authenticateWithWallet,
  isAuthSessionValid,
  clearAuthSession,
  getOrCreateUser
} from '../services/authService';
import { WALLET_CONFIG } from '../config/appConfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  loginWithWallet: () => Promise<boolean>;
  logout: () => void;
  registerWithWallet: (userData: Omit<User, 'id' | 'walletAddress'>) => Promise<boolean>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const isAuthenticated = !!user && isAuthSessionValid();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have a valid session
        if (isAuthSessionValid()) {
          console.log("Valid auth session found during initialization");

          // Try to get user from local storage
          if (wallet.publicKey) {
            const user = await getOrCreateUser(wallet);
            if (user) {
              console.log("User found during initialization");
              setUser(user);
            } else {
              console.log("No user found, clearing session");
              clearAuthSession();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [wallet.publicKey]);

  // Handle wallet connection changes
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (wallet.connected && wallet.publicKey && !user) {
        try {
          // Try to find existing user
          const existingUser = fallbackService.users.getByWalletAddress(wallet.publicKey.toString());

          if (existingUser) {
            // Auto-login if we have the user locally
            await loginWithWallet();
          }
        } catch (error) {
          console.error('Error handling wallet connection:', error);
        }
      }
    };

    handleWalletConnection();
  }, [wallet.connected, wallet.publicKey, user]);

  const loginWithWallet = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!wallet.connected || !wallet.publicKey) {
        setError('Wallet not connected');
        return false;
      }

      console.log("Attempting to login with wallet:", wallet.publicKey.toString());

      // Check if we already have a valid session
      if (isAuthSessionValid()) {
        console.log("Valid auth session found, getting user data");

        // Get user data without requiring a new signature
        const user = await getOrCreateUser(wallet);
        if (user) {
          console.log("User found, setting user without signature");
          setUser(user);
          return true;
        }
      }

      // In development mode, bypass signature verification
      if (WALLET_CONFIG.SKIP_SIGNATURE_VERIFICATION) {
        console.log("DEV MODE: Bypassing signature verification");

        // Authenticate without signature
        const user = await authenticateWithWallet(wallet);
        if (user) {
          console.log("DEV MODE: User authenticated without signature");
          setUser(user);
          return true;
        }
      } else {
        // This would be the normal authentication flow with signature
        // But we're not using it in development mode
        console.log("Production mode authentication not implemented");
        setError("Authentication not implemented in production mode");
        return false;
      }

      // If we get here, authentication failed
      setError('Authentication failed. Please try again.');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setError(`Login failed: ${error.message || 'Unknown error'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithWallet = async (userData: Omit<User, 'id' | 'walletAddress'>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!wallet.connected || !wallet.publicKey) {
        setError('Wallet not connected');
        return false;
      }

      // Check if user already exists
      const existingUser = fallbackService.users.getByWalletAddress(wallet.publicKey.toString());
      if (existingUser) {
        setError('User with this wallet already exists');
        return false;
      }

      // In development mode, bypass signature verification
      if (WALLET_CONFIG.SKIP_SIGNATURE_VERIFICATION) {
        console.log("DEV MODE: Creating user without signature verification");

        // Create new user with wallet address
        const newUserData: Omit<User, 'id'> = {
          ...userData,
          walletAddress: wallet.publicKey.toString(),
          notifications: [],
          preferences: {
            theme: 'light',
            notificationsEnabled: true,
            twoFactorEnabled: false
          }
        };

        // Create user in local storage
        const newUser = fallbackService.users.create(newUserData);

        // Create auth session
        createAuthSession(wallet.publicKey.toString());

        // Set as current user
        setUser(newUser);
        fallbackService.users.setCurrentUser(newUser);

        console.log("DEV MODE: User created successfully");
        return true;
      } else {
        // This would be the normal registration flow with signature
        // But we're not using it in development mode
        console.log("Production mode registration not implemented");
        setError("Registration not implemented in production mode");
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setError('Not authenticated');
        return false;
      }

      // Update user in local storage
      const updatedUserData = {
        ...user,
        ...userData
      };

      // Update in local storage
      const updatedUser = fallbackService.users.update(updatedUserData);
      fallbackService.users.setCurrentUser(updatedUser);

      // Update state
      setUser(updatedUser);
      console.log("User profile updated successfully");

      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Profile update failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthSession(); // Clear the auth session
    fallbackService.users.setCurrentUser(null);

    if (wallet.connected) {
      wallet.disconnect();
    }

    console.log("User logged out, all sessions cleared");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      loginWithWallet,
      logout,
      registerWithWallet,
      updateUserProfile,
      isAuthenticated
    }}>
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

// Create a protected route HOC
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithAuth: React.FC<P> = (props) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate('/login', { replace: true });
      }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>;
    }

    return isAuthenticated ? <Component {...props} /> : null;
  };

  return WithAuth;
};