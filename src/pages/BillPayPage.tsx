import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/storage';
import { Receipt, ArrowLeft, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { BillPay } from '../types';

export const BillPayPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    payeeName: '',
    accountNumber: '',
    routingNumber: '',
    amount: '',
    dueDate: '',
    recurring: false,
    frequency: 'MONTHLY' as const
  });
  const [error, setError] = useState('');

  const accounts = storage.getAccounts().filter(a => a.userId === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const account = accounts.find(a => a.id === formData.accountId);
    if (!account) {
      setError('Please select an account');
      return;
    }

    if (amount > account.balance) {
      setError('Insufficient funds');
      return;
    }

    const billPay: BillPay = {
      id: crypto.randomUUID(),
      accountId: formData.accountId,
      payee: {
        name: formData.payeeName,
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber
      },
      amount,
      dueDate: formData.dueDate,
      status: 'SCHEDULED',
      recurring: formData.recurring ? {
        frequency: formData.frequency
      } : undefined
    };

    // In a real app, we would integrate with a bill pay service
    // For now, we'll just simulate the scheduled payment
    const transaction = {
      id: crypto.randomUUID(),
      type: 'PAYMENT' as const,
      amount: -amount,
      description: `Bill Payment to ${formData.payeeName}`,
      date: new Date().toISOString(),
      category: 'BILLS' as const,
      status: 'PENDING' as const
    };

    const updatedAccounts = storage.getAccounts().map(acc => {
      if (acc.id === account.id) {
        return {
          ...acc,
          transactions: [transaction, ...acc.transactions],
          scheduledPayments: [...(acc.scheduledPayments || []), {
            id: crypto.randomUUID(),
            accountId: acc.id,
            amount,
            description: `Bill Payment to ${formData.payeeName}`,
            recipient: formData.payeeName,
            recipientAccount: formData.accountNumber,
            frequency: formData.recurring ? formData.frequency : 'ONE_TIME',
            startDate: formData.dueDate,
            nextDate: formData.dueDate,
            category: 'BILLS',
            status: 'ACTIVE'
          }]
        };
      }
      return acc;
    });

    storage.setAccounts(updatedAccounts);
    setShowForm(false);
    setFormData({
      accountId: '',
      payeeName: '',
      accountNumber: '',
      routingNumber: '',
      amount: '',
      dueDate: '',
      recurring: false,
      frequency: 'MONTHLY'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <Receipt className="text-indigo-600 mr-3" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Bill Pay</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus size={20} className="mr-2" />
            New Bill Payment
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.type} (****{account.accountNumber.slice(-4)}) - {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payee Name
                </label>
                <input
                  type="text"
                  value={formData.payeeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, payeeName: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={formData.recurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900">
                    Make this a recurring payment
                  </label>
                </div>
              </div>

              {formData.recurring && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as 'MONTHLY' }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Schedule Payment
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Payments</h2>
          {accounts.flatMap(acc => acc.scheduledPayments || []).length === 0 ? (
            <p className="text-gray-500">No scheduled payments</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {accounts.flatMap(acc => (acc.scheduledPayments || []).map(payment => (
                <div key={payment.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{payment.description}</h3>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(payment.nextDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};