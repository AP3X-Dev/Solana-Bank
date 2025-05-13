import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Commitment,
  ConnectionConfig
} from '@solana/web3.js';

// Network options
export type NetworkType = 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet' | 'custom';

interface NetworkConfig {
  name: string;
  endpoint: string;
  network: WalletAdapterNetwork;
}

interface SolanaProviderProps {
  children: React.ReactNode;
  defaultNetwork?: NetworkType;
  customEndpoint?: string;
}

interface SolanaContextType {
  error: string | null;
  clearError: () => void;
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  customEndpoint: string;
  setCustomEndpoint: (endpoint: string) => void;
  connectionConfig: ConnectionConfig;
  isConnecting: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  getBalance: (publicKey: PublicKey) => Promise<number>;
}

const SolanaContext = createContext<SolanaContextType | null>(null);

// Default network configurations with alternative endpoints
const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  'mainnet-beta': {
    name: 'Mainnet Beta',
    // Using a more reliable endpoint for mainnet
    endpoint: 'https://solana-mainnet.g.alchemy.com/v2/demo', // Alchemy demo endpoint
    network: WalletAdapterNetwork.Mainnet
  },
  'testnet': {
    name: 'Testnet',
    endpoint: clusterApiUrl(WalletAdapterNetwork.Testnet),
    network: WalletAdapterNetwork.Testnet
  },
  'devnet': {
    name: 'Devnet',
    endpoint: clusterApiUrl(WalletAdapterNetwork.Devnet),
    network: WalletAdapterNetwork.Devnet
  },
  'localnet': {
    name: 'Localnet',
    endpoint: 'http://localhost:8899',
    network: WalletAdapterNetwork.Devnet
  },
  'custom': {
    name: 'Custom',
    endpoint: '',
    network: WalletAdapterNetwork.Mainnet
  }
};

// Default connection config
const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed' as Commitment,
  confirmTransactionInitialTimeout: 60000, // 60 seconds
  disableRetryOnRateLimit: false,
  fetchMiddleware: undefined
};

// Connection status check interval in ms
const CONNECTION_CHECK_INTERVAL = 60000; // 60 seconds to avoid rate limits

