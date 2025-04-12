# WelcomeWallet

WelcomeWallet is an all-in-one crypto hub that provides users with a simple way to manage their crypto assets and interact with an AI assistant.

## Features

- **Authentication**: Connect existing wallet or create a new one via Privy (email-based)
- **Wallet Display**: Show wallet address with copy feature
- **Asset Management**: View balances for ETH, USDC, and TOBY tokens on Base chain
- **AI Assistant**: Chat with Grok AI to get answers about cryptocurrency topics

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Build Tool**: Vite
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
cd welcomewallet/welcomewallet-vite
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# Privy Configuration
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_PRIVY_VERIFICATION_KEY=your_privy_verification_key

# Base Chain Configuration
VITE_BASE_RPC_URL=https://mainnet.base.org

# Grok API
VITE_GROK_API_KEY=your_grok_api_key
VITE_GROK_API_ENDPOINT=your_grok_api_endpoint
```

4. Start the development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Troubleshooting

If you encounter issues with the PostCSS or TailwindCSS configuration:

1. Make sure to use TailwindCSS version 3.3.3 for compatibility:
   ```bash
   npm uninstall tailwindcss
   npm install tailwindcss@3.3.3
   ```

2. Use CommonJS syntax for the configuration files:
   - Ensure `postcss.config.cjs` and `tailwind.config.cjs` are using the `.cjs` extension (not `.js`) since the project uses ES modules.
   - Make sure both files use `module.exports = {...}` syntax.

3. For Grok API integration:
   - Use the X.AI endpoint: `https://api.x.ai/v1/chat/completions`
   - Use the model name: `grok-3-latest`
   - Include `stream: false` in the request body

4. If you encounter TypeScript errors related to environment variables, verify that the `vite-env.d.ts` file includes proper type definitions for all environment variables.

## Project Structure

```
welcomewallet/
├── public/
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── WalletDisplay.tsx
│   │   ├── AssetList.tsx
│   │   ├── ChatBox.tsx
│   │   └── Header.tsx
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   └── useAssets.ts
│   ├── services/
│   │   ├── privyService.ts
│   │   ├── baseChainService.ts
│   │   └── grokService.ts
│   ├── App.tsx
│   └── main.tsx
├── .env
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Building for Production

To build the app for production, run:

```bash
npm run build
```

This will create a `dist` directory with optimized production files.

## Deployment

The app can be deployed to platforms like Netlify, Vercel, or any static hosting service.

Remember to set up the environment variables on your hosting platform.