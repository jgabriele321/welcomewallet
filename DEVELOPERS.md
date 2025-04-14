# WelcomeWallet - Developer Notes

## Project Overview
WelcomeWallet is a crypto hub that allows users to manage their crypto assets and interact with an AI assistant. The app has been built with Vite, React, and TypeScript, and uses Privy for authentication and wallet functionality.

## Current Status
The project is in active development. Currently, we are working on fixing the Send Tokens functionality on the "send-button" branch.

## Key Components
- **Authentication**: Using Privy for email-based authentication and wallet management
- **Asset Management**: Displaying and managing ETH, USDC, and TOBY token balances
- **Chat Interface**: Integration with Grok AI for crypto-related questions
- **Send Tokens**: Functionality to send ETH, USDC, and TOBY tokens to other addresses (currently being fixed)

## Known Issues
- Send Tokens Modal has integration issues with Privy wallet
- Need to fix token balance display in SendTokensModal
- Environment variable handling needs standardization

## Core Files
- `src/components/SendTokensModal.tsx`: Modal for sending tokens (currently being fixed)
- `src/services/baseChainService.ts`: Service for blockchain interactions
- `src/services/privyService.ts`: Service for Privy authentication
- `src/hooks/useWallet.ts`: Hook for wallet management
- `src/hooks/useAssets.ts`: Hook for asset balance fetching

## Environment Variables
```
# Privy Configuration
VITE_PRIVY_APP_ID=cm9ejipqw01mil50mll46ojae
VITE_PRIVY_APP_SECRET=3iQjUcY5SoiUgRCub9sVx2zukjjyksV6gvrtS3YxN8bLRxJh96632fpcp6SCsWEZ6ESFUQP69Xi8d98LXgKGxWFF

# Base Chain Configuration
VITE_BASE_RPC_URL=https://mainnet.base.org

# Token Addresses
VITE_TOBY_TOKEN_ADDRESS=0xb8d98a102b0079b69ffbc760c8d857a31653e56e

# Grok API
VITE_GROK_API_KEY=xai-qC9F3llia2ofvT7zrFX5jSe9MbZaCiadxp7R4RKErWc5ITmq4dBJbXodgvMjldVflRYF1bVxXf7A2Sra
VITE_GROK_API_ENDPOINT=https://api.x.ai/v1/chat/completions
```

## Privy Wallet Integration Fix

### Current Issue
The SendTokensModal is currently failing with `wallet.getProvider is not a function`, followed by a wallet connect popup even though the wallet is already connected. This occurs because we're incorrectly trying to access the Privy wallet provider.

### Solution 1: Use Base Chain RPC Provider with Correct Signing

This solution avoids the need to get a provider from the wallet directly, instead using the Base chain RPC provider and only using Privy for signing transactions.

```typescript
// 1. Get the wallet address from the user object
const walletAddress = wallet.address;

// 2. Create a provider using the Base chain RPC URL
const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_BASE_RPC_URL);

// 3. Create a custom signer that uses the provider for read operations
// and the Privy wallet for signing
const customSigner = {
  getAddress: async () => walletAddress,
  signMessage: async (message) => {
    // Use Privy's signMessage function
    return await privy.signMessage({
      message,
      walletId: wallet.id
    });
  },
  sendTransaction: async (transaction) => {
    // Use Privy's sendTransaction function
    const tx = await privy.sendTransaction({
      transaction,
      walletId: wallet.id
    });
    return {
      hash: tx.hash,
      wait: async () => provider.waitForTransaction(tx.hash)
    };
  },
  provider: provider
};

// 4. Use this custom signer for your transaction functions
const txHash = await sendTransaction(customSigner, recipient, amount, gasMultiplier);
```

### Solution 2: Use PrivyProvider with usePrivyWallets Hook

This solution utilizes Privy's dedicated wallet hooks for a more integrated experience:

```typescript
// 1. Add the usePrivyWallets hook to your component
const { wallet: embeddedWallet, ready: walletReady, connect } = usePrivyWallets();

// 2. Check if the wallet is ready before using it
useEffect(() => {
  const initWallet = async () => {
    if (walletReady && embeddedWallet) {
      // The wallet is ready to use
      console.log("Wallet is ready:", embeddedWallet);
    } else if (privy.authenticated && !embeddedWallet) {
      // Need to create or connect to a wallet
      await connect();
    }
  };
  
  initWallet();
}, [walletReady, embeddedWallet, privy.authenticated]);

// 3. When sending a transaction, use the embedded wallet's provider
const handleSend = async () => {
  if (!embeddedWallet) {
    throw new Error("No wallet available");
  }
  
  // Get the provider from the embedded wallet
  const provider = await embeddedWallet.getEthereumProvider();
  
  // Create an ethers provider with it
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  
  // Get signer and send transaction
  const signer = ethersProvider.getSigner();
  const txHash = await sendTransaction(signer, recipient, amount, gasMultiplier);
};
```

### Implementation Notes

1. **Solution 1 advantages**:
   - More reliable as it doesn't depend on browser wallet connections
   - Prevents duplicate wallet popups
   - Works with both embedded and connected wallets
   - Simpler implementation

2. **Solution 2 advantages**:
   - More integrated with Privy's wallet system
   - Better handling of wallet state and connections
   - More consistent with Privy's recommended approach

3. **Debugging tips**:
   - Add console logs for wallet type, state, and readiness
   - Log all steps of provider creation and transaction signing
   - Check the wallet address matches in all places
   - Verify that transactions are being signed correctly with the expected wallet

## Development Workflow
1. Run the development server: `cd welcomewallet && npm run dev`
2. Access the app at http://localhost:5173
3. Test authentication, asset display, and sending tokens functionality
4. Check console for detailed debug logs when testing functionality

## Todo List
- Fix Send Button functionality
- Figure out how to host outside of localhost to share with friends
- Add a swap page
- Find a way to host this indefinitely easily
- Integrate with Privy's global onboarding partner to create a "buy $5 worth of ETH" button
- Add social media functionality for requesting ETH
- Create a mystery button that unlocks and changes with an AI agent

## Tips for New Developers
- Use the `directions.md` and `scratchpad.md` files for implementation guidance
- Check the ToDo.txt file for current priorities
- The project uses TypeScript strictly, ensure all code is properly typed
- Debug logs are extensively used throughout the codebase for troubleshooting
- Current focus is on fixing the Send Tokens functionality