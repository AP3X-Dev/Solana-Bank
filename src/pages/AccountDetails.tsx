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
import { Wallet, ArrowLeft, Copy, Eye, EyeOff, RefreshCcw, ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-muted-text hover:text-light-text mb-4 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-light-text">
          {account.name || account.type}
        </h1>
        <p className="text-muted-text">Solana Wallet</p>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-dark-light p-3 rounded-xl">
                <Wallet className="text-solana-blue" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-medium text-muted-text">Current Balance</h2>
                <p className="text-2xl font-bold text-solana-teal">
                  {account.balance.toFixed(4)} SOL
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCcw}
              onClick={fetchTransactions}
              loading={loading}
              disabled={loading}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-light-text mb-4">Wallet Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-text mb-2">
                  Public Key (Address)
                </label>
                <div className="flex items-center">
                  <code className="flex-1 block p-2 text-xs bg-dark-light rounded-lg font-mono break-all text-muted-text">
                    {account.accountNumber}
                  </code>
                  <button
                    onClick={() => copyToClipboard(account.accountNumber)}
                    className="ml-2 p-1 text-muted-text hover:text-light-text transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${account.accountNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1 text-muted-text hover:text-light-text transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <AccountAnalytics account={account} />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-light-text mb-4">Transaction History</h3>
            <TransactionList transactions={account.transactions} />
          </div>
        </Card>
      </div>
    </div>
  );
};