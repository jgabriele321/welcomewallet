/**
 * Service for interacting with the Base blockchain
 */
import { ethers } from 'ethers';
import { calculateUsdValue, getMultipleTokenPrices } from './priceService';

// ERC20 token ABI (minimal ABI for balance checking and transfers)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

// Token addresses on Base chain
const TOKENS = {
  BTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC on Base (chainId 8453)
  SOL: '0x9B8Df6E244526ab5F6e6400d331DB28C8fdDdb55', // uSOL on Base (chainId 8453)
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base (chainId 8453)
  TOBY: '0xb8d98a102b0079b69ffbc760c8d857a31653e56e', // TOBY token on Base (chainId 8453)
};

// Chain ID constants
const CHAIN_IDS = {
  BASE: 8453, // Base mainnet
};

// Asset interface
export interface Asset {
  symbol: string;
  balance: string;
  icon: string;
  usdValue?: string; // USD value of the asset
  priceUsd?: number; // Price per token in USD
}

// Global provider instance to reuse across requests
let cachedProvider: ethers.providers.JsonRpcProvider | null = null;

/**
 * Creates an ethers provider for Base chain
 * @returns Provider for Base chain
 */
export const getBaseProvider = (): ethers.providers.JsonRpcProvider => {
  // Return cached provider if available to reduce instantiation overhead
  if (cachedProvider) {
    return cachedProvider;
  }
  
  // Ensure we're connecting to Base chain
  // Use a premium RPC provider URL if available (more performant than public endpoints)
  const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org';
  
  // Create a provider with explicit network information for Base chain
  const provider = new ethers.providers.JsonRpcProvider(baseRpcUrl, {
    chainId: CHAIN_IDS.BASE,
    name: 'Base',
    ensAddress: undefined  // Base doesn't use ENS
  });
  
  // Set higher polling interval to reduce network load (default is 4000ms)
  // For faster response consider a premium provider instead of longer polling
  provider.pollingInterval = 8000;
  
  // Log the network to verify
  provider.getNetwork().then(network => {
    console.log('Connected to network:', network.name, 'chainId:', network.chainId);
  });
  
  // Cache the provider for future use
  cachedProvider = provider;
  
  return provider;
};

/**
 * Gets ETH balance for an address
 * @param address - Wallet address to check
 * @returns Formatted ETH balance
 */
export const getEthBalance = async (address: string): Promise<string> => {
  try {
    const provider = getBaseProvider();
    const balanceWei = await provider.getBalance(address);
    return ethers.utils.formatEther(balanceWei);
  } catch (error) {
    console.error('Error getting ETH balance:', error);
    return '0';
  }
};

// Cache for token contract instances
const tokenContractCache: { [address: string]: ethers.Contract } = {};

// Cache for token metadata to avoid fetching decimals and symbol repeatedly
const tokenMetadataCache: { 
  [address: string]: { decimals: number; symbol: string }
} = {};

// Initialize token metadata cache from localStorage if available
try {
  const savedMetadata = localStorage.getItem('tokenMetadataCache');
  if (savedMetadata) {
    const parsed = JSON.parse(savedMetadata);
    Object.assign(tokenMetadataCache, parsed);
    console.log('Loaded token metadata from localStorage', Object.keys(tokenMetadataCache).length, 'tokens');
  }
} catch (e) {
  console.warn('Failed to load token metadata from localStorage:', e);
}

// Save token metadata to localStorage
const saveTokenMetadata = () => {
  try {
    localStorage.setItem('tokenMetadataCache', JSON.stringify(tokenMetadataCache));
  } catch (e) {
    console.warn('Failed to save token metadata to localStorage:', e);
  }
};

/**
 * Gets token balance for a specific token
 * @param address - Wallet address to check
 * @param tokenAddress - Token contract address
 * @returns Token balance info
 */
