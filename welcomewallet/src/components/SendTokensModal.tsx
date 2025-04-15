import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import { useSendTransaction } from '@privy-io/react-auth';
import useWallet from '../hooks/useWallet';
import useAssets from '../hooks/useAssets';
import { getTokenAddressBySymbol } from '../services/baseChainService';

interface SendTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Supported assets for sending (all on Base chain)
// Note: For Privy embedded wallets, chainIds must be in CAIP-2 format ('eip155:8453')
// when sending transactions, but we use numeric format (8453) here for asset definitions
const SUPPORTED_ASSETS = [
  { symbol: 'ETH', name: 'Ethereum on Base', decimals: 18, chainId: 8453 },
  { 
    symbol: 'USDC', 
    name: 'USD Coin on Base', 
    decimals: 6, 
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base chain USDC
    chainId: 8453 
  },
  { 
    symbol: 'TOBY', 
    name: 'Toby Token on Base', 
    decimals: 18, 
    address: import.meta.env.VITE_TOBY_TOKEN_ADDRESS,
    chainId: 8453 
  },
];

// Gas speed options
// Note: These multipliers affect the gasLimit which directly impacts transaction priority
// Values based on Base chain typical confirmation times
const GAS_OPTIONS = [
  { 
    name: 'Slow', 
    multiplier: 0.8, 
    timeEstimate: '10-20 minutes',
    gasLimitMultiplier: 1.0  // Standard gas limit
  },
  { 
    name: 'Normal', 
    multiplier: 1, 
    timeEstimate: '3-10 minutes',
    gasLimitMultiplier: 1.1  // 10% higher gas limit
  },
  { 
    name: 'Fast', 
    multiplier: 1.5, 
    timeEstimate: '1-3 minutes',
    gasLimitMultiplier: 1.3  // 30% higher gas limit
  },
];

