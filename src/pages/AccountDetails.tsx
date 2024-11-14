import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { useAuth } from '../context/AuthContext';
import { Account, Transaction } from '../types';
import { storage } from '../utils/storage';
import { formatCurrency } from '../utils/format';
import { TransactionList } from '../components/TransactionList';
import { AccountAnalytics } from '../components/AccountAnalytics';
import { Wallet, ArrowLeft, Copy, Eye, EyeOff, RefreshCcw } from 'lucide-react';

export const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const [account, setAccount] = useState<Account | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) {
      navigate('/login');
      return;
    }

    const accounts = storage.getAccounts();
    const foundAccount = accounts.find(a => a.id === id && a.userId === user.id);
    
    if (!foundAccount) {
      navigate('/dashboard');
      return;
    }

    setAccount(foundAccount);
    fetchTransactions();
  }, [id, user, navigate, connection]);

  const fetchTransactions = async () => {
    if (!account || !connection) return;

    try {
      setLoading(true);
      const pubkey = new PublicKey(account.accountNumber);
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 20 });
      
      const transactions: Transaction[] = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await connection.getParsedTransaction(sig.signature);
          return convertToTransaction(tx);
        })
      );

      // Update account with new transactions
      const updatedAccount = {
        ...account,
        transactions: transactions.filter((tx): tx is Transaction => tx !== null)
      };

      const accounts = storage.getAccounts();
      const updatedAccounts = accounts.map(a => 
        a.id === account.id ? updatedAccount : a
      );

      storage.setAccounts(updatedAccounts);
      setAccount(updatedAccount);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const convertToTransaction = (tx: ParsedTransactionWithMeta | null): Transaction | null => {
    if (!tx || !tx.meta) return null;

    const postBalances = tx.meta.postBalances[0] || 0;
    const preBalances = tx.meta.preBalances[0] || 0;
    const amount = (postBalances - preBalances) / 1e9; // Convert lamports to SOL

    return {
      id: tx.transaction.signatures[0],
      date: new Date(tx.blockTime ? tx.blockTime * 1000 : Date.now()).toISOString(),
      amount,
      type: amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
      status: 'COMPLETED',
      description: `Solana ${amount > 0 ? 'Deposit' : 'Withdrawal'}`,
      reference: tx.transaction.signatures[0]
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!account) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {account.name || account.type}
        </h1>
        <p className="text-gray-600">Solana Wallet</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Wallet className="text-indigo-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Balance</h2>
              <p className="text-3xl font-bold text-indigo-600">
                {account.balance.toFixed(4)} SOL
              </p>
            </div>
          </div>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key (Address)
              </label>
              <div className="flex items-center">
                <code className="flex-1 block p-2 text-sm bg-gray-50 rounded-md font-mono break-all">
                  {account.accountNumber}
                </code>
                <button
                  onClick={() => copyToClipboard(account.accountNumber)}
                  className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <AccountAnalytics account={account} />

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <TransactionList transactions={account.transactions} />
      </div>
    </div>
  );
};