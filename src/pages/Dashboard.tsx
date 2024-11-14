import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import { AccountCard } from '../components/AccountCard';
import { QuickActions } from '../components/QuickActions';
import { FinancialInsights } from '../components/FinancialInsights';
import { getTokenBalance } from '../utils/solana';
import { PlusCircle } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBalances = async () => {
      if (wallet.publicKey) {
        const balance = await getTokenBalance(connection, wallet.publicKey);
        setSolBalance(balance);

        // Create a Solana account representation
        const mainWalletAccount: Account = {
          id: wallet.publicKey.toString(),
          userId: user.id,
          type: 'TRADING',
          name: 'Main Trading Account',
          balance: balance,
          accountNumber: wallet.publicKey.toString(),
          routingNumber: 'SOLANA',
          transactions: [],
          scheduledPayments: [],
          recurringTransfers: [],
          status: 'ACTIVE',
          openedDate: new Date().toISOString(),
          lastActivityDate: new Date().toISOString()
        };

        setAccounts([mainWalletAccount]);
      }
    };

    fetchBalances();
  }, [user, navigate, wallet.publicKey, connection]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600">Manage your Solana wallet and transactions</p>
      </div>

      <div className="grid gap-8">
        <QuickActions />
        
        <FinancialInsights accounts={accounts} />

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Accounts</h2>
            <button
              onClick={() => navigate('/account/new')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PlusCircle size={20} className="mr-2" />
              New Account
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {accounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={() => navigate(`/account/${account.id}`)}
              />
            ))}

            {!wallet.connected && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Connect Your Wallet</h3>
                  <p className="text-gray-500">Connect your Solana wallet to view your balance and make transactions.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};