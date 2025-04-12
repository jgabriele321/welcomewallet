/**
 * Custom hook for wallet management
 */
import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { formatWalletAddress, copyToClipboard } from '../services/privyService';

/**
 * Hook for managing wallet state and operations
 * @returns {Object} Wallet state and operations
 */
const useWallet = () => {
  const { user, ready, authenticated } = usePrivy();
  const [walletAddress, setWalletAddress] = useState('');
  const [displayAddress, setDisplayAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get wallet address from Privy user
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (ready && authenticated && user) {
        try {
          // Get embedded wallet from Privy
          const embeddedWallets = user.linkedAccounts?.filter(
            account => account.type === 'wallet' && account.walletClientType === 'privy'
          );
          
          // Or get connected wallet if no embedded wallet
          const connectedWallets = user.linkedAccounts?.filter(
            account => account.type === 'wallet' && account.walletClientType !== 'privy'
          );
          
          // Prefer embedded wallet, fall back to connected wallet
          const wallet = embeddedWallets?.[0] || connectedWallets?.[0];
          
          if (wallet?.address) {
            setWalletAddress(wallet.address);
            setDisplayAddress(formatWalletAddress(wallet.address));
          } else {
            console.error('No wallet address found in user data');
          }
        } catch (error) {
          console.error('Error getting wallet address:', error);
        } finally {
          setLoading(false);
        }
      } else if (ready && !authenticated) {
        setLoading(false);
      }
    };

    fetchWalletAddress();
  }, [ready, authenticated, user]);

  // Handle copy wallet address
  const copyAddress = useCallback(async () => {
    if (walletAddress) {
      const success = await copyToClipboard(walletAddress);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      }
    }
  }, [walletAddress]);

  return {
    walletAddress,
    displayAddress,
    copyAddress,
    copied,
    loading,
  };
};

export default useWallet;