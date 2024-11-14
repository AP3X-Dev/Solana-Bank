// Update the account type options
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import { storage } from '../utils/storage';
import { Building2, ArrowLeft, Key, Copy, Eye, EyeOff } from 'lucide-react';
import bs58 from 'bs58';

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Building2 className="text-indigo-600 mr-3" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Create New Account</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!keypair ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="TRADING">Trading Account</option>
                <option value="HODL">HODL Account</option>
                <option value="SAVINGS">Savings Account</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.type === 'TRADING' && 'For active trading and frequent transactions'}
                {formData.type === 'HODL' && 'For long-term holdings and investments'}
                {formData.type === 'SAVINGS' && 'For saving and earning interest'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., Main Trading Account"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Key className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Security Notice</h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    Please save your secret key in a secure location. You will need it to access your account. 
                    This information will only be shown once and cannot be recovered if lost.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key (Address)
                </label>
                <div className="flex items-center">
                  <code className="flex-1 block p-2 text-sm bg-gray-50 rounded-md font-mono break-all">
                    {keypair.publicKey.toString()}
                  </code>
                  <button
                    onClick={() => copyToClipboard(keypair.publicKey.toString())}
                    className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key
                </label>
                <div className="flex items-center">
                  <code className="flex-1 block p-2 text-sm bg-gray-50 rounded-md font-mono break-all">
                    {showSecretKey 
                      ? bs58.encode(keypair.secretKey)
                      : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(bs58.encode(keypair.secretKey))}
                    className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};