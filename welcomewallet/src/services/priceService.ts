/**
 * Service for fetching and caching token prices using CoinGecko API
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

// CoinGecko API configuration
const COINGECKO_API_KEY = 'CG-53ZYHSmA2RgBw6vEdHUGNpkZ';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Mapping our token symbols to CoinGecko IDs
const COINGECKO_ID_MAP: { [symbol: string]: string } = {
  'ETH': 'ethereum',
  'BTC': 'bitcoin',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'TOBY': 'toby', // Custom token, may not be in CoinGecko
};

// Fallback prices in case the API fails
const FALLBACK_PRICES: { [symbol: string]: number } = {
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
 * Fetch token price from CoinGecko API
 * @param coinId CoinGecko coin ID
 * @returns Price in USD
 */
const fetchPriceFromCoinGecko = async (coinId: string): Promise<number> => {
  try {
    const url = `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data[coinId] && data[coinId].usd) {
      return data[coinId].usd;
    } else {
      throw new Error(`No price data found for ${coinId}`);
    }
  } catch (error) {
    console.error(`Error fetching price from CoinGecko for ${coinId}:`, error);
    throw error;
  }
};

/**
 * Get token price in USD
 * Fetches from CoinGecko API with caching
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
    let price: number;
    
    // Get CoinGecko ID for this token
    const coinId = COINGECKO_ID_MAP[uppercaseSymbol];
    
    if (coinId) {
      // Fetch from CoinGecko API
      price = await fetchPriceFromCoinGecko(coinId);
      console.log(`Fetched real price for ${uppercaseSymbol} from CoinGecko: $${price}`);
    } else {
      // For tokens not in CoinGecko (like TOBY), use fallback price
      price = FALLBACK_PRICES[uppercaseSymbol] || 0;
      console.log(`Using fallback price for ${uppercaseSymbol}: $${price}`);
    }
    
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
      console.log(`Using expired cache for ${uppercaseSymbol}`);
      return priceCache[uppercaseSymbol].price;
    }
    
    // Default fallback prices if nothing else available
    console.log(`Using fallback price for ${uppercaseSymbol}`);
    return FALLBACK_PRICES[uppercaseSymbol] || 0;
  }
};

/**
 * Fetch multiple token prices at once
 * @param symbols Array of token symbols to fetch prices for
 * @returns Object mapping symbols to prices
 */
export const getMultipleTokenPrices = async (symbols: string[]): Promise<{[symbol: string]: number}> => {
  const result: {[symbol: string]: number} = {};
  const now = Date.now();
  const priceCache = getCachedPrices();
  
  // Group symbols by cache status
  const cachedSymbols: string[] = [];
  const expiredSymbols: string[] = [];
  const uncachedSymbols: string[] = [];
  
  symbols.forEach(symbol => {
    const upperSymbol = symbol.toUpperCase();
    
    if (priceCache[upperSymbol] && now - priceCache[upperSymbol].timestamp < CACHE_TTL_MS) {
      cachedSymbols.push(upperSymbol);
    } else if (priceCache[upperSymbol]) {
      expiredSymbols.push(upperSymbol);
    } else {
      uncachedSymbols.push(upperSymbol);
    }
  });
  
  // Get cached prices
  cachedSymbols.forEach(symbol => {
    result[symbol] = priceCache[symbol].price;
  });
  
  if (uncachedSymbols.length > 0 || expiredSymbols.length > 0) {
    try {
      // Get the CoinGecko IDs for the tokens
      const symbolsToFetch = [...uncachedSymbols, ...expiredSymbols];
      const idsToFetch: string[] = [];
      const symbolToIdMap: {[symbol: string]: string} = {};
      
      symbolsToFetch.forEach(symbol => {
        const coinId = COINGECKO_ID_MAP[symbol];
        if (coinId) {
          idsToFetch.push(coinId);
          symbolToIdMap[coinId] = symbol;
        } else {
          // Use fallback for tokens not in CoinGecko
          result[symbol] = FALLBACK_PRICES[symbol] || 0;
        }
      });
      
      if (idsToFetch.length > 0) {
        // Batch fetch prices from CoinGecko
        const url = `${COINGECKO_API_URL}/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process results
        idsToFetch.forEach(id => {
          if (data[id] && data[id].usd) {
            const symbol = symbolToIdMap[id];
            result[symbol] = data[id].usd;
            
            // Update cache
            priceCache[symbol] = {
              price: data[id].usd,
              timestamp: now
            };
          }
        });
        
        // Save updated cache
        savePriceCache(priceCache);
      }
    } catch (error) {
      console.error('Error batch fetching prices:', error);
      
      // Fall back to cached or default prices
      symbols.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        if (!result[upperSymbol]) {
          if (priceCache[upperSymbol]) {
            result[upperSymbol] = priceCache[upperSymbol].price;
          } else {
            result[upperSymbol] = FALLBACK_PRICES[upperSymbol] || 0;
          }
        }
      });
    }
  }
  
  return result;
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