export const getTokenBalance = async (
  address: string, 
  tokenAddress: string
): Promise<{ balance: string; symbol: string }> => {
  try {
    // Get or create token contract instance
    let tokenContract = tokenContractCache[tokenAddress];
    if (!tokenContract) {
      const provider = getBaseProvider();
      tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      tokenContractCache[tokenAddress] = tokenContract;
    }
    
    // Get token metadata (decimals, symbol) from cache or fetch
    let metadata = tokenMetadataCache[tokenAddress];
    if (!metadata) {
      console.log(`Fetching metadata for token ${tokenAddress}`);
      const [decimals, symbol] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.symbol(),
      ]);
      
      metadata = { decimals, symbol };
      tokenMetadataCache[tokenAddress] = metadata;
      
      // Save updated metadata to localStorage
      saveTokenMetadata();
    }
    
    // Only fetch the balance (metadata is cached)
    const balanceRaw = await tokenContract.balanceOf(address);
    const balance = ethers.utils.formatUnits(balanceRaw, metadata.decimals);
    
    console.log(`Token balance for ${tokenAddress}: ${balance} ${metadata.symbol}`);
    
    return { 
      balance, 
      symbol: metadata.symbol
    };
  } catch (error) {
    console.error(`Error getting token balance for ${tokenAddress}:`, error);
    return { 
      balance: '0', 
      symbol: 'Unknown' 
    };
  }
};

// Balance cache interface
interface BalanceCache {
  assets: Asset[];
  timestamp: number;
  address: string;
}

// Cache settings
const CACHE_TTL_MS = 60000; // 1 minute cache TTL
let balanceCache: BalanceCache | null = null;

/**
 * Gets all relevant token balances for the dashboard
 * @param address - Wallet address to check
 * @param forceRefresh - Force a refresh bypassing the cache
 * @returns Array of token balances
 */
export const getAllTokenBalances = async (
  address: string, 
  forceRefresh: boolean = false
): Promise<Asset[]> => {
  if (!address) return [];
  
  // Check if we have a valid cache entry
  const now = Date.now();
  const cacheValid = balanceCache && 
                     balanceCache.address === address &&
                     now - balanceCache.timestamp < CACHE_TTL_MS;
  
  // Return cached data if valid and not forcing refresh
  if (cacheValid && !forceRefresh) {
    console.log('Using cached token balances from', new Date(balanceCache!.timestamp).toLocaleTimeString());
    return balanceCache!.assets;
  }
  
  try {
    console.log('Fetching fresh token balances at', new Date().toLocaleTimeString());
    
    // Get ETH balance
    const ethBalance = await getEthBalance(address);
    
    // Debug token addresses
    console.log('Token addresses used for balance check:', {
      BTC: TOKENS.BTC,
      SOL: TOKENS.SOL,
      USDC: TOKENS.USDC,
      TOBY: TOKENS.TOBY,
      ENV_TOBY: import.meta.env.VITE_TOBY_TOKEN_ADDRESS
    });
    
    // Get token balances in parallel
    const [btcBalance, solBalance, usdcBalance, tobyBalance] = await Promise.all([
      getTokenBalance(address, TOKENS.BTC),
      getTokenBalance(address, TOKENS.SOL),
      getTokenBalance(address, TOKENS.USDC),
      getTokenBalance(address, TOKENS.TOBY),
    ]);
    
    console.log('Raw token balances:', {
      btcBalance,
      solBalance,
      usdcBalance,
      tobyBalance
    });
    
    // Get token prices in batch for efficiency
    console.log('Fetching token prices in batch from CoinGecko...');
    const tokenSymbols = ['ETH', 'BTC', 'SOL', 'USDC', 'TOBY'];
    const prices = await getMultipleTokenPrices(tokenSymbols);
    
    console.log('Received prices:', prices);
    
    // Calculate USD values
    const ethUsdValue = calculateUsdValue(ethBalance, prices.ETH);
    const btcUsdValue = calculateUsdValue(btcBalance.balance, prices.BTC);
    const solUsdValue = calculateUsdValue(solBalance.balance, prices.SOL);
    const usdcUsdValue = calculateUsdValue(usdcBalance.balance, prices.USDC);
    const tobyUsdValue = calculateUsdValue(tobyBalance.balance, prices.TOBY);
    
    const result = [
      {
        symbol: 'ETH',
        balance: ethBalance,
        icon: '⬨', // Ethereum symbol
        usdValue: ethUsdValue,
        priceUsd: prices.ETH
      },
      {
        symbol: 'BTC', // cbBTC token
        balance: btcBalance.balance,
        icon: '₿', // Bitcoin symbol
        usdValue: btcUsdValue,
        priceUsd: prices.BTC
      },
      {
        symbol: 'SOL', // uSOL token
        balance: solBalance.balance,
        icon: '◎', // Solana symbol
        usdValue: solUsdValue,
        priceUsd: prices.SOL
      },
      {
        symbol: 'USDC', // Hardcode to ensure consistency
        balance: usdcBalance.balance,
        icon: '$', // Dollar symbol for USDC
        usdValue: usdcUsdValue,
        priceUsd: prices.USDC
      },
      {
        symbol: 'TOBY', // Hardcode to ensure consistency
        balance: tobyBalance.balance,
        icon: '🔹', // Generic token symbol for TOBY
        usdValue: tobyUsdValue,
        priceUsd: prices.TOBY
      },
    ];
    
    console.log('Final assets returned with USD values:', result);
    
    // Update the cache
    balanceCache = {
      assets: result,
      timestamp: now,
      address
    };
    
    return result;
  } catch (error) {
    console.error('Error getting all token balances:', error);
    
    // If we have a cache, return it even if expired as fallback
    if (balanceCache && balanceCache.address === address) {
      console.log('Using expired cache as fallback due to error');
      return balanceCache.assets;
    }
    
    return [];
  }
};

