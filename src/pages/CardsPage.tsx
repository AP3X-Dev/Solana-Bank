import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../types';
import { storage } from '../utils/storage';
import { CreditCard, Lock, PlusCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const CardsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [formData, setFormData] = useState({
    type: 'DEBIT',
    accountId: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const storedCards = JSON.parse(localStorage.getItem('cards') || '[]');
    setCards(storedCards.filter((card: Card) => card.userId === user.id));
  }, [user, navigate]);

  const accounts = storage.getAccounts().filter(a => a.userId === user?.id);

  const generateCardNumber = () => {
    return '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  };

  const generateExpiryDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 4);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const account = accounts.find(a => a.id === formData.accountId);
    if (!account) return;

    const newCard: Card = {
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: formData.accountId,
      type: formData.type as 'CREDIT' | 'DEBIT',
      cardNumber: generateCardNumber(),
      expiryDate: generateExpiryDate(),
      cvv: Math.floor(Math.random() * 900 + 100).toString(),
      cardholderName: `${user.firstName} ${user.lastName}`.toUpperCase(),
      status: 'ACTIVE',
      limit: formData.type === 'CREDIT' ? 10000 : undefined,
      availableCredit: formData.type === 'CREDIT' ? 10000 : undefined,
      rewards: formData.type === 'CREDIT' ? { points: 0, cashback: 0 } : undefined,
      transactions: []
    };

    const updatedCards = [...cards, newCard];
    localStorage.setItem('cards', JSON.stringify(updatedCards));
    setCards(updatedCards);
    setShowNewCardForm(false);
    setFormData({ type: 'DEBIT', accountId: '' });
  };

  const toggleCardStatus = (cardId: string) => {
    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          status: card.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
        };
      }
      return card;
    });
    localStorage.setItem('cards', JSON.stringify(updatedCards));
    setCards(updatedCards);
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
            <CreditCard className="text-indigo-600 mr-3" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Your Cards</h1>
          </div>
          {!showNewCardForm && (
            <button
              onClick={() => setShowNewCardForm(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PlusCircle size={20} className="mr-2" />
              Add New Card
            </button>
          )}
        </div>

        {showNewCardForm && (
          <form onSubmit={handleCreateCard} className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">New Card Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="DEBIT">Debit Card</option>
                  <option value="CREDIT">Credit Card</option>
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

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewCardForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Card
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid gap-6">
          {cards.map(card => (
            <div
              key={card.id}
              className="relative p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-sm opacity-80">
                    {card.type === 'CREDIT' ? 'Credit Card' : 'Debit Card'}
                  </p>
                  <p className="text-lg font-semibold">{card.cardholderName}</p>
                </div>
                <CreditCard size={32} />
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <p className="text-xl tracking-wider">
                    {showCardDetails && selectedCard?.id === card.id
                      ? card.cardNumber.match(/.{1,4}/g)?.join(' ')
                      : '•••• •••• •••• ' + card.cardNumber.slice(-4)}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      setShowCardDetails(!showCardDetails);
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    {showCardDetails && selectedCard?.id === card.id ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <div className="flex space-x-4 mt-2">
                  <p className="text-sm">
                    Expires: {card.expiryDate}
                  </p>
                  <p className="text-sm">
                    CVV: {showCardDetails && selectedCard?.id === card.id ? card.cvv : '•••'}
                  </p>
                </div>
              </div>

              {card.type === 'CREDIT' && (
                <div className="mb-4">
                  <p className="text-sm opacity-80">Available Credit</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(card.availableCredit || 0)}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    card.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {card.status}
                  </span>
                </div>
                <button
                  onClick={() => toggleCardStatus(card.id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/20 rounded hover:bg-white/30"
                >
                  <Lock size={16} />
                  <span>{card.status === 'ACTIVE' ? 'Block' : 'Unblock'}</span>
                </button>
              </div>
            </div>
          ))}

          {cards.length === 0 && !showNewCardForm && (
            <div className="text-center py-8 text-gray-500">
              <CreditCard size={48} className="mx-auto mb-4 text-gray-400" />
              <p>You don't have any cards yet.</p>
              <button
                onClick={() => setShowNewCardForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Add your first card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};