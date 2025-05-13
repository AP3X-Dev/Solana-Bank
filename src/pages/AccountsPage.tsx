import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import { AccountCard } from '../components/AccountCard';
import { getTokenBalance } from '../utils/solana';
import { storage } from '../utils/storage';
import { Wallet, PlusCircle, ArrowLeft, RefreshCcw, LayoutGrid } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardGrid } from '../components/Card';

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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-muted-text hover:text-light-text mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-light-text">My Accounts</h1>
            <p className="text-muted-text">Manage your Solana wallets and accounts</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCcw}
              onClick={fetchAccounts}
              loading={loading}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/account/new')}
            >
              New Account
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!wallet.connected ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-light flex items-center justify-center">
            <Wallet size={32} className="text-muted-text" />
          </div>
          <h2 className="text-xl font-semibold text-light-text mb-2">Connect Your Wallet</h2>
          <p className="text-muted-text mb-6">
            Connect your Solana wallet to view and manage your accounts
          </p>
          <Button variant="primary" icon={Wallet} className="mx-auto">
            Connect Wallet
          </Button>
        </Card>
      ) : (
        <CardGrid columns={3}>
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/account/${account.id}`)}
            />
          ))}
          {accounts.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 bg-dark-light rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-card flex items-center justify-center">
                <LayoutGrid size={32} className="text-muted-text" />
              </div>
              <p className="text-muted-text">No accounts found. Create a new account to get started.</p>
              <Button
                variant="primary"
                icon={PlusCircle}
                className="mt-4 mx-auto"
                onClick={() => navigate('/account/new')}
              >
                Create Account
              </Button>
            </div>
          )}
        </CardGrid>
      )}
    </div>
  );
};