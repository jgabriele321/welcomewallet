/**
 * App Wallet Service
 * Manages the application's own wallet for Toby token distribution
 */
import { ethers } from 'ethers';

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
    const privateKey = process.env.REACT_APP_WALLET_PRIVATE_KEY;
    const address = process.env.REACT_APP_WALLET_ADDRESS;
    const rpcUrl = process.env.REACT_APP_BASE_RPC_URL;
    
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