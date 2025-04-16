/**
 * Service for fetching and caching token prices
 */

// Cache for token prices
interface TokenPriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

// Price cache and TTL
const TOKEN_PRICES_CACHE_KEY = 'token_prices_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Hardcoded token prices - in a real app, you'd fetch these from an API
const STATIC_PRICES: { [symbol: string]: number } = {
  'ETH': 3100.00,
  'BTC': 62000.00,
  'SOL': 140.00,
  'USDC': 1.00,
  'TOBY': 0.001, // Example price
};

/**
 * Get cached prices from localStorage
 */
const getCachedPrices = (): TokenPriceCache => {
  try {
    const cached = localStorage.getItem(TOKEN_PRICES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to load cached prices:', error);
  }
  return {};
};

/**
 * Save prices to localStorage cache
 */
const savePriceCache = (cache: TokenPriceCache) => {
  try {
    localStorage.setItem(TOKEN_PRICES_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save price cache:', error);
  }
};

/**
 * Get token price in USD
 * In a real app, this would fetch from a price API
 * @param symbol Token symbol
 * @returns Token price in USD
 */
export const getTokenPrice = async (symbol: string): Promise<number> => {
  const uppercaseSymbol = symbol.toUpperCase();
  
  // Check cache first
  const now = Date.now();
  const priceCache = getCachedPrices();
  
  if (
    priceCache[uppercaseSymbol] && 
    now - priceCache[uppercaseSymbol].timestamp < CACHE_TTL_MS
  ) {
    return priceCache[uppercaseSymbol].price;
  }
  
  try {
    // In a real app, you'd fetch prices from an API like CoinGecko
    // For this example, we'll use hardcoded prices
    let price = STATIC_PRICES[uppercaseSymbol] || 0;
    
    // Add some random variation to simulate price changes (+/- 2%)
    const variation = 1 + (Math.random() * 0.04 - 0.02);
    price = price * variation;
    
    // Update cache
    priceCache[uppercaseSymbol] = {
      price,
      timestamp: now
    };
    savePriceCache(priceCache);
    
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    
    // Return cached price even if expired, as fallback
    if (priceCache[uppercaseSymbol]) {
      return priceCache[uppercaseSymbol].price;
    }
    
    // Default fallback prices if nothing else available
    return STATIC_PRICES[uppercaseSymbol] || 0;
  }
};

/**
 * Calculate USD value of tokens
 * @param balance Token balance as string
 * @param price Token price in USD
 * @returns Formatted USD value
 */
export const calculateUsdValue = (balance: string, price: number): string => {
  try {
    const balanceNum = parseFloat(balance);
    const usdValue = balanceNum * price;
    return usdValue.toFixed(2);
  } catch (error) {
    return '0.00';
  }
};