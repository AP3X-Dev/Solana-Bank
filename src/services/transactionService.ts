import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  Commitment,
  TransactionSignature,
  SendOptions
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { validateTransaction } from '../utils/security';
import { dataService } from './dataService';

// Transaction types
export enum TransactionType {
  TRANSFER = 'transfer',
  TOKEN_TRANSFER = 'token_transfer',
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CREATE_ACCOUNT = 'create_account',
  CLOSE_ACCOUNT = 'close_account',
  CUSTOM = 'custom'
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  REJECTED = 'rejected'
}

// Transaction options
export interface TransactionOptions {
  commitment?: Commitment;
  maxRetries?: number;
  skipPreflight?: boolean;
  preflightCommitment?: Commitment;
  priorityFee?: number; // in micro-lamports
  computeUnits?: number;
  timeout?: number; // in milliseconds
}

// Default transaction options
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  commitment: 'confirmed',
  maxRetries: 3,
  skipPreflight: false,
  preflightCommitment: 'processed',
  priorityFee: 0,
  computeUnits: 200000,
  timeout: 30000 // 30 seconds
};

// Transaction result
export interface TransactionResult {
  signature: string;
  status: TransactionStatus;
  error?: string;
  blockTime?: number;
  confirmations?: number;
  fee?: number;
}

// Transaction service
export const transactionService = {
  /**
   * Send SOL to another wallet
   */
  sendSol: async (
    wallet: WalletContextState,
    connection: Connection,
    recipient: string,
    amount: number,
    options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS
  ): Promise<TransactionResult> => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected or does not support signing');
      }

      // Convert amount to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = Math.round(amount * 1e9);
      
      // Validate amount
      if (lamports <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      // Check if recipient is a valid public key
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch (error) {
        throw new Error('Invalid recipient address');
      }
      
      // Check if sender has enough balance
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance < lamports) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction instructions
      const instructions: TransactionInstruction[] = [
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: recipientPubkey,
          lamports
        })
      ];
      
      // Add compute budget instruction if priority fee is set
      if (options.priorityFee && options.priorityFee > 0) {
        instructions.unshift(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: options.priorityFee
          })
        );
      }
      
      // Add compute units instruction if compute units is set
      if (options.computeUnits && options.computeUnits > 0) {
        instructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: options.computeUnits
          })
        );
      }
      
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = 
        await connection.getLatestBlockhash(options.commitment);
      
      // Create transaction
      const transaction = new Transaction({
        feePayer: wallet.publicKey,
        blockhash,
        lastValidBlockHeight
      }).add(...instructions);
      
      // Validate transaction
      const validation = validateTransaction(transaction, amount);
      if (!validation.isValid) {
        throw new Error(validation.reason || 'Transaction validation failed');
      }
      
      // Sign transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Send transaction with timeout
      const { signature, status, error } = await sendTransactionWithTimeout(
        connection,
        signedTransaction,
        options
      );
      
      // If transaction was successful, record it
      if (status === TransactionStatus.CONFIRMED || status === TransactionStatus.FINALIZED) {
        try {
          // Get transaction fee
          const txDetails = await connection.getTransaction(signature, {
            commitment: 'confirmed'
          });
          
          // Record transaction in our system
          await dataService.transactions.create(wallet.publicKey.toString(), {
            type: TransactionType.TRANSFER,
            amount: -amount, // Negative for outgoing
            timestamp: new Date().toISOString(),
            status: status,
            recipient: recipient,
            signature: signature,
            fee: txDetails?.meta?.fee ? txDetails.meta.fee / 1e9 : undefined,
            blockTime: txDetails?.blockTime
          });
        } catch (recordError) {
          console.error('Error recording transaction:', recordError);
          // Continue even if recording fails
        }
      }
      
      return {
        signature,
        status,
        error
      };
    } catch (error) {
      console.error('Send SOL error:', error);
      return {
        signature: '',
        status: TransactionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  /**
   * Get transaction details
   */
  getTransactionDetails: async (
    connection: Connection,
    signature: string,
    commitment: Commitment = 'confirmed'
  ) => {
    try {
      const txDetails = await connection.getTransaction(signature, {
        commitment
      });
      
      if (!txDetails) {
        return null;
      }
      
      return {
        signature,
        blockTime: txDetails.blockTime,
        slot: txDetails.slot,
        fee: txDetails.meta?.fee ? txDetails.meta.fee / 1e9 : 0,
        status: txDetails.meta?.err ? TransactionStatus.FAILED : TransactionStatus.CONFIRMED,
        confirmations: txDetails.confirmations || 0
      };
    } catch (error) {
      console.error('Get transaction details error:', error);
      throw error;
    }
  },
  
  /**
   * Get recent transactions for a wallet
   */
  getRecentTransactions: async (
    connection: Connection,
    publicKey: PublicKey,
    limit: number = 10
  ) => {
    try {
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );
      
      return signatures.map(sig => ({
        signature: sig.signature,
        blockTime: sig.blockTime,
        slot: sig.slot,
        err: sig.err,
        memo: sig.memo,
        status: sig.err ? TransactionStatus.FAILED : TransactionStatus.CONFIRMED
      }));
    } catch (error) {
      console.error('Get recent transactions error:', error);
      throw error;
    }
  }
};

/**
 * Send transaction with timeout
 */
const sendTransactionWithTimeout = async (
  connection: Connection,
  transaction: Transaction,
  options: TransactionOptions
): Promise<{ signature: string; status: TransactionStatus; error?: string }> => {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;
    let done = false;
    
    // Set timeout
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        if (!done) {
          done = true;
          resolve({
            signature: '',
            status: TransactionStatus.TIMEOUT,
            error: 'Transaction timed out'
          });
        }
      }, options.timeout);
    }
    
    // Send transaction
    const sendOptions: SendOptions = {
      skipPreflight: options.skipPreflight,
      preflightCommitment: options.preflightCommitment,
      maxRetries: options.maxRetries
    };
    
    connection.sendRawTransaction(transaction.serialize(), sendOptions)
      .then(signature => {
        // Wait for confirmation
        connection.confirmTransaction({
          signature,
          blockhash: transaction.recentBlockhash!,
          lastValidBlockHeight: transaction.lastValidBlockHeight!
        }, options.commitment)
          .then(confirmation => {
            if (done) return;
            
            clearTimeout(timeoutId);
            done = true;
            
            if (confirmation.value.err) {
              resolve({
                signature,
                status: TransactionStatus.FAILED,
                error: JSON.stringify(confirmation.value.err)
              });
            } else {
              resolve({
                signature,
                status: TransactionStatus.CONFIRMED
              });
            }
          })
          .catch(error => {
            if (done) return;
            
            clearTimeout(timeoutId);
            done = true;
            
            resolve({
              signature,
              status: TransactionStatus.FAILED,
              error: error.message
            });
          });
      })
      .catch(error => {
        if (done) return;
        
        clearTimeout(timeoutId);
        done = true;
        
        resolve({
          signature: '',
          status: TransactionStatus.FAILED,
          error: error.message
        });
      });
  });
};
