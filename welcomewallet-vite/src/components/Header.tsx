import React from 'react';
import WalletDisplay from './WalletDisplay';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 border-b border-white border-opacity-10">
      <div className="flex items-center">
        <img src="/logo.svg" alt="WelcomeWallet" className="h-8" />
      </div>
      
      <WalletDisplay />
    </header>
  );
};

export default Header;