import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SavingsGoal } from '../types';
import { storage } from '../utils/storage';
import { PiggyBank, ArrowLeft, Plus, Target, Trash2, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/Button';
import { Card, CardGrid } from '../components/Card';

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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-muted-text hover:text-light-text mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-indigo-500/10 mr-3">
              <PiggyBank className="text-indigo-500" size={20} />
            </div>
            <h1 className="text-xl font-bold text-light-text">Savings Goals</h1>
          </div>
          {!showNewGoalForm && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowNewGoalForm(true)}
            >
              New Goal
            </Button>
          )}
        </div>

        {showNewGoalForm && (
          <form onSubmit={handleCreateGoal} className="mb-8 p-6 bg-dark-light rounded-xl">
            <h2 className="text-lg font-semibold mb-4 text-light-text">Create New Savings Goal</h2>
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-light-text mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-card text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Target Amount
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign size={16} className="text-muted-text" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className="block w-full rounded-xl border-dark-light bg-dark-card text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Target Date
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={16} className="text-muted-text" />
                  </div>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="block w-full rounded-xl border-dark-light bg-dark-card text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-card text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
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
                <label className="block text-sm font-medium text-light-text mb-2">
                  Linked Account
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-card text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
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
                <div className="flex items-center mb-4 p-3 rounded-xl bg-dark-card">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={formData.autoSave}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoSave: e.target.checked }))}
                    className="h-4 w-4 text-solana-blue focus:ring-solana-blue border-dark-light rounded"
                  />
                  <label htmlFor="autoSave" className="ml-2 block text-sm text-light-text">
                    Enable automatic savings
                  </label>
                </div>

                {formData.autoSave && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-dark-card">
                    <div>
                      <label className="block text-sm font-medium text-light-text mb-2">
                        Auto-save Amount
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <DollarSign size={16} className="text-muted-text" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.autoSaveAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, autoSaveAmount: e.target.value }))}
                          className="block w-full rounded-xl border-dark-light bg-dark text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 pl-10"
                          required={formData.autoSave}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-light-text mb-2">
                        Frequency
                      </label>
                      <select
                        value={formData.autoSaveFrequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoSaveFrequency: e.target.value }))}
                        className="block w-full rounded-xl border-dark-light bg-dark text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowNewGoalForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Plus}
              >
                Create Goal
              </Button>
            </div>
          </form>
        )}

        <CardGrid columns={2}>
          {goals.map(goal => (
            <Card key={goal.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-light-text">{goal.name}</h3>
                  <p className="text-sm text-muted-text">{goal.category}</p>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-muted-text hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-text mb-1">
                  <span>Progress</span>
                  <span>{goal.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-dark-light rounded-full h-2.5">
                  <div
                    className="bg-solana-gradient h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-dark-light">
                  <p className="text-xs text-muted-text mb-1">Current Amount</p>
                  <p className="text-lg font-semibold text-light-text">
                    {formatCurrency(goal.currentAmount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-dark-light">
                  <p className="text-xs text-muted-text mb-1">Target Amount</p>
                  <p className="text-lg font-semibold text-light-text">
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-dark-light">
                  <Target size={16} className="text-muted-text" />
                  <span className="text-xs text-muted-text">
                    {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>

                {goal.status === 'ACTIVE' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleContribute(goal.id, 100)}
                  >
                    Quick Save $100
                  </Button>
                )}
              </div>

              {goal.autoSave && (
                <div className="mt-4 p-3 bg-dark-light rounded-xl">
                  <p className="text-sm text-muted-text flex items-center">
                    <RefreshCcw size={14} className="mr-2 text-solana-blue" />
                    Auto-saving {formatCurrency(goal.autoSave.amount)} {goal.autoSave.frequency.toLowerCase()}
                  </p>
                </div>
              )}
            </Card>
          ))}

          {goals.length === 0 && !showNewGoalForm && (
            <div className="col-span-full text-center py-12 bg-dark-light rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-card flex items-center justify-center">
                <PiggyBank size={32} className="text-muted-text" />
              </div>
              <p className="text-muted-text mb-4">You don't have any savings goals yet.</p>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowNewGoalForm(true)}
                className="mx-auto"
              >
                Create your first goal
              </Button>
            </div>
          )}
        </CardGrid>
      </Card>
    </div>
  );
};