import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Define constants
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

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