export const SolanaProvider: React.FC<SolanaProviderProps> = ({
  children,
  defaultNetwork = 'devnet', // Changed default to devnet since mainnet requires API keys
  customEndpoint = ''
}) => {
  const [error, setError] = useState<string | null>(null);
  const [network, setNetworkState] = useState<NetworkType>(defaultNetwork);
  const [customEndpointState, setCustomEndpointState] = useState<string>(customEndpoint);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>(DEFAULT_CONNECTION_CONFIG);

  // Get the current endpoint based on network selection
  const endpoint = useMemo(() => {
    if (network === 'custom' && customEndpointState) {
      return customEndpointState;
    }
    return NETWORK_CONFIGS[network].endpoint;
  }, [network, customEndpointState]);

  // Set network with validation
  const setNetwork = useCallback((newNetwork: NetworkType) => {
    if (newNetwork === 'custom' && !customEndpointState) {
      setError('Custom endpoint URL is required for custom network');
      return;
    }
    setNetworkState(newNetwork);
    setConnectionStatus('connecting');
  }, [customEndpointState]);

  // Set custom endpoint with validation
  const setCustomEndpoint = useCallback((newEndpoint: string) => {
    if (!newEndpoint) {
      setError('Custom endpoint URL cannot be empty');
      return;
    }

    try {
      // Basic URL validation
      new URL(newEndpoint);
      setCustomEndpointState(newEndpoint);
      if (network === 'custom') {
        setConnectionStatus('connecting');
      }
    } catch (e) {
      setError('Invalid endpoint URL');
    }
  }, [network]);

  // Initialize wallet adapters - only using Phantom for now
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  // Track if we've already shown the wallet selection modal
  const [hasPromptedForWallet, setHasPromptedForWallet] = useState<boolean>(false);

  const clearError = useCallback(() => setError(null), []);

  // Handle wallet errors with improved user experience
  const onError = useCallback((error: any) => {
    // Don't show errors for user rejections to avoid confusion
    if (error?.message?.includes('User rejected')) {
      console.debug('User declined wallet action:', error.name);
      return; // Don't set any error state for user rejections
    }

    // Log other errors normally
    console.error('Wallet error:', error);

    // Set appropriate error messages
    if (error.name === 'WalletConnectionError') {
      setError('Failed to connect wallet. Please try again.');
    } else if (error.name === 'WalletDisconnectedError') {
      setError('Wallet disconnected. Please reconnect.');
    } else if (error.name === 'WalletTimeoutError') {
      setError('Wallet connection timed out. Please try again.');
    } else if (error.name === 'WalletSignTransactionError') {
      // Don't show error for user rejections
      if (!error.message.includes('User rejected')) {
        setError('Transaction signing failed. Please try again.');
      }
    } else if (error.name === 'WalletSignMessageError') {
      // Don't show error for user rejections
      if (!error.message.includes('User rejected')) {
        setError('Message signing failed. Please try again.');
      }
    } else if (error.name === 'WalletAccountError') {
      setError('Error accessing wallet account. Please try again.');
    } else if (error.name === 'WalletPublicKeyError') {
      setError('Error accessing wallet public key. Please try again.');
    } else if (error.name === 'WalletNotConnectedError') {
      setError('Wallet not connected. Please connect your wallet.');
    } else if (error.name === 'WalletSendTransactionError') {
      // Don't show error for user rejections
      if (!error.message.includes('User rejected')) {
        setError('Failed to send transaction. Please try again.');
      }
    } else {
      // Only set error for non-user-rejection errors
      if (!error.message.includes('User rejected')) {
        setError(`Wallet error: ${error.message || 'Unknown error'}`);
      }
    }

    // Only update connection status for connection-related errors
    if (['WalletConnectionError', 'WalletDisconnectedError', 'WalletTimeoutError', 'WalletNotConnectedError'].includes(error.name)) {
      setConnectionStatus('error');
    }
  }, []);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsConnecting(true);
        const connection = new Connection(endpoint, connectionConfig);

        // Use a simpler method that's less likely to be rate-limited
        try {
          // First try getHealth which is less likely to be rate-limited
          const health = await connection.getHealth();
          if (health === 'ok') {
            console.log('Connected to Solana node, health: ok');
            setConnectionStatus('connected');
            setError(null);
            return;
          }
        } catch (healthError) {
          // If getHealth fails, try getVersion as fallback
          try {
            const version = await connection.getVersion();
            console.log('Connected to Solana node version:', version);
            setConnectionStatus('connected');
            setError(null);
            return;
          } catch (versionError) {
            // Both methods failed, throw the original health error
            throw healthError;
          }
        }
      } catch (error) {
        console.error('Connection error:', error);
        setConnectionStatus('error');

        // Provide more helpful error messages based on the error
        if (error instanceof Error) {
          const errorMessage = error.message;

          if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
            setError(`Access forbidden to ${NETWORK_CONFIGS[network].name}. This RPC endpoint may require an API key or has rate limits. Try using Devnet instead.`);
          } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            setError(`Rate limit exceeded for ${NETWORK_CONFIGS[network].name}. Please try again later or use a different RPC endpoint.`);
          } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
            setError(`Connection to ${NETWORK_CONFIGS[network].name} timed out. Please check your internet connection or try a different RPC endpoint.`);
          } else {
            setError(`Failed to connect to ${NETWORK_CONFIGS[network].name}: ${errorMessage}. Please try another network.`);
          }
        } else {
          setError(`Failed to connect to ${NETWORK_CONFIGS[network].name}. Please try another network.`);
        }
      } finally {
        setIsConnecting(false);
      }
    };

    // Initial connection check
    checkConnection();

    // Set up periodic connection checks with a longer interval to avoid rate limits
    const interval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [endpoint, network, connectionConfig]);

  // Get balance utility function
  const getBalance = useCallback(async (publicKey: PublicKey): Promise<number> => {
    try {
      const connection = new Connection(endpoint, connectionConfig);
      const balance = await connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }, [endpoint, connectionConfig]);

  // Context value
  const contextValue = useMemo(() => ({
    error,
    clearError,
    network,
    setNetwork,
    customEndpoint: customEndpointState,
    setCustomEndpoint,
    connectionConfig,
    isConnecting,
    connectionStatus,
    getBalance
  }), [
    error,
    clearError,
    network,
    setNetwork,
    customEndpointState,
    setCustomEndpoint,
    connectionConfig,
    isConnecting,
    connectionStatus,
    getBalance
  ]);

  // Custom wallet state change handler
  const onWalletChange = useCallback((wallets: any) => {
    console.log("Wallet state changed:", wallets);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider
        wallets={wallets}
        autoConnect={true}
        onError={onError}
        localStorageKey="solana_bank_wallet"
        onWalletNotFound={() => console.log("No wallet extension found")}
      >
        <WalletModalProvider>
          <SolanaContext.Provider value={contextValue}>
            {children}
          </SolanaContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
};

// Custom hook for enhanced Solana connection
export const useSolanaConnection = () => {
  const { connection } = useConnection();
  const {
    network,
    setNetwork,
    customEndpoint,
    setCustomEndpoint,
    connectionConfig,
    connectionStatus,
    isConnecting
  } = useSolana();

  return {
    connection,
    network,
    setNetwork,
    customEndpoint,
    setCustomEndpoint,
    connectionConfig,
    connectionStatus,
    isConnecting,
    networkName: NETWORK_CONFIGS[network].name
  };
};