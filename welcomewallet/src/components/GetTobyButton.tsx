import React, { useState, useEffect } from 'react';
import { getAppWallet, canSendTokens, sendTobyTokens } from '../services/appWalletService';
import useWallet from '../hooks/useWallet';

/**
 * Button component that allows users to get Toby tokens from the app wallet
 * Rate-limited to once per hour per wallet address
 */
const GetTobyButton: React.FC = () => {
  const { walletAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canClaim, setCanClaim] = useState<boolean>(true);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Load last claim time from localStorage when component mounts
  useEffect(() => {
    if (walletAddress) {
      const lastClaimTimeStr = localStorage.getItem(`lastClaim_${walletAddress}`);
      if (lastClaimTimeStr) {
        const lastClaimTime = new Date(lastClaimTimeStr);
        const nextTime = new Date(lastClaimTime);
        nextTime.setHours(nextTime.getHours() + 1); // Add 1 hour to last claim time
        setNextClaimTime(nextTime);
      }
    }
  }, [walletAddress]);

  // Update time remaining countdown every second
  useEffect(() => {
    if (!nextClaimTime) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = nextClaimTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Timer expired, user can claim again
        setTimeRemaining('');
        setCanClaim(true);
        setNextClaimTime(null);
        return;
      }
      
      // User can't claim yet, show remaining time
      setCanClaim(false);
      
      // Format remaining time as MM:SS
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    // Initial update
    updateTimeRemaining();
    
    // Set up interval for countdown
    const interval = setInterval(updateTimeRemaining, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [nextClaimTime]);

  const handleGetToby = async () => {
    // Reset states
    setLoading(true);
    setSuccess(false);
    setError(null);
    setTxHash(null);

    try {
      // Check if user wallet address is available
      if (!walletAddress) {
        throw new Error('No wallet address available. Please connect your wallet first.');
      }

      // Check if enough time has passed since last claim
      const lastClaimTimeStr = localStorage.getItem(`lastClaim_${walletAddress}`);
      if (lastClaimTimeStr) {
        const lastClaimTime = new Date(lastClaimTimeStr);
        const now = new Date();
        const hoursSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastClaim < 1) {
          const nextClaimTime = new Date(lastClaimTime);
          nextClaimTime.setHours(nextClaimTime.getHours() + 1);
          setNextClaimTime(nextClaimTime);
          throw new Error('You can only claim Toby tokens once per hour.');
        }
      }

      // Check if app wallet is configured
      const appWallet = getAppWallet();
      if (!appWallet) {
        throw new Error('App wallet not configured. Please contact the administrator.');
      }

      // Check if app wallet has private key for sending tokens
      if (!canSendTokens()) {
        throw new Error('App wallet is not configured for sending tokens.');
      }

      // Send 10 Toby tokens to the user
      const hash = await sendTobyTokens(walletAddress, 10);
      setTxHash(hash);

      // Record claim time in localStorage
      localStorage.setItem(`lastClaim_${walletAddress}`, new Date().toISOString());
      
      // Set next claim time
      const nextTime = new Date();
      nextTime.setHours(nextTime.getHours() + 1);
      setNextClaimTime(nextTime);
      
      // Mark as successful
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 flex flex-col items-center">
      <button
        onClick={handleGetToby}
        disabled={loading || !walletAddress || !canClaim}
        className={`w-full px-2 py-1.5 text-sm rounded-lg font-medium ${
          !canClaim
            ? 'bg-gray-500 cursor-not-allowed'
            : loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : success
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors`}
      >
        {!canClaim 
          ? `Wait ${timeRemaining}`
          : loading 
            ? 'Loading...' 
            : success 
              ? '+10 Toby!' 
              : 'Get Toby'
        }
      </button>
      
      {error && (
        <p className="mt-1 text-red-500 text-xs">{error}</p>
      )}
      
      {txHash && (
        <p className="mt-1 text-green-500 text-xs">
          Tx: {txHash.substring(0, 6)}...{txHash.substring(txHash.length - 4)}
        </p>
      )}
      
      <p className="mt-1 text-xs text-gray-400">
        10 tokens per hour
      </p>
    </div>
  );
};

export default GetTobyButton;