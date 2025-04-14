import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import useWallet from '../hooks/useWallet';
import useAssets from '../hooks/useAssets';
import { sendTransaction, sendTokens, getTokenAddressBySymbol } from '../services/baseChainService';

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
  const { assets, refreshAssets } = useAssets(walletAddress || '');
  const privy = usePrivy();
  
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
      // Check if Privy is authenticated
      if (!privy.user || !privy.authenticated) {
        throw new Error('Wallet not available. Please connect your wallet.');
      }
      
      // Get the embedded wallet from Privy
      if (!privy.user?.wallet?.address) {
        // Force authentication if needed
        await privy.login();
      }
      
      // The user must have a connected wallet
      if (!privy.user?.wallet && !privy.user?.linkedAccounts?.find(acct => acct.type === 'wallet')) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      console.log('Privy user:', privy.user);

      // Get the wallet - prefer embedded wallet but fall back to any connected wallet
      const wallet = privy.user.wallet || 
                     privy.user.linkedAccounts.find(acct => acct.type === 'wallet');
                     
      if (!wallet) {
        throw new Error('No wallet found. Please try connecting again.');
      }
      
      console.log('Selected wallet:', wallet);
      
      // Important: Instead of trying to get a provider from the wallet,
      // we'll use a custom approach that's more reliable with Privy
      console.log('Creating custom signer for wallet address:', wallet.address);
      console.log('Wallet type:', wallet.walletClientType);
      
      // 1. Get the wallet address directly from the wallet object
      const walletAddress = wallet.address;
      
      // 2. Create a provider using the Base chain RPC URL for read operations
      const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_BASE_RPC_URL);
      console.log('Created JsonRpcProvider with Base RPC URL:', import.meta.env.VITE_BASE_RPC_URL);
      
      // Check if we're using an embedded Privy wallet or external wallet
      const isEmbeddedWallet = wallet.walletClientType === 'privy';
      console.log('Using embedded Privy wallet:', isEmbeddedWallet);
      
      // 3. Create a custom signer that uses the provider for read operations
      // and the Privy wallet for signing
      const customSigner = {
        getAddress: async () => walletAddress,
        
        // For signing messages
        signMessage: async (message: string) => {
          console.log('Signing message with Privy wallet:', message);
          try {
            if (isEmbeddedWallet) {
              console.log('Using embedded wallet for signing');
              // For embedded wallets, use privy.user.wallet
              if (privy.user?.wallet) {
                return await privy.user.wallet.signMessage(message);
              } else {
                throw new Error('Embedded wallet not available');
              }
            } else {
              console.log('Using connected wallet for signing');
              // For connected wallets, use connectWallet
              const walletClient = await privy.connectWallet(wallet.id);
              if (!walletClient) {
                throw new Error('Could not connect to wallet');
              }
              
              // Create an ethers provider from the connected wallet
              const connectedProvider = new ethers.providers.Web3Provider(walletClient);
              const connectedSigner = connectedProvider.getSigner();
              
              // Sign message using the connected wallet
              return await connectedSigner.signMessage(message);
            }
          } catch (error) {
            console.error('Error signing message with Privy:', error);
            throw error;
          }
        },
        
        // For sending transactions
        sendTransaction: async (transaction: ethers.providers.TransactionRequest) => {
          console.log('Sending transaction with Privy wallet:', transaction);
          try {
            // Convert ethers transaction format to Privy transaction format
            const privyTx = {
              to: transaction.to as string,
              value: transaction.value ? ethers.utils.hexValue(transaction.value) : undefined,
              data: transaction.data,
              gasLimit: transaction.gasLimit ? ethers.utils.hexValue(transaction.gasLimit) : undefined,
              gasPrice: transaction.gasPrice ? ethers.utils.hexValue(transaction.gasPrice) : undefined,
            };
            
            console.log('Converted transaction format for Privy:', privyTx);
            
            let txHash;
            
            // Handle differently based on wallet type
            if (isEmbeddedWallet) {
              console.log('Using embedded wallet for transaction');
              // For embedded wallets, use privy.user.wallet
              if (privy.user?.wallet) {
                const tx = await privy.user.wallet.sendTransaction(privyTx);
                console.log('Embedded wallet transaction sent:', tx);
                txHash = tx.hash || tx.txHash;
              } else {
                throw new Error('Embedded wallet not available');
              }
            } else {
              console.log('Using connected wallet for transaction');
              // For connected wallets, use connectWallet
              const walletClient = await privy.connectWallet(wallet.id);
              if (!walletClient) {
                throw new Error('Could not connect to wallet');
              }
              
              // Create an ethers provider from the connected wallet
              const connectedProvider = new ethers.providers.Web3Provider(walletClient);
              const connectedSigner = connectedProvider.getSigner();
              
              // Send transaction using the connected wallet
              const tx = await connectedSigner.sendTransaction(transaction);
              console.log('Connected wallet transaction sent:', tx);
              txHash = tx.hash;
            }
            
            if (!txHash) {
              throw new Error('Transaction hash not returned');
            }
            
            console.log('Transaction sent successfully with hash:', txHash);
            
            return {
              hash: txHash,
              wait: async () => {
                // Wait for transaction confirmation
                const receipt = await provider.waitForTransaction(txHash);
                return receipt;
              }
            };
          } catch (error) {
            console.error('Error sending transaction with Privy:', error);
            throw error;
          }
        },
        
        // Connect the provider for read operations
        provider,
        
        // Ensure we have a _signTypedData method for EIP-712 signatures if needed
        _signTypedData: async (domain, types, value) => {
          console.log('Signing typed data with Privy wallet');
          try {
            if (isEmbeddedWallet) {
              console.log('Using embedded wallet for typed data signing');
              // For embedded wallets, use privy.user.wallet
              if (privy.user?.wallet) {
                return await privy.user.wallet.signTypedData(domain, types, value);
              } else {
                throw new Error('Embedded wallet not available');
              }
            } else {
              console.log('Using connected wallet for typed data signing');
              // For connected wallets, use connectWallet
              const walletClient = await privy.connectWallet(wallet.id);
              if (!walletClient) {
                throw new Error('Could not connect to wallet');
              }
              
              // Create an ethers provider from the connected wallet
              const connectedProvider = new ethers.providers.Web3Provider(walletClient);
              const connectedSigner = connectedProvider.getSigner();
              
              // Sign typed data using the connected wallet (if supported)
              if (typeof connectedSigner._signTypedData === 'function') {
                return await connectedSigner._signTypedData(domain, types, value);
              } else {
                throw new Error('Connected wallet does not support signTypedData');
              }
            }
          } catch (error) {
            console.error('Error signing typed data with Privy:', error);
            throw error;
          }
        },
      };
      
      console.log('Created custom signer for wallet:', wallet.id);
      
      // Use our custom signer instead of getting one from ethers.js
      const signer = customSigner;
  
      if (!signer) {
        throw new Error('Could not get signer from wallet.');
      }
      
      console.log('Getting ready to send transaction with:', {
        user: privy.user,
        wallet,
        ethersProvider,
        signer,
        selectedAsset,
        recipient,
        amount,
        gasSpeed
      });
      
      // Get gas multiplier based on selected speed
      const gasMultiplier = GAS_OPTIONS.find(option => option.name === gasSpeed)?.multiplier || 1.0;
      
      // Get the transaction hash
      let txHash;
      if (selectedAsset === 'ETH') {
        // Sending ETH
        console.log(`Sending ${amount} ETH to ${recipient} with gas multiplier ${gasMultiplier}`);
        txHash = await sendTransaction(signer, recipient, amount, gasMultiplier);
      } else {
        // Sending a token
        const tokenAddress = getTokenAddressBySymbol(selectedAsset);
        console.log(`Token address for ${selectedAsset}:`, tokenAddress);
        
        if (!tokenAddress) {
          throw new Error(`Could not find token address for ${selectedAsset}`);
        }
        
        const decimals = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset)?.decimals || 18;
        console.log(`Sending ${amount} ${selectedAsset} (decimals: ${decimals}) to ${recipient}`);
        
        txHash = await sendTokens(signer, tokenAddress, recipient, amount, decimals, gasMultiplier);
      }
      
      console.log('Transaction sent:', txHash);
      setTxHash(txHash);
      
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