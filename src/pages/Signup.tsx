import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from 'lucide-react';
import { BankLogo } from '../components/BankLogo';

export const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const { confirmPassword, ...userData } = formData;
    if (register(userData)) {
      navigate('/login');
    } else {
      setError('Username already exists');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-light-text">
              Create your account
            </h1>
          </div>

          <div className="bg-dark-card border border-dark-light rounded-xl p-6 shadow-card">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-light-text mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-light-text mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light-text mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-light-text mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-light-text mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-solana-blue hover:bg-solana-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solana-blue transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-text">
                Already have an account?
              </p>
              <Link
                to="/login"
                className="mt-2 block w-full py-2.5 px-4 border border-dark-light rounded-xl text-sm font-medium text-light-text bg-dark-light hover:bg-dark-light/70 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};