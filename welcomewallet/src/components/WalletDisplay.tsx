import React from 'react';
import useWallet from '../hooks/useWallet';
import { usePrivy } from '@privy-io/react-auth';

const WalletDisplay: React.FC = () => {
  const { displayAddress, copyAddress, copied, loading } = useWallet();
  const { logout } = usePrivy();

  if (loading) {
    return (
      <div className="wallet-address animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className="wallet-address cursor-pointer" 
        onClick={copyAddress}
        title="Click to copy address"
      >
        <span>{displayAddress}</span>
        <span className="ml-1">
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
            </svg>
          )}
        </span>
      </div>
      
      <button 
        className="p-2 rounded-full hover:bg-black hover:bg-opacity-20"
        onClick={logout}
        title="Logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default WalletDisplay;