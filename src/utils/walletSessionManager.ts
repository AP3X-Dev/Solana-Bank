/**
 * Wallet Session Manager
 * 
 * This utility manages wallet connection sessions to prevent multiple signature requests
 * and improve the user experience when interacting with Solana wallets.
 */

// Session storage key
const WALLET_SESSION_KEY = 'solana_bank_wallet_session';

// Session duration in milliseconds (30 minutes)
const SESSION_DURATION = 30 * 60 * 1000;

// Interface for wallet session data
interface WalletSession {
  publicKey: string;
  timestamp: number;
  expiresAt: number;
  lastSignatureRequest?: number;
}

/**
 * Create or update a wallet session
 */
export const createWalletSession = (publicKey: string): WalletSession => {
  const now = Date.now();
  const session: WalletSession = {
    publicKey,
    timestamp: now,
    expiresAt: now + SESSION_DURATION,
    lastSignatureRequest: now
  };
  
  // Store in session storage
  sessionStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(session));
  return session;
};

/**
 * Get the current wallet session if it exists
 */
export const getWalletSession = (): WalletSession | null => {
  try {
    const sessionData = sessionStorage.getItem(WALLET_SESSION_KEY);
    if (!sessionData) return null;
    
    return JSON.parse(sessionData) as WalletSession;
  } catch (error) {
    console.error('Error getting wallet session:', error);
    return null;
  }
};

/**
 * Check if a wallet session is valid
 */
export const isWalletSessionValid = (): boolean => {
  const session = getWalletSession();
  if (!session) return false;
  
  const now = Date.now();
  return session.expiresAt > now;
};

/**
 * Extend the current wallet session
 */
export const extendWalletSession = (): boolean => {
  const session = getWalletSession();
  if (!session) return false;
  
  const now = Date.now();
  session.expiresAt = now + SESSION_DURATION;
  
  sessionStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(session));
  return true;
};

/**
 * Clear the wallet session
 */
export const clearWalletSession = (): void => {
  sessionStorage.removeItem(WALLET_SESSION_KEY);
};

/**
 * Record a signature request to prevent multiple requests in quick succession
 */
export const recordSignatureRequest = (): void => {
  const session = getWalletSession();
  if (!session) return;
  
  session.lastSignatureRequest = Date.now();
  sessionStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(session));
};

/**
 * Check if we should allow a new signature request
 * This prevents multiple signature requests in quick succession
 * 
 * @param cooldownPeriod Time in milliseconds to wait between signature requests
 */
export const canRequestSignature = (cooldownPeriod = 5000): boolean => {
  const session = getWalletSession();
  if (!session || !session.lastSignatureRequest) return true;
  
  const now = Date.now();
  return (now - session.lastSignatureRequest) > cooldownPeriod;
};
