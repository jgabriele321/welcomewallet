# Welcome Wallet

A friendly crypto wallet application built with React and Vite.

## Features

- Connect with Privy authentication
- View Base chain assets
- Chat with Grok AI
- Get Toby tokens from the community faucet
- Simple, clean UI with TailwindCSS

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment example file:
   ```
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`:
   - Add your Privy app credentials
   - Add your Grok API key
   - Add your app wallet address and private key (for the Toby faucet)

5. Start the development server:
   ```
   npm run dev
   ```

## Wallet Configuration

To set up the Toby token faucet functionality, you need to configure an app wallet:

1. Create a new Ethereum wallet or use an existing one on Base chain
2. Add the wallet address to `REACT_APP_WALLET_ADDRESS` in your `.env` file
3. Add the wallet private key to `REACT_APP_WALLET_PRIVATE_KEY` in your `.env` file
4. Ensure your wallet has some ETH for gas fees and Toby tokens to distribute

**IMPORTANT**: Never commit your private key to the repository. The `.env` file is ignored by git.

## Building for Production

```
npm run build
```

## License

This project is private and not licensed for public use.