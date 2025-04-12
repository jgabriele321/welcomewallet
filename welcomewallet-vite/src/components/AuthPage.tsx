import React from 'react';
import { usePrivy } from '@privy-io/react-auth';

const AuthPage: React.FC = () => {
  const { login, ready } = usePrivy();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-3xl font-bold mb-8 text-center">
        <img src="/logo.svg" alt="WelcomeWallet" className="h-12 mx-auto mb-4" />
        <div className="text-2xl">Your all-in-one crypto hub</div>
      </div>
      
      <div className="max-w-md w-full bg-black bg-opacity-20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-center">Get Started</h2>
        
        <p className="mb-6 text-center text-gray-300">
          Connect an existing wallet or create a new one with your email.
        </p>
        
        <button
          onClick={login}
          disabled={!ready}
          className="w-full py-3 px-4 bg-welcome-accent hover:bg-opacity-80 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-welcome-accent focus:ring-offset-welcome-bg disabled:opacity-50"
        >
          {!ready ? 'Loading...' : 'Connect Wallet'}
        </button>
        
        <div className="mt-4 text-center text-sm text-gray-400">
          Powered by Privy for secure authentication
        </div>
      </div>
    </div>
  );
};

export default AuthPage;