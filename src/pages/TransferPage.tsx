import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Wallet, RefreshCcw, CreditCard, ArrowRight } from 'lucide-react';
import { transferTokens, getTokenBalance, formatPublicKey } from '../utils/solana';
import { WalletButton } from '../components/WalletButton';
import { storage } from '../utils/storage';
import { Account } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
}

export const TransferPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    selectedToken: '',
    selectedAccount: '',
    transferType: 'external', // 'external' or 'internal'
    destinationAccount: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchTokenBalances();
    }
  }, [user, wallet.publicKey, connection]);

  const fetchAccounts = () => {
    if (!user) return;

    // Get all accounts for the current user
    const userAccounts = storage.getAccounts()
      .filter(a => a.userId === user.id);

    setAccounts(userAccounts);

    // Set the first account as selected if none is selected
    if (userAccounts.length > 0 && !formData.selectedAccount) {
      setFormData(prev => ({ ...prev, selectedAccount: userAccounts[0].id }));
    }
  };

  const fetchTokenBalances = async () => {
    if (!wallet.publicKey) return;

    try {
      setLoadingBalances(true);
      // Get SOL balance
      const solBalance = await getTokenBalance(connection, wallet.publicKey);

      // Get SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const balances: TokenBalance[] = [
        { mint: 'SOL', symbol: 'SOL', balance: solBalance }
      ];

      // Add SPL token balances
      tokenAccounts.value.forEach((account) => {
        const parsedInfo = account.account.data.parsed.info;
        balances.push({
          mint: parsedInfo.mint,
          symbol: 'SPL', // In a real app, you'd fetch token metadata
          balance: parsedInfo.tokenAmount.uiAmount
        });
      });

      setTokenBalances(balances);
    } catch (err) {
      console.error('Error fetching token balances:', err);
      setError('Failed to fetch token balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!wallet.publicKey) {
        throw new Error('Please connect your wallet');
      }

      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Get source account
      const sourceAccount = accounts.find(a => a.id === formData.selectedAccount);
      if (!sourceAccount) {
        throw new Error('Please select a source account');
      }

      // Check if source account has enough balance
      if (amount > sourceAccount.balance) {
        throw new Error('Insufficient funds in the selected account');
      }

      // Handle internal transfer (between own accounts)
      if (formData.transferType === 'internal') {
        // Validate destination account
        if (!formData.destinationAccount) {
          throw new Error('Please select a destination account');
        }

        const destinationAccount = accounts.find(a => a.id === formData.destinationAccount);
        if (!destinationAccount) {
          throw new Error('Invalid destination account');
        }

        if (sourceAccount.id === destinationAccount.id) {
          throw new Error('Source and destination accounts cannot be the same');
        }

        // Create transfer transactions
        const transferId = crypto.randomUUID();
        const date = new Date().toISOString();

        // Create transaction for source account (debit)
        const sourceTransaction = {
          id: crypto.randomUUID(),
          type: 'TRANSFER' as const,
          amount: -amount,
          description: `Transfer to ${destinationAccount.name}`,
          date,
          toAccount: destinationAccount.id,
          transferId
        };

        // Create transaction for destination account (credit)
        const destinationTransaction = {
          id: crypto.randomUUID(),
          type: 'TRANSFER' as const,
          amount: amount,
          description: `Transfer from ${sourceAccount.name}`,
          date,
          fromAccount: sourceAccount.id,
          transferId
        };

        // Update both accounts
        const allAccounts = storage.getAccounts();
        const updatedAccounts = allAccounts.map(account => {
          if (account.id === sourceAccount.id) {
            return {
              ...account,
              balance: account.balance - amount,
              transactions: [sourceTransaction, ...account.transactions],
              lastActivityDate: date
            };
          }
          if (account.id === destinationAccount.id) {
            return {
              ...account,
              balance: account.balance + amount,
              transactions: [destinationTransaction, ...account.transactions],
              lastActivityDate: date
            };
          }
          return account;
        });

        // Save updated accounts
        storage.setAccounts(updatedAccounts);

        // Refresh accounts
        fetchAccounts();

        navigate('/dashboard', {
          state: {
            message: `Successfully transferred ${amount} SOL to ${destinationAccount.name}`,
          }
        });
      }
      // Handle external transfer (to another wallet)
      else {
        // Validate recipient address
        if (!formData.recipient) {
          throw new Error('Please enter a recipient address');
        }

        let recipientPubkey: PublicKey;
        try {
          recipientPubkey = new PublicKey(formData.recipient);
        } catch {
          throw new Error('Invalid recipient address');
        }

        // Validate token
        const selectedToken = tokenBalances.find(t =>
          t.mint === formData.selectedToken
        );

        if (!selectedToken) {
          throw new Error('Please select a token');
        }

        // Execute the transfer
        const signature = await transferTokens(
          connection,
          wallet,
          recipientPubkey,
          amount,
          formData.selectedToken === 'SOL' ? undefined : new PublicKey(formData.selectedToken)
        );

        // Refresh balances after transfer
        await fetchTokenBalances();
        fetchAccounts();

        navigate('/dashboard', {
          state: {
            message: 'External transfer completed successfully',
            signature
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
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
            <div className="p-2 rounded-lg bg-purple-500/10 mr-3">
              <Send className="text-purple-500" size={20} />
            </div>
            <h1 className="text-xl font-bold text-light-text">Transfer Tokens</h1>
          </div>
          <WalletButton />
        </div>

        {!wallet.connected ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-light flex items-center justify-center">
              <Wallet size={32} className="text-muted-text" />
            </div>
            <p className="text-muted-text mb-4">Please connect your wallet to make transfers</p>
            <Button variant="primary" icon={Wallet}>Connect Wallet</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-light-text">
                  Source Account
                </label>
                <button
                  type="button"
                  onClick={fetchAccounts}
                  className="flex items-center text-sm text-solana-blue hover:text-solana-teal transition-colors"
                >
                  <RefreshCcw size={16} className="mr-1" />
                  Refresh
                </button>
              </div>
              <select
                value={formData.selectedAccount}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedAccount: e.target.value }))}
                className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue mb-4 p-2.5"
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.balance.toFixed(4)} SOL
                  </option>
                ))}
              </select>

              {formData.selectedAccount && (
                <div className="flex items-center space-x-2 text-muted-text mb-4 bg-dark-light p-3 rounded-xl">
                  <CreditCard size={16} />
                  <span className="font-mono text-xs">
                    {accounts.find(a => a.id === formData.selectedAccount)?.accountNumber ?
                      formatPublicKey(accounts.find(a => a.id === formData.selectedAccount)?.accountNumber || '') :
                      'No account selected'
                    }
                  </span>
                </div>
              )}
            </div>

            {formData.transferType === 'external' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-light-text">
                    Select Token
                  </label>
                  <button
                    type="button"
                    onClick={fetchTokenBalances}
                    disabled={loadingBalances}
                    className="flex items-center text-sm text-solana-blue hover:text-solana-teal transition-colors"
                  >
                    <RefreshCcw size={16} className={`mr-1 ${loadingBalances ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <select
                  value={formData.selectedToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedToken: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
                  required={formData.transferType === 'external'}
                >
                  <option value="">Select token</option>
                  {tokenBalances.map((token) => (
                    <option key={token.mint} value={token.mint}>
                      {token.symbol} - Balance: {token.balance.toFixed(6)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-light-text mb-2">
                Transfer Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, transferType: 'external' }))}
                  className={`flex items-center justify-center p-4 rounded-xl border ${
                    formData.transferType === 'external'
                      ? 'border-solana-blue bg-solana-blue/10 text-light-text'
                      : 'border-dark-light bg-dark-light text-muted-text'
                  } transition-colors`}
                >
                  <ArrowRight size={18} className="mr-2" />
                  <span>External Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, transferType: 'internal' }))}
                  className={`flex items-center justify-center p-4 rounded-xl border ${
                    formData.transferType === 'internal'
                      ? 'border-solana-purple bg-solana-purple/10 text-light-text'
                      : 'border-dark-light bg-dark-light text-muted-text'
                  } transition-colors`}
                >
                  <CreditCard size={18} className="mr-2" />
                  <span>Between My Accounts</span>
                </button>
              </div>
            </div>

            {formData.transferType === 'external' ? (
              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
                  placeholder="Solana wallet address"
                  required={formData.transferType === 'external'}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-light-text mb-2">
                  Destination Account
                </label>
                <select
                  value={formData.destinationAccount}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationAccount: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5"
                  required={formData.transferType === 'internal'}
                >
                  <option value="">Select destination account</option>
                  {accounts
                    .filter(account => account.id !== formData.selectedAccount)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.balance.toFixed(4)} SOL
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-light-text mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.000000001"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="block w-full rounded-xl border-dark-light bg-dark-light text-light-text shadow-sm focus:border-solana-blue focus:ring-solana-blue p-2.5 pr-16"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-muted-text">SOL</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              icon={Send}
              loading={loading || loadingBalances}
              disabled={loading || loadingBalances}
            >
              {loading ? 'Processing...' :
                formData.transferType === 'internal' ? 'Transfer Between Accounts' : 'Send Tokens'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};