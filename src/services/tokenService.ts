import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js';
// Import what's available in @solana/spl-token v0.1.8
import {
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

import { WalletContextState } from '@solana/wallet-adapter-react';
import { TokenBalance } from '../types';
import { validateTransaction } from '../utils/security';
import { dataService } from './dataService';
import { TransactionType, TransactionStatus, TransactionOptions, TransactionResult } from './transactionService';

// Define constants
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Helper function to get token account info
async function getTokenAccountInfo(connection: Connection, address: PublicKey) {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) throw new Error('Account not found');

  return accountInfo;
}

// Helper function to get associated token address
async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  return await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  ).then(([address]) => address);
}

// Helper function to create associated token account instruction
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
}

// Helper function to get account info
async function getAccount(connection: Connection, address: PublicKey) {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) throw new Error('Account not found');

  return {
    address,
    amount: BigInt(0), // Placeholder since we can't parse the actual amount
    owner: new PublicKey(accountInfo.owner)
  };
}

// Helper function to create transfer instruction
function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number
): TransactionInstruction {
  const dataLayout = {
    instruction: 3, // Transfer instruction
    amount: BigInt(amount),
  };

  // Create a buffer with the instruction data
  const data = Buffer.alloc(9); // 1 byte for instruction, 8 bytes for amount
  data.writeUInt8(dataLayout.instruction, 0);

  // Write the amount as a 64-bit unsigned integer (little-endian)
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(dataLayout.amount, 0);
  amountBuf.copy(data, 1);

  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data,
  });
}

// Default token options
const DEFAULT_TOKEN_OPTIONS: TransactionOptions = {
  commitment: 'confirmed',
  maxRetries: 3,
  skipPreflight: false,
  preflightCommitment: 'processed',
  priorityFee: 0,
  computeUnits: 200000,
  timeout: 30000 // 30 seconds
};

// Token service
export const tokenService = {
  /**
   * Get all token accounts for a wallet
   */
  getTokenAccounts: async (
    connection: Connection,
    walletAddress: string
  ): Promise<TokenBalance[]> => {
    try {
      const publicKey = new PublicKey(walletAddress);

      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Process token accounts
      const tokenBalances: TokenBalance[] = [];

      for (const { account, pubkey } of tokenAccounts.value) {
        const parsedAccountInfo = account.data.parsed.info;
        const mintAddress = parsedAccountInfo.mint;
        const amount = parsedAccountInfo.tokenAmount.amount;
        const decimals = parsedAccountInfo.tokenAmount.decimals;
        const uiAmount = parsedAccountInfo.tokenAmount.uiAmount;

        // Skip accounts with zero balance
        if (amount === '0') {
          continue;
        }

        try {
          // Get mint info using available functions in v0.1.8
          const mintInfo = await connection.getAccountInfo(new PublicKey(mintAddress));

          // Add to token balances
          tokenBalances.push({
            mint: mintAddress,
            symbol: '', // Will be populated from token registry
            name: '', // Will be populated from token registry
            amount: Number(amount),
            decimals,
            uiAmount,
            logo: '',
            price: 0,
            value: 0
          });
        } catch (error) {
          console.error(`Error getting mint info for ${mintAddress}:`, error);
        }
      }

      // Fetch token metadata from Solana token registry or other sources
      // This is a placeholder for actual implementation
      const enrichedTokenBalances = await enrichTokenMetadata(tokenBalances);

      return enrichedTokenBalances;
    } catch (error) {
      console.error('Error getting token accounts:', error);
      throw error;
    }
  },

  /**
   * Send tokens to another wallet
   */
  sendToken: async (
    wallet: WalletContextState,
    connection: Connection,
    tokenMint: string,
    recipient: string,
    amount: number,
    decimals: number,
    options: TransactionOptions = DEFAULT_TOKEN_OPTIONS
  ): Promise<TransactionResult> => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected or does not support signing');
      }

      // Convert amount to token units
      const tokenAmount = Math.round(amount * Math.pow(10, decimals));

      // Validate amount
      if (tokenAmount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Check if recipient is a valid public key
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch (error) {
        throw new Error('Invalid recipient address');
      }

      // Get token mint
      const mintPubkey = new PublicKey(tokenMint);

      // Get source token account
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );

      // Check if source token account exists
      try {
        const sourceAccount = await getAccount(connection, sourceTokenAccount);

        // Check if sender has enough balance
        if (Number(sourceAccount.amount) < tokenAmount) {
          throw new Error('Insufficient token balance');
        }
      } catch (error) {
        throw new Error('Source token account not found');
      }

      // Get or create destination token account
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );

      // Check if destination token account exists
      let instructions: TransactionInstruction[] = [];

      try {
        await getAccount(connection, destinationTokenAccount);
      } catch (error) {
        // Destination token account doesn't exist, create it
        instructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            destinationTokenAccount,
            recipientPubkey,
            mintPubkey
          )
        );
      }

      // Add transfer instruction
      instructions.push(
        createTransferInstruction(
          sourceTokenAccount,
          destinationTokenAccount,
          wallet.publicKey,
          tokenAmount
        )
      );

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

      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: options.skipPreflight,
          preflightCommitment: options.preflightCommitment,
          maxRetries: options.maxRetries
        }
      );

      // Confirm transaction
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, options.commitment);

      // Check if transaction was successful
      if (confirmation.value.err) {
        return {
          signature,
          status: TransactionStatus.FAILED,
          error: JSON.stringify(confirmation.value.err)
        };
      }

      // Get transaction details
      const txDetails = await connection.getTransaction(signature, {
        commitment: options.commitment
      });

      // Record transaction in our system
      try {
        await dataService.transactions.create(wallet.publicKey.toString(), {
          type: TransactionType.TOKEN_TRANSFER,
          amount: -amount, // Negative for outgoing
          timestamp: new Date().toISOString(),
          status: TransactionStatus.CONFIRMED,
          recipient: recipient,
          signature: signature,
          fee: txDetails?.meta?.fee ? txDetails.meta.fee / 1e9 : undefined,
          blockTime: txDetails?.blockTime,
          tokenAddress: tokenMint,
          tokenAmount: amount,
          tokenDecimals: decimals
        });
      } catch (recordError) {
        console.error('Error recording token transaction:', recordError);
        // Continue even if recording fails
      }

      return {
        signature,
        status: TransactionStatus.CONFIRMED,
        blockTime: txDetails?.blockTime,
        confirmations: txDetails?.confirmations,
        fee: txDetails?.meta?.fee ? txDetails.meta.fee / 1e9 : undefined
      };
    } catch (error) {
      console.error('Send token error:', error);
      return {
        signature: '',
        status: TransactionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Enrich token metadata from token registry or other sources
 * This is a placeholder for actual implementation
 */
const enrichTokenMetadata = async (
  tokenBalances: TokenBalance[]
): Promise<TokenBalance[]> => {
  // In a real implementation, you would fetch token metadata from:
  // - Solana token registry
  // - Jupiter API
  // - CoinGecko API
  // - Your own token metadata database

  // For now, we'll just return the original token balances
  return tokenBalances;
};
