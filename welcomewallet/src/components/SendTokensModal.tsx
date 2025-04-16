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
  initialAsset?: string | null; // Optional initial asset selection
}

// Supported assets for sending (all on Base chain)
// Note: For Privy embedded wallets, chainIds must be in CAIP-2 format ('eip155:8453')
// when sending transactions, but we use numeric format (8453) here for asset definitions
const SUPPORTED_ASSETS = [
  { symbol: 'ETH', name: 'Ethereum on Base', decimals: 18, chainId: 8453, displaySymbol: 'ETH' },
  { 
    symbol: 'BTC', 
    name: 'Bitcoin on Base (cbBTC)', 
    decimals: 8, 
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC on Base
    chainId: 8453,
    displaySymbol: 'cbBTC' // Use a clearer name in UI
  },
  { 
    symbol: 'SOL', 
    name: 'Solana on Base (uSOL)', 
    decimals: 9, 
    address: '0x9B8Df6E244526ab5F6e6400d331DB28C8fdDdb55', // uSOL on Base
    chainId: 8453,
    displaySymbol: 'uSOL' // Use a clearer name in UI
  },
  { 
    symbol: 'USDC', 
    name: 'USD Coin on Base', 
    decimals: 6, 
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base chain USDC
    chainId: 8453,
    displaySymbol: 'USDC'
  },
  { 
    symbol: 'TOBY', 
    name: 'Toby Token on Base', 
    decimals: 18, 
    address: import.meta.env.VITE_TOBY_TOKEN_ADDRESS,
    chainId: 8453,
    displaySymbol: 'TOBY'
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

const SendTokensModal: React.FC<SendTokensModalProps> = ({ isOpen, onClose, initialAsset }) => {
  const { walletAddress } = useWallet();
  const { assets, refreshAssets } = useAssets(walletAddress || '');
  const privy = usePrivy();
  const { sendTransaction } = useSendTransaction();
  
  // Form state
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string>(SUPPORTED_ASSETS[0].symbol);
  const [gasSpeed, setGasSpeed] = useState<string>('Normal');
  
  // Set the initial asset when the modal opens or when initialAsset changes
  useEffect(() => {
    if (initialAsset) {
      // Find the asset in SUPPORTED_ASSETS (case-insensitive)
      const matchingAsset = SUPPORTED_ASSETS.find(
        asset => asset.symbol.toUpperCase() === initialAsset.toUpperCase()
      );
      
      if (matchingAsset) {
        console.log(`Setting selected asset to ${matchingAsset.symbol} from initialAsset: ${initialAsset}`);
        setSelectedAsset(matchingAsset.symbol);
      }
    }
  }, [isOpen, initialAsset]);
  
  // Reset the form when the modal is opened
  useEffect(() => {
    if (isOpen) {
      // Don't reset selectedAsset here as it's handled by the initialAsset effect
      setRecipient('');
      setAmount('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);
  
  // When the modal opens, refresh asset balances
  useEffect(() => {
    if (isOpen && walletAddress) {
      refreshAssets();
      console.log('Available assets in SendTokensModal:', assets);
    }
  }, [isOpen, walletAddress, refreshAssets, assets]);
  
  // Transaction state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get display symbol for an asset
  const getDisplaySymbol = (symbol: string): string => {
    const asset = SUPPORTED_ASSETS.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
    return asset?.displaySymbol || symbol;
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
            gasLimit: `0x${adjustedGasLimit.toString(16)}` // Convert to hex string
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
            gasLimit: `0x${adjustedGasLimit.toString(16)}` // Convert to hex string
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pb-2">
          <h2 className="text-xl font-semibold">Send Tokens</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* From address (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              From
            </label>
            <div className="bg-gray-700 rounded p-3 text-gray-300 min-h-[44px] flex items-center">
              {formatAddress(walletAddress)}
            </div>
          </div>
          
          {/* To address */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="recipient-address">
              To
            </label>
            <input
              id="recipient-address"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gray-700 rounded p-3 text-white min-h-[44px]"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          
          {/* Asset selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="asset-select">
              Asset
            </label>
            <select
              id="asset-select"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-gray-700 rounded p-3 text-white min-h-[44px] appearance-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\") ", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.7rem top 50%", backgroundSize: "0.65rem auto" }}
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.displaySymbol || asset.symbol})
                </option>
              ))}
            </select>
          </div>
          
          {/* Amount with balance display and max button */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-400" htmlFor="amount-input">
                Amount
              </label>
              
              <div className="text-xs text-gray-400">
                Balance: {assets.find(a => a.symbol.toUpperCase() === selectedAsset.toUpperCase())?.balance || '0'} {getDisplaySymbol(selectedAsset)}
                <button 
                  onClick={() => {
                    const assetBalance = assets.find(a => a.symbol.toUpperCase() === selectedAsset.toUpperCase())?.balance || '0';
                    setAmount(assetBalance);
                  }}
                  className="ml-2 text-welcome-accent underline text-xs"
                  aria-label="Use maximum balance"
                >
                  Max
                </button>
              </div>
            </div>
            
            <div className="flex">
              <input
                id="amount-input"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-700 rounded-l p-3 text-white min-h-[44px]"
              />
              <div className="bg-gray-600 rounded-r px-4 flex items-center font-medium">
                {getDisplaySymbol(selectedAsset)}
              </div>
            </div>
            
            {/* USD value of amount (if available) */}
            {amount && parseFloat(amount) > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                ≈ ${(parseFloat(amount) * 
                    (assets.find(a => a.symbol.toUpperCase() === selectedAsset.toUpperCase())?.priceUsd || 0)).toFixed(2)} USD
              </div>
            )}
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
                  className={`p-3 rounded text-center text-sm min-h-[80px] ${
                    gasSpeed === option.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  aria-label={`${option.name} transaction speed: ${option.timeEstimate}`}
                >
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs opacity-80 mt-1">{option.timeEstimate}</div>
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
            <div className="text-red-500 text-sm p-3 bg-red-500 bg-opacity-10 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Transaction hash */}
          {txHash && (
            <div className="bg-green-800 bg-opacity-30 rounded-lg p-3">
              <div className="text-green-400 font-medium">Transaction sent!</div>
              <div className="text-gray-400 text-xs break-all mt-1">
                {txHash}
              </div>
            </div>
          )}
          
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading}
            className={`w-full p-4 rounded-lg font-medium ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors min-h-[56px] text-lg mt-2`}
            aria-label={isLoading ? 'Sending transaction' : 'Send transaction'}
          >
            {isLoading ? 'Sending...' : 'Send Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendTokensModal;