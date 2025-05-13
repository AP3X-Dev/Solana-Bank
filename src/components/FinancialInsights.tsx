import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Account } from '../types';
import { formatCurrency } from '../utils/format';
import { TrendingUp, AlertTriangle, DollarSign, Clock, BarChart2 } from 'lucide-react';
import { getTokenBalance } from '../utils/solana';

interface FinancialInsightsProps {
  accounts: Account[];
}

interface PriceData {
  price: number;
  change24h: number;
}

const INITIAL_PRICE_DATA: PriceData = {
  price: 0,
  change24h: 0
};

// Mock data for development - avoids CORS issues
const MOCK_SOL_PRICE = 148.75;
const MOCK_SOL_CHANGE = 2.34;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Add some randomness to simulate real price movements
const getRandomPrice = (basePrice: number) => {
  const variance = basePrice * 0.005; // 0.5% variance
  return basePrice + (Math.random() * variance * 2 - variance);
};

const getRandomChange = (baseChange: number) => {
  const variance = 0.5; // 0.5% variance
  return baseChange + (Math.random() * variance * 2 - variance);
};

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ accounts }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [solanaData, setSolanaData] = useState<PriceData>(INITIAL_PRICE_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Mock data function to simulate fetching from Binance
  const fetchMockPriceData = async (): Promise<PriceData> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate occasional errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Simulated API error');
    }

    return {
      price: getRandomPrice(MOCK_SOL_PRICE),
      change24h: getRandomChange(MOCK_SOL_CHANGE)
    };
  };

  const fetchSolanaData = async (attempt = 0): Promise<void> => {
    try {
      setError(null);

      // Use our mock data function
      try {
        const data = await fetchMockPriceData();
        setSolanaData(data);
        setRetryAttempt(0);
      } catch (error) {
        // Simulate retry logic for mock errors
        console.warn('Mock API error, retrying:', error);

        if (attempt < MAX_RETRIES) {
          const nextAttempt = attempt + 1;
          const delay = RETRY_DELAY * Math.pow(2, attempt);

          setError(`Retrying in ${delay/1000}s... (${nextAttempt}/${MAX_RETRIES})`);

          setTimeout(() => {
            setRetryAttempt(nextAttempt);
            fetchSolanaData(nextAttempt);
          }, delay);
        } else {
          setError('Unable to fetch latest price data');
          setSolanaData(prev => ({
            ...prev,
            price: prev.price || MOCK_SOL_PRICE, // Fallback to base mock price
            change24h: prev.change24h || MOCK_SOL_CHANGE
          }));
        }
      }
    } catch (err) {
      console.error('Error in fetchSolanaData:', err);
      setError('An unexpected error occurred');

      // Ensure we have some data to display
      if (!solanaData.price) {
        setSolanaData({
          price: MOCK_SOL_PRICE,
          change24h: MOCK_SOL_CHANGE
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolanaData();

    const interval = setInterval(() => {
      fetchSolanaData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const calculateInsights = () => {
    if (!accounts || accounts.length === 0) {
      return {
        totalBalance: 0,
        usdValue: 0,
        pnl24h: 0,
        tradingVolume24h: 0
      };
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc?.balance || 0), 0);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate 24h trading volume and PNL
    const last24hTransactions = accounts.flatMap(account =>
      account.transactions.filter(tx =>
        new Date(tx.date) >= yesterday &&
        (tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL')
      )
    );

    const tradingVolume24h = last24hTransactions.reduce((sum, tx) =>
      sum + Math.abs(tx.amount), 0
    );

    // Simple PNL calculation based on transactions
    const pnl24h = last24hTransactions.reduce((sum, tx) =>
      sum + (tx.type === 'DEPOSIT' ? tx.amount : -tx.amount), 0
    );

    return {
      totalBalance,
      usdValue: totalBalance * solanaData.price,
      pnl24h,
      tradingVolume24h
    };
  };

  const { totalBalance, usdValue, pnl24h, tradingVolume24h } = calculateInsights();

  if (loading && !solanaData.price) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="animate-spin text-indigo-600" size={24} />
          <span className="text-gray-600">Loading financial data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Insights</h2>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center text-blue-700 mb-1">
              <TrendingUp size={20} className="mr-2" />
              <h3 className="font-medium">SOL Balance</h3>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {totalBalance.toFixed(4)} SOL
            </p>
            <p className="text-sm text-blue-600 mt-1">
              ≈ {formatCurrency(usdValue)}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center text-green-700 mb-1">
              <DollarSign size={20} className="mr-2" />
              <h3 className="font-medium">SOL Price</h3>
            </div>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(solanaData.price)}
            </p>
            <p className={`text-sm mt-1 ${
              solanaData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {solanaData.change24h >= 0 ? '↑' : '↓'} {Math.abs(solanaData.change24h).toFixed(2)}%
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center text-purple-700 mb-1">
              <BarChart2 size={20} className="mr-2" />
              <h3 className="font-medium">24h PNL</h3>
            </div>
            <p className={`text-2xl font-bold ${pnl24h >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
              {pnl24h >= 0 ? '+' : ''}{pnl24h.toFixed(4)} SOL
            </p>
            <p className="text-sm text-purple-600 mt-1">
              ≈ {formatCurrency(pnl24h * solanaData.price)}
            </p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center text-indigo-700 mb-1">
              <TrendingUp size={20} className="mr-2" />
              <h3 className="font-medium">24h Volume</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-800">
              {tradingVolume24h.toFixed(4)} SOL
            </p>
            <p className="text-sm text-indigo-600 mt-1">
              ≈ {formatCurrency(tradingVolume24h * solanaData.price)}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        {wallet.connected && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <DollarSign size={20} className="mr-2" />
              <h3 className="font-medium">Wallet Address</h3>
            </div>
            <p className="text-sm font-mono bg-white p-2 rounded break-all">
              {wallet.publicKey?.toString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};