import React from 'react';
import Header from './Header';
import AssetList from './AssetList';
import ChatBox from './ChatBox';
import GetTobyButton from './GetTobyButton';
import GetGasButton from './GetGasButton';

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 pb-20 overflow-x-hidden">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl font-bold mb-4 md:mb-6 text-center">Welcome to Your Crypto Hub</h1>
          
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Faucets</h2>
            <p className="text-gray-300 mb-3">
              Welcome! Get tokens and gas from our community faucets.
            </p>
            <div className="flex flex-row justify-center items-center gap-3">
              <div className="w-1/2">
                <GetTobyButton />
              </div>
              <div className="w-1/2">
                <GetGasButton />
              </div>
            </div>
          </div>
          
          <AssetList />
        </div>
      </main>
      
      <ChatBox />
    </div>
  );
};

export default Dashboard;