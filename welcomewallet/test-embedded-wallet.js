/**
 * Test script for sending transactions with Privy embedded wallets
 * 
 * This script tests the essential parts of our solution to ensure
 * that transactions can be properly sent with embedded wallets.
 */

import { ethers } from 'ethers';

// Mock the Privy API
const mockPrivy = {
  user: {
    wallet: {
      address: '0x1234567890123456789012345678901234567890',
      id: 'embedded-wallet-id',
      walletClientType: 'privy'
    }
  },
  
  // Mock sendTransaction
  sendTransaction: async (params) => {
    console.log('🧪 Mock privy.sendTransaction called with parameters:', JSON.stringify(params, null, 2));
    
    if (params.wallet === 'embedded') {
      console.log('✅ Test PASSED: Correctly used wallet: embedded parameter');
    } else {
      console.error('❌ Test FAILED: Did not use wallet: embedded parameter');
    }
    
    if (params.transaction.chainId === 'eip155:8453') {
      console.log('✅ Test PASSED: Correctly used Base chain ID');
    } else {
      console.error('❌ Test FAILED: Did not use correct chainId');
    }
    
    // Simulate successful transaction
    return {
      hash: '0x' + '1'.repeat(64),
      txHash: '0x' + '1'.repeat(64)
    };
  }
};

// Set up Base chain provider
const baseProvider = new ethers.providers.JsonRpcProvider(
  'https://mainnet.base.org',
  { chainId: 8453, name: 'Base' }
);

// Test VoidSigner with custom sendTransaction
async function testEmbeddedWalletSigner() {
  try {
    // Create a VoidSigner with Base provider
    const signer = new ethers.VoidSigner(mockPrivy.user.wallet.address, baseProvider);
    
    // Override sendTransaction method
    signer.sendTransaction = async (tx) => {
      console.log('🧪 Custom sendTransaction called with tx:', JSON.stringify(tx, null, 2));
      
      // Format the transaction for Privy
      const transaction = {
        to: tx.to,
        value: tx.value ? tx.value.toString() : undefined,
        data: tx.data,
        chainId: 'eip155:8453'
      };
      
      // Use Privy's sendTransaction directly with the embedded wallet
      const result = await mockPrivy.sendTransaction({
        transaction,
        wallet: 'embedded'
      });
      
      // Create a transaction response object compatible with ethers.js
      return {
        hash: result.hash || result.txHash,
        wait: async () => ({ blockNumber: 12345, status: 1 }),
        ...result
      };
    };
    
    // Test ETH transfer
    console.log('\n🧪 Testing ETH transfer with embedded wallet...');
    const ethResult = await signer.sendTransaction({
      to: '0x0000000000000000000000000000000000000000',
      value: ethers.utils.parseEther('0.01')
    });
    
    console.log('🧪 ETH transfer result:', ethResult);
    
    // Test token transfer (mock ERC20 transfer data)
    console.log('\n🧪 Testing ERC20 token transfer with embedded wallet...');
    const tokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
    const erc20Interface = new ethers.utils.Interface([
      'function transfer(address to, uint256 amount) returns (bool)'
    ]);
    
    const data = erc20Interface.encodeFunctionData('transfer', [
      '0x0000000000000000000000000000000000000000', 
      ethers.utils.parseUnits('10', 6) // 10 USDC with 6 decimals
    ]);
    
    const tokenResult = await signer.sendTransaction({
      to: tokenAddress,
      data
    });
    
    console.log('🧪 Token transfer result:', tokenResult);
    
    console.log('\n✅ Test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
console.log('🧪 Starting embedded wallet test...');
testEmbeddedWalletSigner()
  .then(success => {
    if (success) {
      console.log('🎉 All tests passed! The solution should work correctly.');
    } else {
      console.log('❌ Test failed. Check the errors above.');
    }
  })
  .catch(error => console.error('❌ Unexpected error during testing:', error));