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

### Resolved Privy Wallet Issues

We've overcome two major issues with the Privy integration:

1. **Transaction Creation Instead of Token Transfer**: 
   Originally, our send functionality was creating new contracts rather than sending tokens as intended.

2. **Vercel Deployment TypeScript Errors**:
   Various TypeScript errors were encountered when deploying to Vercel, related to chain configuration.

### Correct Solution: Using Privy's useSendTransaction Hook

The solution we implemented uses Privy's official hooks and chain configuration:

```typescript
// 1. Import chain definition from viem/chains
import { base } from 'viem/chains';

// 2. Configure PrivyProvider with proper chain setup
<PrivyProvider
  appId={import.meta.env.VITE_PRIVY_APP_ID}
  config={{
    loginMethods: ['email', 'wallet'],
    appearance: {
      theme: 'dark',
      accentColor: '#8A2BE2',
      logo: '/logo.svg'
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets'
    },
    defaultChain: base,
    supportedChains: [base]
  }}
>

// 3. In your component, use the useSendTransaction hook
import { useSendTransaction } from '@privy-io/react-auth';

const { sendTransaction } = useSendTransaction();

// 4. Send ETH transaction with explicit gas settings
const result = await sendTransaction({
  to: recipient,
  value: amountWei.toString(),
  gasLimit: `0x${adjustedGasLimit.toString(16)}`
});

// 5. For token transfers, create the data field manually
const erc20Interface = new ethers.utils.Interface([
  'function transfer(address to, uint256 amount) returns (bool)'
]);

const data = erc20Interface.encodeFunctionData('transfer', [
  recipient, 
  amountUnits
]);

const result = await sendTransaction({
  to: tokenAddress,
  data,
  gasLimit: `0x${adjustedGasLimit.toString(16)}`
});
```

### Key Learnings for Privy Integration

1. **Proper Chain Configuration**:
   - Always import chains from `viem/chains`
   - Configure `defaultChain` and `supportedChains` in PrivyProvider
   - This ensures all wallet operations use the right chain

2. **Transaction Handling**:
   - Use the `useSendTransaction` hook directly  
   - Don't try to manually construct signers or providers
   - For token transfers, construct the data field manually with ethers.js

3. **Gas Configuration**:
   - Set explicit `gasLimit` in hexadecimal format
   - Use appropriate base limits (21,000 for ETH, ~100,000 for tokens)
   - Adjust gas limit based on transaction priority

4. **Vercel Deployment Considerations**:
   - Be strict about TypeScript types
   - Don't use string chainIds with sendTransaction
   - Don't use properties not defined in TypeScript definitions
   - All environment variables must be added in Vercel settings

5. **Debugging Approach**:
   - Add detailed console logs throughout the transaction process
   - Check chain configuration and wallet connection state
   - Verify transaction parameters before sending

## Development Workflow
1. Run the development server: `cd welcomewallet && npm run dev`
2. Access the app at http://localhost:5173
3. Test authentication, asset display, and sending tokens functionality
4. Check console for detailed debug logs when testing functionality

## Todo List
- ✅ Fix Send Button functionality
- ✅ Deploy on Vercel for mobile testing
- Optimize for Mobile
- Add a swap page
- Add one-time gas button with limits that can be reset
- Integrate with Privy's global onboarding partner to create a "buy crypto" button
- Add social media functionality for requesting ETH
- Create a mystery button that unlocks and changes with an AI agent

## Tips for New Developers
- Use the `directions.md` and `scratchpad.md` files for implementation guidance
- Check the ToDo.txt file for current priorities
- The project uses TypeScript strictly, ensure all code is properly typed
- Debug logs are extensively used throughout the codebase for troubleshooting
- Current focus is on fixing the Send Tokens functionality