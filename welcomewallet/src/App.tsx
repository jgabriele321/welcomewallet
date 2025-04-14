import React, { useState, useEffect } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './index.css';

// AppContent component to handle authentication state
const AppContent: React.FC = () => {
  const { ready, authenticated } = usePrivy();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) {
      setLoading(false);
    }
  }, [ready]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-welcome-bg text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Show Dashboard for authenticated users, otherwise show AuthPage
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-welcome-bg text-white">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      {authenticated ? <Dashboard /> : <AuthPage />}
    </React.Suspense>
  );
}

// Main App component with Privy provider
const App: React.FC = () => {
  return (
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
          createOnLogin: 'users-without-wallets',
          chains: {
            defaultChain: 'eip155:8453', // Base chain ID in CAIP-2 format
            supportedChains: ['eip155:8453'], // Only support Base
          },
        },
      }}
    >
      <div className="App min-h-screen bg-welcome-bg text-white">
        <AppContent />
      </div>
    </PrivyProvider>
  );
}

export default App;