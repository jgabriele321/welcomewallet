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

// Gas distribution tracking
const GAS_STORAGE_KEY = 'gas_distribution';
const GAS_AMOUNT = 0.0005; // 0.0005 ETH per user
const GAS_TOTAL_LIMIT = 0.005; // 0.005 ETH total limit

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

/**
 * Check if wallet has already received gas
 * @param walletAddress The wallet address to check
 * @returns True if the wallet has already received gas
 */
export const hasReceivedGas = (walletAddress: string): boolean => {
  try {
    const gasData = localStorage.getItem(GAS_STORAGE_KEY);
    if (!gasData) return false;
    
    const parsedData = JSON.parse(gasData);
    return parsedData.recipients.includes(walletAddress);
  } catch (error) {
    console.error('Error checking gas receipt status:', error);
    return false;
  }
};

/**
 * Get total gas distributed so far
 * @returns Total ETH already distributed as gas
 */
export const getTotalGasDistributed = (): number => {
  try {
    const gasData = localStorage.getItem(GAS_STORAGE_KEY);
    if (!gasData) return 0;
    
    const parsedData = JSON.parse(gasData);
    return parsedData.total || 0;
  } catch (error) {
    console.error('Error getting total gas distributed:', error);
    return 0;
  }
};

/**
 * Check if gas distribution limit has been reached
 * @returns True if the limit has been reached
 */
export const isGasLimitReached = (): boolean => {
  return getTotalGasDistributed() >= GAS_TOTAL_LIMIT;
};

/**
 * Reset gas distribution tracking
 */
export const resetGasDistribution = (): void => {
  localStorage.setItem(GAS_STORAGE_KEY, JSON.stringify({
    recipients: [],
    total: 0
  }));
};

/**
 * Record gas distribution
 * @param walletAddress The wallet that received gas
 */
const recordGasDistribution = (walletAddress: string): void => {
  try {
    // Get existing data
    const gasData = localStorage.getItem(GAS_STORAGE_KEY);
    let parsedData = gasData 
      ? JSON.parse(gasData) 
      : { recipients: [], total: 0 };
    
    // Add new recipient
    if (!parsedData.recipients.includes(walletAddress)) {
      parsedData.recipients.push(walletAddress);
      parsedData.total = (parsedData.total || 0) + GAS_AMOUNT;
    }
    
    // Save updated data
    localStorage.setItem(GAS_STORAGE_KEY, JSON.stringify(parsedData));
  } catch (error) {
    console.error('Error recording gas distribution:', error);
  }
};

/**
 * Send gas (ETH) to a user
 * @param toAddress Recipient wallet address
 * @returns Transaction hash if successful
 */
export const sendGas = async (toAddress: string): Promise<string> => {
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
    
    // Check if wallet has already received gas
    if (hasReceivedGas(toAddress)) {
      throw new Error('This wallet has already received gas');
    }
    
    // Check if gas limit is reached
    if (isGasLimitReached()) {
      throw new Error('Gas distribution limit has been reached');
    }
    
    // Check wallet ETH balance
    const balance = await wallet.getBalance();
    const gasAmount = ethers.utils.parseEther(GAS_AMOUNT.toString());
    
    if (balance.lt(gasAmount.add(ethers.utils.parseEther('0.001')))) { // Adding buffer for gas fee
      throw new Error(`Insufficient wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
    }
    
    // Send ETH
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: gasAmount,
      gasLimit: 21000 // Standard gas limit for ETH transfers
    });
    
    console.log(`Sent ${GAS_AMOUNT} ETH as gas to ${toAddress}, tx hash: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Gas transfer confirmed in block:', receipt.blockNumber);
    
    // Record gas distribution
    recordGasDistribution(toAddress);
    
    return tx.hash;
  } catch (error) {
    console.error('Failed to send gas:', error);
    throw error;
  }
};