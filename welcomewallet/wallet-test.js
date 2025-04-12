/**
 * Wallet Test Script
 * Tests the app wallet functionality by performing a self-transfer
 */
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory's .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testWallet() {
  console.log('Testing wallet functionality...');
  
  // Get wallet details from environment
  const privateKey = process.env.REACT_APP_WALLET_PRIVATE_KEY;
  const address = process.env.REACT_APP_WALLET_ADDRESS;
  const rpcUrl = process.env.REACT_APP_BASE_RPC_URL;
  
  if (!privateKey || !address) {
    console.error('Wallet not properly configured. Please check your .env file.');
    console.error('Required variables: REACT_APP_WALLET_ADDRESS, REACT_APP_WALLET_PRIVATE_KEY');
    return;
  }
  
  console.log(`Using wallet address: ${address}`);
  console.log(`Using RPC URL: ${rpcUrl}`);
  
  try {
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Verify wallet address
    const walletAddress = await wallet.getAddress();
    console.log(`Wallet address verified: ${walletAddress}`);
    
    if (walletAddress.toLowerCase() !== address.toLowerCase()) {
      console.error('WARNING: Wallet address does not match private key!');
      console.error(`Expected: ${address}`);
      console.error(`Actual: ${walletAddress}`);
      return;
    }
    
    // Check balance
    const balance = await wallet.getBalance();
    console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.0002'))) {
      console.error(`Wallet has insufficient balance to run test: ${ethers.utils.formatEther(balance)} ETH`);
      console.error('Please add at least 0.0002 ETH to the wallet for testing.');
      return;
    }
    
    // Send a small amount to self
    console.log('Sending 0.0001 ETH to self...');
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.utils.parseEther('0.0001'),
      gasLimit: 21000 // Standard gas limit for simple ETH transfers
    });
    
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    console.log('Waiting for transaction confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block #${receipt.blockNumber}!`);
    
    // Check balance again
    const newBalance = await wallet.getBalance();
    console.log(`New wallet balance: ${ethers.utils.formatEther(newBalance)} ETH`);
    console.log(`Gas used for transaction: ${receipt.gasUsed.toString()}`);
    
    console.log('\n✅ Wallet test successful! The wallet is properly configured and can send transactions.');
    console.log('The Get Toby button is ready to use.');
    
  } catch (error) {
    console.error('❌ Error testing wallet:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('The wallet does not have enough ETH to pay for gas fees.');
    } else if (error.code === 'INVALID_ARGUMENT') {
      console.error('Please check that your private key is correct and properly formatted.');
    }
  }
}

// Run the test
testWallet();