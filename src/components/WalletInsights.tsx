import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { ArrowUp, ArrowDown, DollarSign, BarChart2, TrendingUp, Wallet } from 'lucide-react';
import { Card } from './Card';
import { formatPublicKey } from '../utils/solana';

interface PriceData {
  price: number;
  change24h: number;
}

export const WalletInsights = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<PriceData>({ price: 0, change24h: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBalanceAndPrice = async () => {
      setIsLoading(true);
      try {
        // Fetch SOL balance
        if (publicKey) {
          const balance = await connection.getBalance(publicKey);
          setSolBalance(balance / 1e9); // Convert lamports to SOL
        }

        // Fetch SOL price (in a real app, you'd use a price API)
        // This is mock data for demonstration
        setSolPrice({
          price: 148.10,
          change24h: 2.35
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalanceAndPrice();
    // Set up interval to refresh data every minute
    const interval = setInterval(fetchBalanceAndPrice, 60000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const insights = [
    {
      title: 'SOL Balance',
      value: solBalance.toFixed(4),
      unit: 'SOL',
      change: '+$2,587.05',
      icon: BarChart2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5'
    },
    {
      title: 'SOL Price',
      value: `$${solPrice.price.toFixed(2)}`,
      unit: '',
      change: `${solPrice.change24h > 0 ? '+' : ''}${solPrice.change24h.toFixed(2)}%`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/5',
      isPositive: solPrice.change24h > 0
    },
    {
      title: '24h PNL',
      value: '+0.0000',
      unit: 'SOL',
      change: '+$0.00',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/5',
      isPositive: true
    },
    {
      title: '24h Volume',
      value: '0.0000',
      unit: 'SOL',
      change: '+$0.00',
      icon: ArrowUp,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/5'
    }
  ];

  return (
    <Card title="Wallet Insights">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {insights.map((insight) => (
          <div 
            key={insight.title} 
            className={`${insight.bgColor} p-4 rounded-xl`}
          >
            <div className="flex items-center mb-2">
              <insight.icon className={insight.color} size={18} />
              <span className="ml-2 text-sm text-muted-text">{insight.title}</span>
            </div>
            <div className="flex items-baseline">
              <div className="text-xl font-bold text-light-text">
                {insight.value} <span className="text-sm font-normal">{insight.unit}</span>
              </div>
            </div>
            <div className="mt-1 text-xs">
              <span className={insight.isPositive ? 'text-green-500' : 'text-red-500'}>
                {insight.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {publicKey && (
        <div className="mt-4 p-4 border-t border-dark-light">
          <div className="flex items-center">
            <Wallet size={16} className="text-muted-text mr-2" />
            <span className="text-sm text-muted-text">Wallet Address</span>
          </div>
          <div className="mt-1 font-mono text-xs text-light-text break-all">
            {publicKey.toString()}
          </div>
        </div>
      )}
    </Card>
  );
};
