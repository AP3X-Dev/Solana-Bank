/**
 * Authentication Service
 * 
 * This service handles wallet authentication with development mode support.
 */

import { WalletContextState } from '@solana/wallet-adapter-react';
import { User } from '../types';
import { fallbackService } from './fallbackService';
import { generateSecureId } from '../utils/security';
import { WALLET_CONFIG } from '../config/appConfig';

// Session storage key
const AUTH_SESSION_KEY = 'solana_bank_auth_session';

// Interface for auth session data
interface AuthSession {
  publicKey: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Create an auth session
 */
export const createAuthSession = (publicKey: string): AuthSession => {
  const now = Date.now();
  const session: AuthSession = {
    publicKey,
    timestamp: now,
    expiresAt: now + WALLET_CONFIG.SESSION_DURATION
  };
  
  // Store in session storage
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
};

/**
 * Check if an auth session is valid
 */
export const isAuthSessionValid = (): boolean => {
  try {
    const sessionData = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData) as AuthSession;
    const now = Date.now();
    return session.expiresAt > now;
  } catch (error) {
    console.error('Error checking auth session:', error);
    return false;
  }
};

/**
 * Clear the auth session
 */
export const clearAuthSession = (): void => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
};

/**
 * Get or create a user for the wallet
 */
export const getOrCreateUser = async (wallet: WalletContextState): Promise<User | null> => {
  if (!wallet.publicKey) return null;
  
  const walletAddress = wallet.publicKey.toString();
  
  // Check if user exists in local storage
  const users = fallbackService.users.getAll();
  let user = users.find(u => u.walletAddress === walletAddress);
  
  if (!user) {
    // Create a new user
    user = {
      id: generateSecureId(),
      walletAddress,
      name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      email: '',
      notifications: [],
      preferences: {
        theme: 'light',
        notificationsEnabled: true,
        twoFactorEnabled: false
      },
      transactions: []
    };
    
    // Save the new user
    fallbackService.users.create(user);
  }
  
  // Set as current user
  fallbackService.users.setCurrentUser(user);
  
  return user;
};

/**
 * Authenticate with wallet (development mode)
 */
export const authenticateWithWallet = async (wallet: WalletContextState): Promise<User | null> => {
  if (!wallet.publicKey) return null;
  
  // In development mode, bypass signature verification
  if (WALLET_CONFIG.SKIP_SIGNATURE_VERIFICATION) {
    // Create auth session
    createAuthSession(wallet.publicKey.toString());
    
    // Get or create user
    return await getOrCreateUser(wallet);
  }
  
  // In production mode, this would verify the signature
  // For now, just return null to indicate authentication failed
  return null;
};
