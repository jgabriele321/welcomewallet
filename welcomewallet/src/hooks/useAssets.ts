/**
 * Custom hook for asset balance management
 */
import { useState, useEffect, useCallback } from 'react';
import { getAllTokenBalances, Asset } from '../services/baseChainService';

/**
 * Interface for asset state and operations
 */
interface AssetState {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  refreshAssets: () => Promise<void>;
  lastRefreshed: string;
}

// Cache storage for initial data loading to prevent screen flicker
const initialDataCache: { [address: string]: Asset[] } = {};

/**
 * Hook for managing crypto asset balances
 * @param walletAddress - User's wallet address
 * @returns Assets state and operations
 */
const useAssets = (walletAddress: string): AssetState => {
  // Initialize with cached data if available to prevent loading state flickering
  const [assets, setAssets] = useState<Asset[]>(initialDataCache[walletAddress] || []);
  const [loading, setLoading] = useState<boolean>(initialDataCache[walletAddress] ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Function to fetch all token balances
  const fetchAssets = useCallback(async (forceRefresh: boolean = true) => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    // Only show loading indicator for forced refreshes or first load
    if (forceRefresh || assets.length === 0) {
      setLoading(true);
    }
    
    setError(null);

    try {
      // Pass forceRefresh flag to the balance service
      const balances = await getAllTokenBalances(walletAddress, forceRefresh);
      
      // Store in both state and cache
      setAssets(balances);
      initialDataCache[walletAddress] = balances;
      
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load asset balances. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, assets.length]);

  // Load assets on mount and when wallet address changes
  // Uses the service-level cache for frequent address changes
  useEffect(() => {
    // Don't force refresh on first load or address change to use cache
    fetchAssets(false);
    
    // Set up auto-refresh interval (background refresh every 30 seconds)
    const refreshInterval = setInterval(() => {
      // Background refresh doesn't force refresh and won't show loading state
      fetchAssets(false);
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchAssets, walletAddress]);

  // Force a refresh when explicitly requested by the user
  const refreshAssetsForced = useCallback(async () => {
    await fetchAssets(true);
  }, [fetchAssets]);

  // Format relative time since last refresh
  const getRefreshTime = useCallback((): string => {
    if (!lastRefreshed) return '';
    
    const seconds = Math.floor((new Date().getTime() - lastRefreshed.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  }, [lastRefreshed]);

  return {
    assets,
    loading,
    error,
    refreshAssets: refreshAssetsForced,
    lastRefreshed: getRefreshTime(),
  };
};

export default useAssets;