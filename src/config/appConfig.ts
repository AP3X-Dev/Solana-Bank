/**
 * Application Configuration
 * 
 * This file contains global configuration settings for the application.
 */

// Development mode flag - set to true to bypass wallet signature verification
export const DEV_MODE = true;

// Wallet configuration
export const WALLET_CONFIG = {
  // Skip wallet signature verification in development mode
  SKIP_SIGNATURE_VERIFICATION: DEV_MODE,
  
  // Auto-login with the connected wallet without signature in development mode
  AUTO_LOGIN_CONNECTED_WALLET: DEV_MODE,
  
  // Session duration in milliseconds (30 minutes)
  SESSION_DURATION: 30 * 60 * 1000,
  
  // Cooldown period between signature requests in milliseconds (10 seconds)
  SIGNATURE_REQUEST_COOLDOWN: 10000
};

// API configuration
export const API_CONFIG = {
  // Use mock data instead of real API calls
  USE_MOCK_DATA: true,
  
  // Base URL for API calls
  BASE_URL: 'https://api.example.com/v1'
};

// Solana network configuration
export const SOLANA_CONFIG = {
  // Default network
  DEFAULT_NETWORK: 'devnet' as const,
  
  // RPC endpoints
  RPC_ENDPOINTS: {
    'mainnet-beta': 'https://solana-mainnet.g.alchemy.com/v2/demo',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
    'localnet': 'http://localhost:8899'
  }
};
