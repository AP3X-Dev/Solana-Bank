import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { WalletButton } from '../components/WalletButton';
import { BankLogo } from '../components/BankLogo';

export const Login = () => {
  const { loginWithWallet } = useAuth();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  React.useEffect(() => {
    const attemptLogin = async () => {
      if (wallet.connected && wallet.publicKey) {
        setIsLoggingIn(true);
        try {
          const success = await loginWithWallet();
          if (success) {
            navigate('/dashboard');
          }
        } finally {
          setIsLoggingIn(false);
        }
      }
    };

    attemptLogin();
  }, [wallet.connected, wallet.publicKey, loginWithWallet, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-light-text">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-muted-text">
              Connect your wallet to access your account
            </p>
          </div>

          <div className="bg-dark-card border border-dark-light rounded-xl p-6 shadow-card">
            {isLoggingIn ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 border-t-2 border-solana-teal rounded-full animate-spin mb-4"></div>
                <p className="text-muted-text">Logging in...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <WalletButton />
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-light" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-dark-card text-muted-text">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/login-email"
                    className="w-full flex justify-between items-center py-2.5 px-4 bg-dark-light rounded-xl text-light-text hover:bg-dark-light/70 transition-colors"
                  >
                    <span>Email & Password</span>
                    <ArrowRight size={16} />
                  </Link>

                  <button
                    disabled
                    className="w-full flex justify-between items-center py-2.5 px-4 bg-dark-light rounded-xl text-muted-text opacity-50 cursor-not-allowed"
                  >
                    <span>Hardware Wallet</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-text">
                    New to Bank of Solana?{' '}
                    <Link
                      to="/signup"
                      className="text-solana-blue hover:underline font-medium"
                    >
                      Create an account
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-text">
              By connecting your wallet, you agree to our{' '}
              <a href="#" className="text-solana-blue hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-solana-blue hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};