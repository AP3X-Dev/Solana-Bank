import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import { AccountCard } from '../components/AccountCard';
import { getTokenBalance } from '../utils/solana';
import { storage } from '../utils/storage';
import { Wallet, PlusCircle, ArrowLeft, RefreshCcw } from 'lucide-react';

export const AccountsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!user || !wallet.publicKey) return;

    try {
      setLoading(true);
      setError(null);

      // Get stored accounts
      const storedAccounts = storage.getAccounts()
        .filter(a => a.userId === user.id);

      // Get main wallet balance
      const balance = await getTokenBalance(connection, wallet.publicKey);
      
      // Update or create main wallet account
      const mainWalletAccount: Account = {
        id: wallet.publicKey.toString(),
        userId: user.id,
        type: 'CHECKING',
        name: 'Main Wallet',
        balance,
        accountNumber: wallet.publicKey.toString(),
        routingNumber: 'SOLANA',
        transactions: [],
        scheduledPayments: [],
        recurringTransfers: [],
        status: 'ACTIVE',
        openedDate: new Date().toISOString(),
        lastActivityDate: new Date().toISOString()
      };

      // Combine main wallet with other accounts
      const updatedAccounts = [
        mainWalletAccount,
        ...storedAccounts.filter(a => a.id !== wallet.publicKey?.toString())
      ];

      setAccounts(updatedAccounts);
      storage.setAccounts(updatedAccounts);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to fetch account information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchAccounts();
  }, [user, navigate, wallet.publicKey, connection]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Accounts</h1>
            <p className="text-gray-600">Manage your Solana wallets and accounts</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              <RefreshCcw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/account/new')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PlusCircle size={20} className="mr-2" />
              New Account
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!wallet.connected ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your Solana wallet to view and manage your accounts
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/account/${account.id}`)}
            />
          ))}
          {accounts.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No accounts found. Create a new account to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};