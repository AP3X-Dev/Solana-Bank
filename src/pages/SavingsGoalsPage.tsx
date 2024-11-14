import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SavingsGoal } from '../types';
import { storage } from '../utils/storage';
import { PiggyBank, ArrowLeft, Plus, Target, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const GOAL_CATEGORIES = [
  { value: 'EMERGENCY', label: 'Emergency Fund' },
  { value: 'VACATION', label: 'Vacation' },
  { value: 'HOME', label: 'Home' },
  { value: 'CAR', label: 'Car' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'OTHER', label: 'Other' }
];

export const SavingsGoalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    category: 'EMERGENCY',
    accountId: '',
    autoSave: false,
    autoSaveAmount: '',
    autoSaveFrequency: 'MONTHLY'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const storedGoals = JSON.parse(localStorage.getItem('savingsGoals') || '[]');
    setGoals(storedGoals.filter((goal: SavingsGoal) => goal.userId === user.id));
  }, [user, navigate]);

  const accounts = storage.getAccounts().filter(a => a.userId === user?.id);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: formData.accountId,
      name: formData.name,
      targetAmount,
      currentAmount: 0,
      targetDate: formData.targetDate,
      category: formData.category as SavingsGoal['category'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      progress: 0,
      autoSave: formData.autoSave ? {
        amount: parseFloat(formData.autoSaveAmount),
        frequency: formData.autoSaveFrequency as 'WEEKLY' | 'MONTHLY',
        nextDeduction: new Date().toISOString()
      } : undefined
    };

    const updatedGoals = [...goals, newGoal];
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
    setShowNewGoalForm(false);
    setFormData({
      name: '',
      targetAmount: '',
      targetDate: '',
      category: 'EMERGENCY',
      accountId: '',
      autoSave: false,
      autoSaveAmount: '',
      autoSaveFrequency: 'MONTHLY'
    });
  };

  const handleContribute = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const account = accounts.find(a => a.id === goal.accountId);
    if (!account || account.balance < amount) {
      setError('Insufficient funds');
      return;
    }

    // Update account balance
    const updatedAccounts = storage.getAccounts().map(acc => {
      if (acc.id === account.id) {
        return {
          ...acc,
          balance: acc.balance - amount,
          transactions: [{
            id: crypto.randomUUID(),
            type: 'WITHDRAWAL',
            amount: -amount,
            description: `Contribution to ${goal.name} savings goal`,
            date: new Date().toISOString(),
            category: 'SAVINGS'
          }, ...acc.transactions]
        };
      }
      return acc;
    });
    storage.setAccounts(updatedAccounts);

    // Update goal progress
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const newAmount = g.currentAmount + amount;
        return {
          ...g,
          currentAmount: newAmount,
          progress: (newAmount / g.targetAmount) * 100,
          status: newAmount >= g.targetAmount ? 'COMPLETED' : 'ACTIVE'
        };
      }
      return g;
    });
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
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
            <PiggyBank className="text-indigo-600 mr-3" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
          </div>
          {!showNewGoalForm && (
            <button
              onClick={() => setShowNewGoalForm(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus size={20} className="mr-2" />
              New Goal
            </button>
          )}
        </div>

        {showNewGoalForm && (
          <form onSubmit={handleCreateGoal} className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Create New Savings Goal</h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  {GOAL_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Linked Account
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
                      {account.type} (****{account.accountNumber.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={formData.autoSave}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoSave: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoSave" className="ml-2 block text-sm text-gray-900">
                    Enable automatic savings
                  </label>
                </div>

                {formData.autoSave && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-save Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.autoSaveAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, autoSaveAmount: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
                          required={formData.autoSave}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency
                      </label>
                      <select
                        value={formData.autoSaveFrequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoSaveFrequency: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required={formData.autoSave}
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowNewGoalForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Goal
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-6">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white border rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                  <p className="text-sm text-gray-500">{goal.category}</p>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{goal.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Current Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(goal.currentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>
                
                {goal.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleContribute(goal.id, 100)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Quick Save $100
                  </button>
                )}
              </div>

              {goal.autoSave && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Auto-saving {formatCurrency(goal.autoSave.amount)} {goal.autoSave.frequency.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          ))}

          {goals.length === 0 && !showNewGoalForm && (
            <div className="text-center py-8 text-gray-500">
              <PiggyBank size={48} className="mx-auto mb-4 text-gray-400" />
              <p>You don't have any savings goals yet.</p>
              <button
                onClick={() => setShowNewGoalForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Create your first goal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};