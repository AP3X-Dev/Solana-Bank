import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../context/AuthContext';
import { Building2 } from 'lucide-react';
import { WalletButton } from '../components/WalletButton';

export const Login = () => {
  const { loginWithWallet } = useAuth();
  const navigate = useNavigate();
  const wallet = useWallet();

  React.useEffect(() => {
    const attemptLogin = async () => {
      if (wallet.connected && wallet.publicKey) {
        const success = await loginWithWallet();
        if (success) {
          navigate('/dashboard');
        }
      }
    };

    attemptLogin();
  }, [wallet.connected, wallet.publicKey, loginWithWallet, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="text-indigo-600" size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to SolanaBank
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connect your wallet to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center mb-6">
            <WalletButton />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                New to SolanaBank?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/signup"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};