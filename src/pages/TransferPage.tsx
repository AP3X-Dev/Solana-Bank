import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Wallet, RefreshCcw } from 'lucide-react';
import { transferTokens, getTokenBalance, formatPublicKey } from '../utils/solana';
import { WalletButton } from '../components/WalletButton';

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
}

export const TransferPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    selectedToken: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    fetchTokenBalances();
  }, [wallet.publicKey, connection]);

  const fetchTokenBalances = async () => {
    if (!wallet.publicKey) return;

    try {
      setLoadingBalances(true);
      // Get SOL balance
      const solBalance = await getTokenBalance(connection, wallet.publicKey);
      
      // Get SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const balances: TokenBalance[] = [
        { mint: 'SOL', symbol: 'SOL', balance: solBalance }
      ];

      // Add SPL token balances
      tokenAccounts.value.forEach((account) => {
        const parsedInfo = account.account.data.parsed.info;
        balances.push({
          mint: parsedInfo.mint,
          symbol: 'SPL', // In a real app, you'd fetch token metadata
          balance: parsedInfo.tokenAmount.uiAmount
        });
      });

      setTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
      setError('Failed to fetch token balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!wallet.publicKey) {
        throw new Error('Please connect your wallet');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const selectedToken = tokenBalances.find(t => 
        t.mint === formData.selectedToken
      );

      if (!selectedToken) {
        throw new Error('Please select a token');
      }

      if (amount > selectedToken.balance) {
        throw new Error('Insufficient funds');
      }

      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(formData.recipient);
      } catch {
        throw new Error('Invalid recipient address');
      }

      const signature = await transferTokens(
        connection,
        wallet,
        recipientPubkey,
        amount,
        formData.selectedToken === 'SOL' ? undefined : new PublicKey(formData.selectedToken)
      );

      // Refresh balances after transfer
      await fetchTokenBalances();

      navigate('/dashboard', { 
        state: { 
          message: 'Transfer completed successfully',
          signature 
        } 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Send className="text-indigo-600 mr-3" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Transfer Tokens</h1>
          </div>
          <WalletButton />
        </div>

        {!wallet.connected ? (
          <div className="text-center py-8">
            <Wallet size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Please connect your wallet to make transfers</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Wallet
              </label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Wallet size={16} />
                <span>{formatPublicKey(wallet.publicKey?.toBase58() || '')}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Token
                </label>
                <button
                  type="button"
                  onClick={fetchTokenBalances}
                  disabled={loadingBalances}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <RefreshCcw size={16} className={`mr-1 ${loadingBalances ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <select
                value={formData.selectedToken}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedToken: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select token</option>
                {tokenBalances.map((token) => (
                  <option key={token.mint} value={token.mint}>
                    {token.symbol} - Balance: {token.balance.toFixed(6)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Solana wallet address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.000000001"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingBalances}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Send Tokens'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};