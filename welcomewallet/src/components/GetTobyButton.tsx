import React, { useState } from 'react';
import { getAppWallet, canSendTokens } from '../services/appWalletService';
import useWallet from '../hooks/useWallet';

/**
 * Button component that allows users to get Toby tokens from the app wallet
 */
const GetTobyButton: React.FC = () => {
  const { walletAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetToby = async () => {
    // Reset states
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // Check if user wallet address is available
      if (!walletAddress) {
        throw new Error('No wallet address available. Please connect your wallet first.');
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

      // For this demo, we're just simulating a successful token transfer
      // In a real implementation, this would call a contract method to transfer tokens
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mark as successful
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleGetToby}
        disabled={loading || !walletAddress}
        className={`px-4 py-2 rounded-lg font-medium ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : success
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors`}
      >
        {loading ? 'Getting Toby...' : success ? 'Success! +10 Toby' : 'Get 10 Toby'}
      </button>
      
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}
      
      <p className="mt-2 text-sm text-gray-400">
        Get 10 Toby tokens per hour from the Welcome Wallet faucet
      </p>
    </div>
  );
};

export default GetTobyButton;