/**
 * App Wallet Service
 * Manages the application's own wallet for Toby token distribution
 */
import { ethers } from 'ethers';

// Minimal ERC20 ABI for token transfers
const ERC20_ABI = [
  // Transfer function
  'function transfer(address to, uint256 amount) returns (bool)',
  // Balance function
  'function balanceOf(address owner) view returns (uint256)'
];

// Toby token contract address on Base network - from environment variable
const TOBY_TOKEN_ADDRESS = import.meta.env.VITE_TOBY_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

// Interface for app wallet configuration
interface AppWalletConfig {
  enabled: boolean;
  address: string;
  privateKey?: string;
  provider: ethers.providers.Provider;
}

// App wallet state
let appWallet: AppWalletConfig | null = null;

/**
 * Initialize the app wallet from environment variables
 */
export const initializeAppWallet = (): AppWalletConfig | null => {
  try {
    const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
    const address = import.meta.env.VITE_WALLET_ADDRESS;
    const rpcUrl = import.meta.env.VITE_BASE_RPC_URL;
    
    if (!address) {
      console.warn('App wallet address not configured');
      return null;
    }
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create wallet configuration
    appWallet = {
      enabled: Boolean(address),
      address: address || '',
      privateKey: privateKey, // Optional, can be undefined for read-only
      provider
    };
    
    return appWallet;
  } catch (error) {
    console.error('Failed to initialize app wallet:', error);
    return null;
  }
};

/**
 * Get the app wallet configuration
 */
export const getAppWallet = (): AppWalletConfig | null => {
  if (!appWallet) {
    return initializeAppWallet();
  }
  return appWallet;
};

/**
 * Check if app wallet is configured with a private key
 */
export const canSendTokens = (): boolean => {
  return Boolean(appWallet?.privateKey && appWallet?.address);
};

/**
 * Create a wallet signer (only if private key is available)
 */
export const getWalletSigner = (): ethers.Wallet | null => {
  if (!appWallet?.privateKey || !appWallet.provider) {
    return null;
  }
  
  try {
    return new ethers.Wallet(appWallet.privateKey, appWallet.provider);
  } catch (error) {
    console.error('Failed to create wallet signer:', error);
    return null;
  }
};

/**
 * Get app wallet address
 */
export const getAppWalletAddress = (): string => {
  return appWallet?.address || '';
};

/**
 * Test wallet functionality by sending a small amount of ETH to itself
 * @returns Transaction hash if successful
 */
export const testWalletWithSelfTransfer = async (): Promise<string> => {
  try {
    // Get wallet signer
    const wallet = getWalletSigner();
    if (!wallet) {
      throw new Error('Failed to create wallet signer');
    }
    
    // Get wallet address
    const address = getAppWalletAddress();
    if (!address) {
      throw new Error('Wallet address not configured');
    }
    
    // Check balance first
    const balance = await wallet.getBalance();
    if (balance.lt(ethers.utils.parseEther('0.0002'))) {
      throw new Error(`Wallet has insufficient balance: ${ethers.utils.formatEther(balance)} ETH`);
    }
    
    console.log(`Current wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // Send a small amount to self
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.utils.parseEther('0.0001'),
      gasLimit: 21000 // Standard gas limit for simple ETH transfers
    });
    
    console.log('Self-transfer transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    return tx.hash;
  } catch (error) {
    console.error('Failed to send self-transfer transaction:', error);
    throw error;
  }
};

/**
 * Send Toby tokens to a user
 * @param toAddress Recipient wallet address
 * @param amount Amount of Toby tokens to send (default: 10)
 * @returns Transaction hash if successful
 */
export const sendTobyTokens = async (toAddress: string, amount: number = 10): Promise<string> => {
  try {
    // Get wallet signer
    const wallet = getWalletSigner();
    if (!wallet) {
      throw new Error('Failed to create wallet signer');
    }
    
    // Check if recipient address is valid
    if (!ethers.utils.isAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    
    // Create contract instance
    const tokenContract = new ethers.Contract(
      TOBY_TOKEN_ADDRESS,
      ERC20_ABI,
      wallet
    );
    
    // Assuming the token has 18 decimals, like most ERC20 tokens
    const tokenAmount = ethers.utils.parseUnits(amount.toString(), 18);
    
    // Check token balance
    const tokenBalance = await tokenContract.balanceOf(getAppWalletAddress());
    if (tokenBalance.lt(tokenAmount)) {
      throw new Error(`Insufficient Toby token balance: ${ethers.utils.formatUnits(tokenBalance, 18)}`);
    }
    
    // Execute token transfer
    const tx = await tokenContract.transfer(toAddress, tokenAmount, {
      gasLimit: 100000 // Higher gas limit for token transfers
    });
    
    console.log(`Sent ${amount} Toby tokens to ${toAddress}, tx hash: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Token transfer confirmed in block:', receipt.blockNumber);
    
    return tx.hash;
  } catch (error) {
    console.error('Failed to send Toby tokens:', error);
    throw error;
  }
};