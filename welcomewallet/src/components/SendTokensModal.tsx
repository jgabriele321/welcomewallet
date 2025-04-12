import React, { useState } from 'react';
import { ethers } from 'ethers';
import useWallet from '../hooks/useWallet';
import useAssets from '../hooks/useAssets';

interface SendTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Supported assets for sending
const SUPPORTED_ASSETS = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { symbol: 'TOBY', name: 'Toby Token', decimals: 18, address: import.meta.env.VITE_TOBY_TOKEN_ADDRESS },
];

// Gas speed options
const GAS_OPTIONS = [
  { name: 'Slow', multiplier: 0.8, timeEstimate: '5-10 minutes' },
  { name: 'Normal', multiplier: 1, timeEstimate: '1-3 minutes' },
  { name: 'Fast', multiplier: 1.5, timeEstimate: '< 1 minute' },
];

const SendTokensModal: React.FC<SendTokensModalProps> = ({ isOpen, onClose }) => {
  const { walletAddress } = useWallet();
  const { assets, refreshAssets } = useAssets();
  
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
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      // For this demo, we'll simulate a successful transaction
      // In a real implementation, you would integrate with Privy SDK to get signer
      // and use the baseChainService functions to send transactions
      
      // Example of how the implementation would look with Privy:
      /*
      import { usePrivy } from '@privy-io/react-auth';
      import { sendTransaction, sendTokens, getTokenAddressBySymbol } from '../services/baseChainService';
      
      // Get the user's wallet from Privy
      const { user } = usePrivy();
      const wallet = user.wallet;
      
      // Get the signer
      const signer = await wallet.getEthersProvider().getSigner();
      
      // Get gas multiplier based on selected speed
      const gasMultiplier = GAS_OPTIONS.find(option => option.name === gasSpeed)?.multiplier || 1.0;
      
      // Send the transaction
      let txHash;
      if (selectedAsset === 'ETH') {
        txHash = await sendTransaction(signer, recipient, amount, gasMultiplier);
      } else {
        const tokenAddress = getTokenAddressBySymbol(selectedAsset);
        const decimals = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset)?.decimals || 18;
        txHash = await sendTokens(signer, tokenAddress, recipient, amount, decimals, gasMultiplier);
      }
      */
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulated transaction hash
      const mockTxHash = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      setTxHash(mockTxHash);
      
      // Refresh assets after successful transaction
      refreshAssets();
      
      // Clear form after successful transaction
      setTimeout(() => {
        setAmount('');
        setRecipient('');
        setTxHash(null);
        onClose();
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
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