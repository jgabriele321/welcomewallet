import React, { useState, useEffect } from 'react';
import { 
  getAppWallet, 
  canSendTokens, 
  sendGas, 
  hasReceivedGas,
  isGasLimitReached,
  getTotalGasDistributed,
  resetGasDistribution
} from '../services/appWalletService';
import useWallet from '../hooks/useWallet';

/**
 * Button component that allows users to get gas (ETH) from the app wallet
 * Limited to one-time per wallet with a global limit
 */
const GetGasButton: React.FC = () => {
  const { walletAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReceived, setHasReceived] = useState(false);
  const [globalLimitReached, setGlobalLimitReached] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [adminMode, setAdminMode] = useState(false);

  // Check if user has received gas and global limit status
  useEffect(() => {
    if (walletAddress) {
      setHasReceived(hasReceivedGas(walletAddress));
    }
    setGlobalLimitReached(isGasLimitReached());
    setTotalDistributed(getTotalGasDistributed());
  }, [walletAddress, success]);

  // Toggle admin mode with 5 rapid clicks
  const [lastClickTime, setLastClickTime] = useState(0);
  
  const handleAdminClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      // Using a functional update to avoid the unused variable warning
      // while still maintaining the click counting logic
      setAdminMode(prevMode => {
        const clickCountRef = parseInt(localStorage.getItem('gasAdminClickCount') || '0');
        const newCount = clickCountRef + 1;
        localStorage.setItem('gasAdminClickCount', newCount.toString());
        
        if (newCount >= 5) {
          localStorage.setItem('gasAdminClickCount', '0');
          return true;
        }
        return prevMode;
      });
    } else {
      localStorage.setItem('gasAdminClickCount', '1');
    }
    setLastClickTime(now);
  };

  const handleResetLimit = () => {
    resetGasDistribution();
    setGlobalLimitReached(false);
    setTotalDistributed(0);
    setHasReceived(false);
  };

  const handleGetGas = async () => {
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

      // Check if user has already received gas
      if (hasReceivedGas(walletAddress)) {
        throw new Error('You have already received gas.');
      }

      // Check if global limit is reached
      if (isGasLimitReached()) {
        throw new Error('Gas distribution limit has been reached.');
      }

      // Check if app wallet is configured
      const appWallet = getAppWallet();
      if (!appWallet) {
        throw new Error('App wallet not configured. Please contact the administrator.');
      }

      // Check if app wallet has private key for sending
      if (!canSendTokens()) {
        throw new Error('App wallet is not configured for sending gas.');
      }

      // Send gas to the user
      const hash = await sendGas(walletAddress);
      setTxHash(hash);

      // Mark as successful
      setSuccess(true);
      setHasReceived(true);
      setTotalDistributed(getTotalGasDistributed());
      setGlobalLimitReached(isGasLimitReached());
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Don't render the button if the user has already received gas or global limit is reached
  if ((hasReceived || globalLimitReached) && !adminMode) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col items-center">
        {/* Gas tank icon - simple Unicode placeholder for now */}
        <div 
          className="text-2xl mb-1 cursor-pointer" 
          onClick={handleAdminClick}
        >
          ⛽
        </div>
        
        <button
          onClick={handleGetGas}
          disabled={loading || !walletAddress || hasReceived || globalLimitReached}
          className={`px-4 py-2 rounded-lg font-medium ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : success
                ? 'bg-green-500 hover:bg-green-600'
                : hasReceived || globalLimitReached
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-800'
          } text-white transition-colors`}
        >
          {loading 
            ? 'Getting Gas...' 
            : success 
              ? 'Success! +0.0005 ETH' 
              : 'Get Gas'
          }
        </button>
      </div>
      
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
      
      {txHash && (
        <p className="mt-2 text-green-500 text-xs">
          Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
        </p>
      )}
      
      <p className="mt-2 text-sm text-gray-400">
        Get 0.0005 ETH for gas on Base
      </p>

      {/* Admin panel */}
      {adminMode && (
        <div className="mt-4 p-3 border border-gray-500 rounded">
          <h3 className="text-sm font-bold mb-2">Admin Controls</h3>
          <p className="text-xs text-gray-400 mb-2">
            Total distributed: {totalDistributed} ETH (Limit: 0.005 ETH)
          </p>
          <button
            onClick={handleResetLimit}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Reset Gas Limit
          </button>
        </div>
      )}
    </div>
  );
};

export default GetGasButton;