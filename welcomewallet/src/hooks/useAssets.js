/**
 * Custom hook for asset balance management
 */
import { useState, useEffect, useCallback } from 'react';
import { getAllTokenBalances } from '../services/baseChainService';

/**
 * Hook for managing crypto asset balances
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} Assets state and operations
 */
const useAssets = (walletAddress) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Function to fetch all token balances
  const fetchAssets = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balances = await getAllTokenBalances(walletAddress);
      setAssets(balances);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load asset balances. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Load assets on mount and when wallet address changes
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Format relative time since last refresh
  const getRefreshTime = useCallback(() => {
    if (!lastRefreshed) return '';
    
    const seconds = Math.floor((new Date() - lastRefreshed) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  }, [lastRefreshed]);

  return {
    assets,
    loading,
    error,
    refreshAssets: fetchAssets,
    lastRefreshed: getRefreshTime(),
  };
};

export default useAssets;