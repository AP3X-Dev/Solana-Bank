import React, { createContext, useContext, useMemo, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaProviderProps {
  children: React.ReactNode;
}

interface SolanaContextType {
  error: string | null;
  clearError: () => void;
}

const SolanaContext = createContext<SolanaContextType | null>(null);

export const SolanaProvider: React.FC<SolanaProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => 
    clusterApiUrl(network), 
    [network]
  );
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  const clearError = () => setError(null);

  const onError = (error: any) => {
    console.error('Wallet error:', error);
    if (error.name === 'WalletConnectionError') {
      setError('Failed to connect wallet. Please try again.');
    } else if (error.name === 'WalletDisconnectedError') {
      setError('Wallet disconnected. Please reconnect.');
    } else if (error.name === 'WalletTimeoutError') {
      setError('Wallet connection timed out. Please try again.');
    } else {
      setError('An error occurred with the wallet connection.');
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect 
        onError={onError}
        localStorageKey="solanaWallet"
      >
        <WalletModalProvider>
          <SolanaContext.Provider value={{ error, clearError }}>
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