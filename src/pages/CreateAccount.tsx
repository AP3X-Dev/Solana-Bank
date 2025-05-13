import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import { storage } from '../utils/storage';
import { Building2, ArrowLeft, Key, Copy, Eye, EyeOff, ExternalLink, AlertTriangle } from 'lucide-react';
import bs58 from 'bs58';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const CreateAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [formData, setFormData] = useState({
    type: 'TRADING',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Generate new Solana wallet
      const newKeypair = Keypair.generate();
      setKeypair(newKeypair);

      // Create new account
      const newAccount: Account = {
        id: newKeypair.publicKey.toString(),
        userId: user.id,
        type: formData.type as Account['type'],
        name: formData.name,
        balance: 0,
        accountNumber: newKeypair.publicKey.toString(),
        routingNumber: 'SOLANA',
        transactions: [],
        scheduledPayments: [],
        recurringTransfers: [],
        status: 'ACTIVE',
        openedDate: new Date().toISOString(),
        lastActivityDate: new Date().toISOString()
      };

      const accounts = storage.getAccounts();
      storage.setAccounts([...accounts, newAccount]);

    } catch (err) {
      console.error('Error creating account:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-muted-text hover:text-light-text mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </button>

      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 rounded-lg bg-solana-blue/10 mr-3">
              <Building2 className="text-solana-blue" size={20} />
            </div>
            <h1 className="text-xl font-bold text-light-text">Create New Account</h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

        {!keypair ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-light-text mb-2">
                Account Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
                required
              >
                <option value="TRADING">Trading Account</option>
                <option value="HODL">HODL Account</option>
                <option value="SAVINGS">Savings Account</option>
              </select>
              <p className="mt-2 text-xs text-muted-text">
                {formData.type === 'TRADING' && 'For active trading and frequent transactions'}
                {formData.type === 'HODL' && 'For long-term holdings and investments'}
                {formData.type === 'SAVINGS' && 'For saving and earning interest'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
                placeholder="e.g., Main Trading Account"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-500">Important Security Notice</h3>
                  <p className="mt-2 text-xs text-muted-text">
                    Please save your secret key in a secure location. You will need it to access your account.
                    This information will only be shown once and cannot be recovered if lost.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Public Key (Address)
                </label>
                <div className="flex items-center">
                  <code className="flex-1 block p-2 text-xs bg-dark-light rounded-xl font-mono break-all text-muted-text">
                    {keypair.publicKey.toString()}
                  </code>
                  <button
                    onClick={() => copyToClipboard(keypair.publicKey.toString())}
                    className="ml-2 p-2 text-muted-text hover:text-light-text transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${keypair.publicKey.toString()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-2 text-muted-text hover:text-light-text transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Secret Key
                </label>
                <div className="flex items-center">
                  <code className="flex-1 block p-2 text-xs bg-dark-light rounded-xl font-mono break-all text-muted-text">
                    {showSecretKey
                      ? bs58.encode(keypair.secretKey)
                      : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="ml-2 p-2 text-muted-text hover:text-light-text transition-colors"
                  >
                    {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(bs58.encode(keypair.secretKey))}
                    className="ml-2 p-2 text-muted-text hover:text-light-text transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
        </div>
      </Card>
    </div>
  );
};