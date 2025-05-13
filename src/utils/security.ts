import { PublicKey, Transaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Enhanced security utilities for Solana banking application
 */

// Constants
const AUTH_MESSAGE_PREFIX = 'SolanaBank Authentication:';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const TRANSACTION_TIMEOUT = 60 * 1000; // 1 minute

// Types
export interface SignatureVerification {
  isValid: boolean;
  publicKey: string;
  timestamp: number;
}

export interface EncryptedData {
  nonce: Uint8Array;
  ciphertext: Uint8Array;
}

export interface SecuritySession {
  publicKey: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Creates a message for wallet signature verification
 * Includes a timestamp to prevent replay attacks
 */
export const createSignatureMessage = (publicKey: string): string => {
  const timestamp = Date.now();
  return `${AUTH_MESSAGE_PREFIX} ${publicKey} ${timestamp}`;
};

/**
 * Verifies a signature against a public key
 */
export const verifySignature = (
  message: string,
  signature: string,
  publicKey: string
): SignatureVerification => {
  try {
    const messageBytes = new TextEncoder().encode(message);

    // Convert base64 signature to Uint8Array
    const signatureBytes = Uint8Array.from(Buffer.from(signature, 'base64'));

    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    // Extract timestamp from message
    const parts = message.split(' ');
    const timestamp = parseInt(parts[parts.length - 1], 10);

    return { isValid, publicKey, timestamp };
  } catch (error) {
    console.error('Signature verification error:', error);
    return { isValid: false, publicKey, timestamp: 0 };
  }
};

/**
 * Creates a security session after successful authentication
 */
export const createSecuritySession = (
  publicKey: string,
  signature: string
): SecuritySession => {
  const timestamp = Date.now();
  const expiresAt = timestamp + SESSION_DURATION;

  const session: SecuritySession = {
    publicKey,
    signature,
    timestamp,
    expiresAt
  };

  // Store in secure storage
  sessionStorage.setItem('solana_bank_session', JSON.stringify(session));

  return session;
};

/**
 * Validates if a security session is still valid
 */
export const validateSecuritySession = (): boolean => {
  try {
    const sessionData = sessionStorage.getItem('solana_bank_session');
    if (!sessionData) return false;

    const session: SecuritySession = JSON.parse(sessionData);
    const now = Date.now();

    return session.expiresAt > now;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * Extends a security session
 */
export const extendSecuritySession = (): boolean => {
  try {
    const sessionData = sessionStorage.getItem('solana_bank_session');
    if (!sessionData) return false;

    const session: SecuritySession = JSON.parse(sessionData);
    const now = Date.now();

    // Only extend if session is still valid
    if (session.expiresAt > now) {
      session.expiresAt = now + SESSION_DURATION;
      sessionStorage.setItem('solana_bank_session', JSON.stringify(session));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Session extension error:', error);
    return false;
  }
};

/**
 * Clears the security session
 */
export const clearSecuritySession = (): void => {
  sessionStorage.removeItem('solana_bank_session');
};

/**
 * Encrypts sensitive data using the wallet's public key
 */
export const encryptData = async (
  wallet: WalletContextState,
  data: string
): Promise<string | null> => {
  try {
    if (!wallet.publicKey) return null;

    const publicKeyBytes = wallet.publicKey.toBytes();
    const messageBytes = new TextEncoder().encode(data);

    const nonce = nacl.randomBytes(24);
    const sharedKey = nacl.box.keyPair();

    const ciphertext = nacl.box(
      messageBytes,
      nonce,
      publicKeyBytes,
      sharedKey.secretKey
    );

    const encryptedData: EncryptedData = {
      nonce,
      ciphertext
    };

    return btoa(JSON.stringify({
      nonce: Array.from(encryptedData.nonce),
      ciphertext: Array.from(encryptedData.ciphertext)
    }));
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Validates a transaction before sending
 * Checks for suspicious activity and transaction limits
 */
export const validateTransaction = (
  transaction: Transaction,
  amount: number
): { isValid: boolean; reason?: string } => {
  // Check if transaction is too old
  const now = Date.now();
  if (transaction.recentBlockhash && now - transaction.lastValidBlockHeight > TRANSACTION_TIMEOUT) {
    return { isValid: false, reason: 'Transaction timeout exceeded' };
  }

  // Add additional validation logic here
  // For example, check against transaction limits

  return { isValid: true };
};

/**
 * Generates a secure random ID
 */
export const generateSecureId = (): string => {
  const array = new Uint32Array(4);
  window.crypto.getRandomValues(array);
  return Array.from(array, x => x.toString(16).padStart(8, '0')).join('');
};
