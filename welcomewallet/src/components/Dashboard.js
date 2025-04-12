import React from 'react';
import Header from './Header';
import AssetList from './AssetList';
import ChatBox from './ChatBox';

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 pb-64">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Your Crypto Hub</h1>
          
          <AssetList />
        </div>
      </main>
      
      <ChatBox />
    </div>
  );
};

export default Dashboard;