/**
 * Gets a token address by symbol
 * @param symbol - Token symbol
 * @returns Token contract address
 */
export const getTokenAddressBySymbol = (symbol: string): string => {
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return TOKENS.BTC;
    case 'SOL':
      return TOKENS.SOL;
    case 'USDC':
      return TOKENS.USDC;
    case 'TOBY':
      return TOKENS.TOBY;
    default:
      return '';
  }
};

/**
 * Sends ETH from the user's wallet
 * @param signer - The ethers.js signer object (connected wallet)
 * @param toAddress - Recipient address
 * @param amount - Amount of ETH to send
 * @param gasMultiplier - Gas price multiplier (0.8 for slow, 1 for normal, 1.5 for fast)
 * @returns Transaction hash
 */
export const sendTransaction = async (
  signer: ethers.Signer,
  toAddress: string,
  amount: string,
  gasMultiplier: number = 1.0
): Promise<string> => {
  console.log('🔷 baseChainService.sendTransaction called with:', {
    toAddress,
    amount,
    gasMultiplier,
    signerAvailable: !!signer
  });
  
  try {
    // Convert amount to wei
    console.log('🔷 Converting amount to wei:', amount);
    const amountWei = ethers.utils.parseEther(amount);
    console.log('🔷 Amount in wei:', amountWei.toString());
    
    // Get gas price and adjust by multiplier
    console.log('🔷 Getting Base provider...');
    const provider = getBaseProvider();
    
    console.log('🔷 Getting gas price...');
    const gasPrice = await provider.getGasPrice();
    console.log('🔷 Current gas price:', gasPrice.toString());
    
    const adjustedGasPrice = gasPrice.mul(Math.floor(gasMultiplier * 100)).div(100);
    console.log('🔷 Adjusted gas price:', adjustedGasPrice.toString());
    
    // Create transaction with explicit chainId for Base
    console.log('🔷 Preparing transaction with chainId:', CHAIN_IDS.BASE);
    
    const txRequest = {
      to: toAddress,
      value: amountWei,
      gasPrice: adjustedGasPrice,
      chainId: CHAIN_IDS.BASE, // Base chain ID (8453)
    };
    console.log('🔷 Transaction request ready:', txRequest);
    
    console.log('🔷 Calling signer.sendTransaction...');
    const tx = await signer.sendTransaction(txRequest);
    console.log('🔷 Transaction sent successfully!');
    console.log('🔷 Transaction details:', {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value?.toString(),
    });
    
    // Wait for transaction to be mined
    console.log('🔷 Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log('🔷 Transaction confirmed! Block:', receipt.blockNumber);
    
    return tx.hash;
  } catch (error: any) {
    console.error('❌ Error sending ETH:', error);
    
    // Additional error details
    if (error.code) {
      console.error('❌ Error code:', error.code);
    }
    if (error.reason) {
      console.error('❌ Error reason:', error.reason);
    }
    if (error.error) {
      console.error('❌ Inner error:', error.error);
    }
    
    throw error;
  }
};

/**
 * Sends ERC20 tokens from the user's wallet
 * @param signer - The ethers.js signer object (connected wallet)
 * @param tokenAddress - Token contract address
 * @param toAddress - Recipient address
 * @param amount - Amount of tokens to send
 * @param decimals - Token decimals
 * @param gasMultiplier - Gas price multiplier (0.8 for slow, 1 for normal, 1.5 for fast)
 * @returns Transaction hash
 */
export const sendTokens = async (
  signer: ethers.Signer,
  tokenAddress: string,
  toAddress: string,
  amount: string,
  decimals: number = 18,
  gasMultiplier: number = 1.0
): Promise<string> => {
  console.log('🔶 baseChainService.sendTokens called with:', {
    tokenAddress,
    toAddress,
    amount,
    decimals,
    gasMultiplier,
    signerAvailable: !!signer
  });
  
  try {
    // Convert amount to token units
    console.log(`🔶 Converting amount to token units with ${decimals} decimals:`, amount);
    const amountUnits = ethers.utils.parseUnits(amount, decimals);
    console.log('🔶 Amount in token units:', amountUnits.toString());
    
    // Get gas price and adjust by multiplier
    console.log('🔶 Getting Base provider...');
    const provider = getBaseProvider();
    
    console.log('🔶 Getting gas price...');
    const gasPrice = await provider.getGasPrice();
    console.log('🔶 Current gas price:', gasPrice.toString());
    
    const adjustedGasPrice = gasPrice.mul(Math.floor(gasMultiplier * 100)).div(100);
    console.log('🔶 Adjusted gas price:', adjustedGasPrice.toString());
    
    // Create token contract instance with signer
    console.log('🔶 Creating token contract instance for address:', tokenAddress);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    console.log('🔶 Token contract created successfully');
    
    // Prepare transaction options
    const txOptions = {
      gasPrice: adjustedGasPrice,
      // Note: Don't include chainId here - it's determined by the provider
    };
    console.log('🔶 Transaction options:', txOptions);
    
    // Log contract details
    console.log('🔶 Sending token transfer, details:', {
      from: await signer.getAddress(),
      to: toAddress,
      tokenContract: tokenAddress,
      amount: amountUnits.toString(),
    });
    
    // Send token transfer transaction
    console.log('🔶 Calling tokenContract.transfer...');
    const tx = await tokenContract.transfer(toAddress, amountUnits, txOptions);
    console.log('🔶 Token transfer transaction sent successfully!');
    console.log('🔶 Transaction hash:', tx.hash);
    
    // Wait for transaction to be mined
    console.log('🔶 Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log('🔶 Transaction confirmed! Block:', receipt.blockNumber);
    
    return tx.hash;
  } catch (error: any) {
    console.error('❌ Error sending tokens:', error);
    
    // Additional error details
    if (error.code) {
      console.error('❌ Error code:', error.code);
    }
    if (error.reason) {
      console.error('❌ Error reason:', error.reason);
    }
    if (error.error) {
      console.error('❌ Inner error:', error.error);
    }
    
    throw error;
  }
};