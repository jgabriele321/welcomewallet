/**
 * Service for interacting with the Base blockchain
 */
import { ethers } from 'ethers';

// ERC20 token ABI (minimal ABI for balance checking)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Token addresses on Base
const TOKENS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  TOBY: '0xb8d98a102b0079b69ffbc760c8d857a31653e56e', // TOBY token
};

/**
 * Creates an ethers provider for Base chain
 * @returns {ethers.providers.JsonRpcProvider} Provider for Base chain
 */
export const getBaseProvider = () => {
  const baseRpcUrl = process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org';
  return new ethers.providers.JsonRpcProvider(baseRpcUrl);
};

/**
 * Gets ETH balance for an address
 * @param {string} address - Wallet address to check
 * @returns {Promise<string>} Formatted ETH balance
 */
export const getEthBalance = async (address) => {
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
 * @param {string} address - Wallet address to check
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<{balance: string, symbol: string}>} Token balance info
 */
export const getTokenBalance = async (address, tokenAddress) => {
  try {
    const provider = getBaseProvider();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [balanceRaw, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals(),
      tokenContract.symbol(),
    ]);
    
    const balance = ethers.utils.formatUnits(balanceRaw, decimals);
    
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
 * @param {string} address - Wallet address to check
 * @returns {Promise<Array>} Array of token balances
 */
export const getAllTokenBalances = async (address) => {
  if (!address) return [];
  
  try {
    // Get ETH balance
    const ethBalance = await getEthBalance(address);
    
    // Get token balances in parallel
    const [usdcBalance, tobyBalance] = await Promise.all([
      getTokenBalance(address, TOKENS.USDC),
      getTokenBalance(address, TOKENS.TOBY),
    ]);
    
    return [
      {
        symbol: 'ETH',
        balance: ethBalance,
        icon: '⬨', // Ethereum symbol
      },
      {
        symbol: usdcBalance.symbol,
        balance: usdcBalance.balance,
        icon: '$', // Dollar symbol for USDC
      },
      {
        symbol: tobyBalance.symbol,
        balance: tobyBalance.balance,
        icon: '🔹', // Generic token symbol for TOBY
      },
    ];
  } catch (error) {
    console.error('Error getting all token balances:', error);
    return [];
  }
};