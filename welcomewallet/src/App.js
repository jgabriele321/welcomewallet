import React, { useState, useEffect } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import './App.css';

// Components (to be created)
const AuthPage = React.lazy(() => import('./components/AuthPage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));

function AppContent() {
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

function App() {
  return (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#8A2BE2',
          logo: '/logo.svg'
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: false,
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