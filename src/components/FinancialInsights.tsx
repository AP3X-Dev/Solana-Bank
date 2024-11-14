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

// Binance API endpoint as primary, with Jupiter as fallback
const BINANCE_API_URL = 'https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT';
const JUPITER_API_URL = 'https://price.jup.ag/v4/price?ids=SOL';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ accounts }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [solanaData, setSolanaData] = useState<PriceData>(INITIAL_PRICE_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const fetchFromBinance = async (): Promise<PriceData> => {
    const response = await fetch(BINANCE_API_URL);
    if (!response.ok) throw new Error('Binance API request failed');
    
    const data = await response.json();
    return {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent)
    };
  };

  const fetchFromJupiter = async (): Promise<PriceData> => {
    const response = await fetch(JUPITER_API_URL, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) throw new Error('Jupiter API request failed');
    
    const data = await response.json();
    if (!data?.data?.SOL) throw new Error('Invalid Jupiter API response');
    
    const solData = data.data.SOL;
    return {
      price: solData.price || 0,
      change24h: solData.price_24h_change || 0
    };
  };

  const fetchSolanaData = async (attempt = 0): Promise<void> => {
    try {
      setError(null);

      // Try Binance first, fall back to Jupiter if it fails
      try {
        const data = await fetchFromBinance();
        setSolanaData(data);
      } catch (binanceError) {
        console.warn('Binance API failed, trying Jupiter:', binanceError);
        const data = await fetchFromJupiter();
        setSolanaData(data);
      }

      setRetryAttempt(0);
    } catch (err) {
      console.error('Error fetching Solana data:', err);
      
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
          price: prev.price || 0
        }));
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