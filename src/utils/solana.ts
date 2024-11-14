import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

export const SOL_DECIMALS = LAMPORTS_PER_SOL;

const RATE_LIMIT_DELAY = 100; // ms between requests

export const getTokenBalance = async (
  connection: Connection,
  walletAddress: PublicKey,
  tokenMint?: PublicKey
) => {
  try {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

    if (!tokenMint) {
      const balance = await connection.getBalance(walletAddress, 'confirmed');
      return balance / LAMPORTS_PER_SOL;
    }

    const tokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      walletAddress
    );

    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount, 'confirmed');
      return Number(balance.value.uiAmount);
    } catch (error) {
      console.error('Token account not found, balance is 0');
      return 0;
    }
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
};

export const transferTokens = async (
  connection: Connection,
  wallet: WalletContextState,
  recipient: PublicKey,
  amount: number,
  tokenMint?: PublicKey
) => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    if (!wallet.signTransaction) throw new Error('Wallet does not support signing');

    const transaction = new Transaction();
    const recentBlockhash = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey;

    if (!tokenMint) {
      // SOL transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: recipient,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );
    } else {
      // SPL Token transfer
      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );
      
      const toTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        recipient
      );

      // Check if recipient's token account exists
      const recipientTokenAccount = await connection.getAccountInfo(toTokenAccount);
      
      if (!recipientTokenAccount) {
        // Create recipient's associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            toTokenAccount, // associated token account
            recipient, // owner
            tokenMint // token mint
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          wallet.publicKey,
          amount * Math.pow(10, 9) // Assuming 9 decimals for SPL tokens
        )
      );
    }

    try {
      const signature = await wallet.sendTransaction(transaction, connection, {
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      
      await connection.confirmTransaction({
        signature,
        blockhash: recentBlockhash.blockhash,
        lastValidBlockHeight: recentBlockhash.lastValidBlockHeight
      }, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error('Transaction failed. Please try again.');
    }
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
};

export const formatPublicKey = (publicKey: string) => {
  if (!publicKey) return '';
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
};