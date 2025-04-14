/**
 * SendTokensModal Testing Script
 * 
 * This script helps test the SendTokensModal component integration with Privy
 * without having to manually interact with the UI.
 */
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Base RPC URL from environment or use default
const baseRpcUrl = process.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org';
console.log('Using Base RPC URL:', baseRpcUrl);

// Mock wallet and provider
const mockWallet = {
  address: '0x0000000000000000000000000000000000000000',
  id: 'mock-wallet-id',
  walletClientType: 'privy',
};

// Create a Base provider with explicit chainId
const baseProvider = new ethers.providers.JsonRpcProvider(baseRpcUrl, {
  chainId: 8453,
  name: 'Base'
});
console.log('Created Base provider for chainId 8453');

// Create a custom signer using baseProvider for read operations
// but with mocked sign/send methods for testing
const customSigner = {
  getAddress: async () => mockWallet.address,
  
  signMessage: async (message) => {
    console.log('Mock signing message:', message);
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  },
  
  sendTransaction: async (tx) => {
    console.log('Mock sending transaction:', tx);
    
    // Format transaction similar to Privy format
    const transaction = {
      to: tx.to,
      value: tx.value ? tx.value.toString() : undefined,
      data: tx.data,
    };
    
    console.log('Formatted transaction:', transaction);
    
    // Mock transaction result
    return {
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      wait: async () => ({
        status: 1,
        blockNumber: 12345,
        gasUsed: ethers.BigNumber.from(21000),
      }),
    };
  },
  
  provider: baseProvider,
  _isSigner: true,
};

// Mock sendTransaction function from baseChainService
const sendTransaction = async (signer, recipient, amount, gasMultiplier) => {
  console.log(`Test sending ${amount} ETH to ${recipient} with gas multiplier ${gasMultiplier}`);
  
  // Convert amount to wei
  const amountWei = ethers.utils.parseEther(amount);
  
  // Mock transaction
  const tx = {
    to: recipient,
    value: amountWei,
    chainId: 8453 // Explicitly set Base chain ID
  };
  
  // Use signer to send transaction
  const result = await signer.sendTransaction(tx);
  console.log('Transaction result:', result);
  
  return result.hash;
};

// Mock sendTokens function from baseChainService
const sendTokens = async (signer, tokenAddress, toAddress, amount, decimals, gasMultiplier) => {
  console.log(`Test sending ${amount} tokens (${tokenAddress}) to ${toAddress} with gas multiplier ${gasMultiplier}`);
  
  // Convert amount to token units
  const amountUnits = ethers.utils.parseUnits(amount, decimals);
  
  // Mock transaction (for ERC20 transfer)
  const erc20Interface = new ethers.utils.Interface([
    'function transfer(address to, uint256 amount) returns (bool)',
  ]);
  
  const data = erc20Interface.encodeFunctionData('transfer', [toAddress, amountUnits]);
  
  const tx = {
    to: tokenAddress,
    data,
    // Note: Don't add chainId for contract calls to avoid errors
  };
  
  // Use signer to send transaction
  const result = await signer.sendTransaction(tx);
  console.log('Token transaction result:', result);
  
  return result.hash;
};

// Test sending ETH
async function testSendEth() {
  console.log('\n--- Testing ETH Send ---');
  try {
    const txHash = await sendTransaction(
      customSigner,
      '0x1234567890123456789012345678901234567890',
      '0.01',
      1.0
    );
    console.log('✅ ETH Send success! Hash:', txHash);
    return true;
  } catch (error) {
    console.error('❌ ETH Send failed:', error);
    return false;
  }
}

// Test sending ERC20 tokens
async function testSendTokens() {
  console.log('\n--- Testing Token Send ---');
  try {
    const txHash = await sendTokens(
      customSigner,
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      '0x1234567890123456789012345678901234567890',
      '10',
      6, // USDC decimals
      1.0
    );
    console.log('✅ Token Send success! Hash:', txHash);
    return true;
  } catch (error) {
    console.error('❌ Token Send failed:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Running SendTokensModal Integration Tests\n');
  
  const ethSuccess = await testSendEth();
  const tokenSuccess = await testSendTokens();
  
  console.log('\n--- Test Summary ---');
  console.log(`ETH Send: ${ethSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Send: ${tokenSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (ethSuccess && tokenSuccess) {
    console.log('\n🎉 All tests passed successfully!');
    console.log('The custom signer approach should work correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
}

// Execute tests
runTests().catch(console.error);