# WelcomeWallet

WelcomeWallet is an all-in-one crypto hub that provides users with a simple way to manage their crypto assets and interact with an AI assistant.

## Features

- **Authentication**: Connect existing wallet or create a new one via Privy (email-based)
- **Wallet Display**: Show wallet address with copy feature
- **Asset Management**: View balances for ETH, USDC, and TOBY tokens on Base chain
- **AI Assistant**: Chat with Grok AI to get answers about cryptocurrency topics

## Tech Stack

- **Frontend**: React.js
- **Authentication**: Privy SDK
- **Blockchain Interaction**: ethers.js
- **AI Integration**: Grok API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/welcomewallet.git
cd welcomewallet
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# Privy Configuration
REACT_APP_PRIVY_APP_ID=your_privy_app_id
REACT_APP_PRIVY_VERIFICATION_KEY=your_privy_verification_key

# Base Chain Configuration
REACT_APP_BASE_RPC_URL=https://mainnet.base.org

# Grok API
REACT_APP_GROK_API_KEY=your_grok_api_key
REACT_APP_GROK_API_ENDPOINT=your_grok_api_endpoint
```

4. Start the development server
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
welcomewallet/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AuthPage.js
│   │   ├── Dashboard.js
│   │   ├── WalletDisplay.js
│   │   ├── AssetList.js
│   │   ├── ChatBox.js
│   │   └── Header.js
│   ├── hooks/
│   │   ├── useWallet.js
│   │   └── useAssets.js
│   ├── services/
│   │   ├── privyService.js
│   │   ├── baseChainService.js
│   │   └── grokService.js
│   ├── styles/
│   ├── App.js
│   └── index.js
└── package.json
```

## Building for Production

To build the app for production, run:

```bash
npm run build
```

This will create a `build` directory with optimized production files.

## Deployment

The app can be deployed to platforms like Netlify, Vercel, or any static hosting service.

Remember to set up the environment variables on your hosting platform.