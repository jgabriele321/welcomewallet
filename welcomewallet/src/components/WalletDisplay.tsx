import React, { useState } from 'react';
import useWallet from '../hooks/useWallet';
import { usePrivy } from '@privy-io/react-auth';

const WalletDisplay: React.FC = () => {
  const { displayAddress, copyAddress, copied, loading } = useWallet();
  const { logout } = usePrivy();
  const [showAddressOnly, setShowAddressOnly] = useState(window.innerWidth < 640);

  // Toggle address display on small screens
  const toggleAddressDisplay = () => {
    if (window.innerWidth < 640) {
      setShowAddressOnly(!showAddressOnly);
    }
  };

  if (loading) {
    return (
      <div className="wallet-address animate-pulse min-h-[44px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // On mobile, show either just the address or just the buttons, toggling between them
  return (
    <div className="flex items-center gap-2">
      {/* Always show on larger screens, toggle on mobile */}
      {(!showAddressOnly || window.innerWidth >= 640) && (
        <div 
          className="wallet-address cursor-pointer min-h-[44px] flex items-center justify-center"
          onClick={() => {
            copyAddress();
            toggleAddressDisplay();
          }}
          title="Click to copy address"
          aria-label="Copy wallet address"
        >
          <span className="hidden sm:inline">{displayAddress}</span>
          <span className="inline sm:hidden">{displayAddress.substring(0, 6)}...{displayAddress.substring(displayAddress.length - 4)}</span>
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
      )}
      
      {/* Toggle button for mobile / Logout button for desktop */}
      {(showAddressOnly || window.innerWidth >= 640) && (
        <button 
          className="p-2 rounded-full hover:bg-black hover:bg-opacity-20 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => {
            if (window.innerWidth < 640 && showAddressOnly) {
              toggleAddressDisplay();
            } else {
              logout();
            }
          }}
          title={window.innerWidth < 640 && showAddressOnly ? "Show wallet address" : "Logout"}
          aria-label={window.innerWidth < 640 && showAddressOnly ? "Show wallet address" : "Logout"}
        >
          {window.innerWidth < 640 && showAddressOnly ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default WalletDisplay;