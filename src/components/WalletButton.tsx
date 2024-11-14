import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut } from 'lucide-react';
import { useSolana } from '../context/SolanaContext';

export const WalletButton = () => {
  const { connected, disconnect } = useWallet();
  const { error, clearError } = useSolana();

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearError();
    await disconnect();
  };

  return (
    <div className="relative flex items-center space-x-2">
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
      
      <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !h-10">
        <div className="flex items-center space-x-2">
          <Wallet size={20} />
          <span>{connected ? 'Wallet Connected' : 'Connect Wallet'}</span>
        </div>
      </WalletMultiButton>
      
      {connected && (
        <button
          onClick={handleDisconnect}
          className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <LogOut size={20} />
          <span>Disconnect</span>
        </button>
      )}
    </div>
  );
};