const SendTokensModal: React.FC<SendTokensModalProps> = ({ isOpen, onClose }) => {
  const { walletAddress } = useWallet();
  const { assets, refreshAssets } = useAssets(walletAddress || '');
  const privy = usePrivy();
  const { sendTransaction } = useSendTransaction();
  
  // Form state
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string>(SUPPORTED_ASSETS[0].symbol);
  const [gasSpeed, setGasSpeed] = useState<string>('Normal');
  
  // When the modal opens, refresh asset balances
  useEffect(() => {
    if (isOpen && walletAddress) {
      refreshAssets();
      console.log('Available assets in SendTokensModal:', assets);
    }
  }, [isOpen, walletAddress, refreshAssets]);
  
  // Transaction state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    setError(null);
    
    // Debug available assets
    console.log('All assets in validateForm:', assets);
    console.log('Selected asset:', selectedAsset);
    console.log('Supported assets:', SUPPORTED_ASSETS);
    
    // Check recipient
    if (!recipient) {
      setError('Recipient address is required');
      return false;
    }
    
    if (!ethers.utils.isAddress(recipient)) {
      setError('Invalid recipient address');
      return false;
    }
    
    // Check amount
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    
    const selectedAssetInfo = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset);
    if (!selectedAssetInfo) {
      setError('Invalid asset selected');
      return false;
    }
    
    // Debug each asset in the assets array to find the match
    assets.forEach((asset, index) => {
      console.log(`Asset ${index}:`, {
        symbol: asset.symbol,
        balance: asset.balance,
        upperSymbol: asset.symbol.toUpperCase(),
        selectedUpperSymbol: selectedAsset.toUpperCase(),
        isMatch: asset.symbol.toUpperCase() === selectedAsset.toUpperCase()
      });
    });
    
    // Check balance
    // The assets array might have different case for symbols compared to SUPPORTED_ASSETS
    const matchingAsset = assets.find(a => a.symbol.toUpperCase() === selectedAsset.toUpperCase());
    const assetBalance = matchingAsset?.balance || '0';
    
    console.log('Matching asset:', matchingAsset);
    console.log('Asset balance for selected asset:', assetBalance);
    
    if (parseFloat(amount) > parseFloat(assetBalance)) {
      setError(`Insufficient ${selectedAsset} balance (have: ${assetBalance})`);
      return false;
    }
    
    return true;
  };
  
  // Handle sending tokens
  const handleSend = async () => {
    console.log('▶️ handleSend started');
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validated successfully');
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      // Check if Privy is authenticated
      console.log('🔍 Checking Privy authentication status:', { 
        user: privy.user ? 'exists' : 'null', 
        authenticated: privy.authenticated,
        ready: privy.ready
      });
      
      if (!privy.user || !privy.authenticated) {
        console.log('❌ Privy not authenticated');
        throw new Error('Wallet not available. Please connect your wallet.');
      }
      
      console.log('✅ Privy is authenticated');
      
      // Get gas settings based on selected speed
      const selectedGasOption = GAS_OPTIONS.find(option => option.name === gasSpeed) || GAS_OPTIONS[1]; // Default to Normal
      const gasLimitMultiplier = selectedGasOption.gasLimitMultiplier;
      console.log('⚙️ Using gas settings:', {
        option: selectedGasOption.name,
        timeEstimate: selectedGasOption.timeEstimate,
        gasLimitMultiplier
      });
      
      // Calculate gas limit
      // Base values based on Base chain's typical gas usage
      // ETH transfers typically use ~21,000 gas, token transfers ~65,000 gas
      const baseGasLimit = selectedAsset === 'ETH' ? 21000 : 100000;
      const adjustedGasLimit = Math.floor(baseGasLimit * gasLimitMultiplier);
      console.log('⚙️ Gas limit calculation:', {
        baseGasLimit,
        adjustedGasLimit,
        multiplier: gasLimitMultiplier
      });
      
      // Prepare transaction based on asset type
      if (selectedAsset === 'ETH') {
        // Sending ETH
        console.log(`📤 Preparing to send ${amount} ETH to ${recipient}`);
        
        // Convert amount to wei
        const amountWei = ethers.utils.parseEther(amount);
        console.log('📤 Amount in wei:', amountWei.toString());
        
        try {
          // Use the proper useSendTransaction hook method with gas settings
          console.log('📤 Sending ETH with useSendTransaction()...');
          const result = await sendTransaction({
            to: recipient,
            value: amountWei.toString(),
            gasLimit: `0x${adjustedGasLimit.toString(16)}`, // Convert to hex string
            chainId: 'eip155:8453' // Explicitly specify Base chain
          });
          
          const txHash = result.hash;
          console.log('✅ ETH transaction successful, hash:', txHash);
          setTxHash(txHash);
        } catch (error) {
          console.error('❌ ETH transaction failed:', error);
          throw error;
        }
      } else {
        // Sending a token
        console.log(`📤 Preparing to send ${selectedAsset} token`);
        const tokenAddress = getTokenAddressBySymbol(selectedAsset);
        console.log(`📤 Token address for ${selectedAsset}:`, tokenAddress);
        
        if (!tokenAddress) {
          console.error(`❌ Could not find token address for ${selectedAsset}`);
          throw new Error(`Could not find token address for ${selectedAsset}`);
        }
        
        const decimals = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset)?.decimals || 18;
        console.log(`📤 Sending ${amount} ${selectedAsset} (decimals: ${decimals}) to ${recipient}`);
        
        try {
          // Convert amount to token units
          const amountUnits = ethers.utils.parseUnits(amount, decimals);
          console.log('📤 Amount in token units:', amountUnits.toString());
          
          // Create token interface
          const erc20Interface = new ethers.utils.Interface([
            'function transfer(address to, uint256 amount) returns (bool)'
          ]);
          
          // Encode transfer function data
          const data = erc20Interface.encodeFunctionData('transfer', [
            recipient, 
            amountUnits
          ]);
          
          // Use the proper useSendTransaction hook method with gas settings
          console.log('📤 Sending token transaction with useSendTransaction()...');
          const result = await sendTransaction({
            to: tokenAddress,
            data,
            gasLimit: `0x${adjustedGasLimit.toString(16)}`, // Convert to hex string
            chainId: 'eip155:8453' // Explicitly specify Base chain
          });
          
          const txHash = result.hash;
          console.log('✅ Token transaction successful, hash:', txHash);
          setTxHash(txHash);
        } catch (error) {
          console.error('❌ Token transaction failed:', error);
          throw error;
        }
      }
      
      // Refresh assets after successful transaction
      refreshAssets();
      
      // Clear form after successful transaction
      setTimeout(() => {
        setAmount('');
        setRecipient('');
        setTxHash(null);
        onClose();
      }, 5000);
    } catch (err) {
      console.error('Transaction failed:', err);
      
      // Handle various error types
      if (err instanceof Error) {
        // Customize error message based on error content
        if (err.message.includes('user rejected transaction')) {
          setError('Transaction was rejected by the user.');
        } else if (err.message.includes('insufficient funds')) {
          setError('Insufficient funds to complete this transaction.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Transaction failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Send Tokens</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* From address (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              From
            </label>
            <div className="bg-gray-700 rounded p-2 text-gray-300">
              {formatAddress(walletAddress)}
            </div>
          </div>
          
          {/* To address */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              To
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gray-700 rounded p-2 text-white"
            />
          </div>
          
          {/* Asset selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Asset
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-gray-700 rounded p-2 text-white"
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Amount
            </label>
            <div className="flex">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-700 rounded-l p-2 text-white"
              />
              <div className="bg-gray-600 rounded-r px-3 flex items-center">
                {selectedAsset}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Balance: {assets.find(a => a.symbol.toUpperCase() === selectedAsset.toUpperCase())?.balance || '0'} {selectedAsset}
            </div>
          </div>
          
          {/* Gas settings */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Transaction Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GAS_OPTIONS.map((option) => (
                <button
                  key={option.name}
                  onClick={() => setGasSpeed(option.name)}
                  className={`p-2 rounded text-center text-sm ${
                    gasSpeed === option.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <div>{option.name}</div>
                  <div className="text-xs opacity-80">{option.timeEstimate}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {option.name === 'Slow' ? 'Cheapest' : 
                     option.name === 'Fast' ? 'Highest Priority' : 
                     'Standard Fee'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          {/* Transaction hash */}
          {txHash && (
            <div className="bg-green-800 bg-opacity-30 rounded p-2">
              <div className="text-green-400 text-sm">Transaction sent!</div>
              <div className="text-gray-400 text-xs overflow-hidden text-ellipsis">
                {txHash}
              </div>
            </div>
          )}
          
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading}
            className={`w-full p-3 rounded-lg font-medium ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {isLoading ? 'Sending...' : 'Send Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendTokensModal;