/**
 * Service for interacting with the Base blockchain
 */
import { ethers } from 'ethers';

// ERC20 token ABI (minimal ABI for balance checking and transfers)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

// Token addresses on Base chain
const TOKENS = {
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
}

/**
 * Creates an ethers provider for Base chain
 * @returns Provider for Base chain
 */
export const getBaseProvider = (): ethers.providers.JsonRpcProvider => {
  // Ensure we're connecting to Base chain
  const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org';
  
  // Create a provider with explicit network information for Base chain
  const provider = new ethers.providers.JsonRpcProvider(baseRpcUrl, {
    chainId: CHAIN_IDS.BASE,
    name: 'Base',
    ensAddress: null  // Base doesn't use ENS
  });
  
  // Log the network to verify
  provider.getNetwork().then(network => {
    console.log('Connected to network:', network.name, 'chainId:', network.chainId);
  });
  
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
    const provider = getBaseProvider();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [balanceRaw, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals(),
      tokenContract.symbol(),
    ]);
    
    const balance = ethers.utils.formatUnits(balanceRaw, decimals);
    
    console.log(`Token balance for ${tokenAddress}: ${balance} ${symbol}`);
    
    return { 
      balance, 
      symbol 
    };
  } catch (error) {
    console.error(`Error getting token balance for ${tokenAddress}:`, error);
    return { 
      balance: '0', 
      symbol: 'Unknown' 
    };
  }
};

/**
 * Gets all relevant token balances for the dashboard
 * @param address - Wallet address to check
 * @returns Array of token balances
 */
export const getAllTokenBalances = async (address: string): Promise<Asset[]> => {
  if (!address) return [];
  
  try {
    // Get ETH balance
    const ethBalance = await getEthBalance(address);
    
    // Debug token addresses
    console.log('Token addresses used for balance check:', {
      USDC: TOKENS.USDC,
      TOBY: TOKENS.TOBY,
      ENV_TOBY: import.meta.env.VITE_TOBY_TOKEN_ADDRESS
    });
    
    // Get token balances in parallel
    const [usdcBalance, tobyBalance] = await Promise.all([
      getTokenBalance(address, TOKENS.USDC),
      getTokenBalance(address, TOKENS.TOBY),
    ]);
    
    console.log('Raw token balances:', {
      usdcBalance,
      tobyBalance
    });
    
    const result = [
      {
        symbol: 'ETH',
        balance: ethBalance,
        icon: '⬨', // Ethereum symbol
      },
      {
        symbol: 'USDC', // Hardcode to ensure consistency
        balance: usdcBalance.balance,
        icon: '$', // Dollar symbol for USDC
      },
      {
        symbol: 'TOBY', // Hardcode to ensure consistency
        balance: tobyBalance.balance,
        icon: '🔹', // Generic token symbol for TOBY
      },
    ];
    
    console.log('Final assets returned:', result);
    
    return result;
  } catch (error) {
    console.error('Error getting all token balances:', error);
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
  } catch (error) {
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
  } catch (error) {
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