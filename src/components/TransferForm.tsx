import React, { useState } from 'react';
import { Account } from '../types';
import { storage } from '../utils/storage';

interface TransferFormProps {
  fromAccount: Account;
  onTransfer: () => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({ fromAccount, onTransfer, onCancel }) => {
  const [formData, setFormData] = useState({
    toAccountId: '',
    amount: '',
    description: ''
  });
  const [error, setError] = useState('');

  const accounts = storage.getAccounts()
    .filter(a => a.userId === fromAccount.userId && a.id !== fromAccount.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > fromAccount.balance) {
      setError('Insufficient funds');
      return;
    }

    const toAccount = accounts.find(a => a.id === formData.toAccountId);
    if (!toAccount) {
      setError('Invalid destination account');
      return;
    }

    // Create transfer transactions
    const transferId = crypto.randomUUID();
    const date = new Date().toISOString();

    const fromTransaction = {
      id: crypto.randomUUID(),
      type: 'TRANSFER' as const,
      amount: -amount,
      description: `Transfer to ${toAccount.type} (${formData.description})`,
      date,
      toAccount: toAccount.id,
      transferId
    };

    const toTransaction = {
      id: crypto.randomUUID(),
      type: 'TRANSFER' as const,
      amount: amount,
      description: `Transfer from ${fromAccount.type} (${formData.description})`,
      date,
      fromAccount: fromAccount.id,
      transferId
    };

    // Update both accounts
    const allAccounts = storage.getAccounts();
    const updatedAccounts = allAccounts.map(account => {
      if (account.id === fromAccount.id) {
        return {
          ...account,
          balance: account.balance - amount,
          transactions: [fromTransaction, ...account.transactions]
        };
      }
      if (account.id === toAccount.id) {
        return {
          ...account,
          balance: account.balance + amount,
          transactions: [toTransaction, ...account.transactions]
        };
      }
      return account;
    });

    storage.setAccounts(updatedAccounts);
    onTransfer();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Money</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            To Account
          </label>
          <select
            value={formData.toAccountId}
            onChange={(e) => setFormData(prev => ({ ...prev, toAccountId: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.type} (****{account.accountNumber.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Transfer
          </button>
        </div>
      </form>
    </div>
  );
};