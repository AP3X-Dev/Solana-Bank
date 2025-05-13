import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '../context/SolanaContext';
import { Wallet } from 'lucide-react';

export const WalletButton = () => {
  const { error, clearError } = useSolana();
  const { connected, publicKey } = useWallet();

  // Custom styling for the wallet button
  const customStyles = {
    button: "bg-dark-light hover:bg-solana-gradient text-light-text hover:text-white rounded-xl transition-all duration-200 flex items-center h-10 px-4 border border-dark-light",
    connected: "bg-dark-light hover:bg-solana-gradient text-light-text hover:text-white",
    icon: "mr-2"
  };

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-dark-card border border-red-500 text-red-400 text-sm rounded-xl z-10 shadow-card">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Custom styled wallet button */}
      <WalletMultiButton className="!bg-transparent hover:!bg-transparent !border-0 !p-0">
        <div className={customStyles.button}>
          <Wallet size={18} className={customStyles.icon} />
          <span>
            {connected
              ? `${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}`
              : 'Connect Wallet'
            }
          </span>
        </div>
      </WalletMultiButton>
    </div>
  );
};