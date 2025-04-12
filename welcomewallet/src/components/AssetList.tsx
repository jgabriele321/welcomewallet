import React, { useState } from 'react';
import useAssets from '../hooks/useAssets';
import useWallet from '../hooks/useWallet';
import SendTokensModal from './SendTokensModal';

const AssetList: React.FC = () => {
  const { walletAddress } = useWallet();
  const { assets, loading, error, refreshAssets, lastRefreshed } = useAssets(walletAddress);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Assets</h2>
        <div className="flex gap-2">
          <button 
            onClick={refreshAssets}
            disabled={loading}
            className="flex items-center gap-1 text-sm py-1 px-3 rounded-lg bg-welcome-accent bg-opacity-20 hover:bg-opacity-30 transition-colors"
            title="Refresh balances"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button 
            onClick={() => setIsSendModalOpen(true)}
            disabled={!walletAddress || assets.length === 0}
            className="flex items-center gap-1 text-sm py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send tokens"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
            Send
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-20 text-red-200 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {lastRefreshed && (
        <div className="text-xs text-gray-400 mb-2">
          Last updated: {lastRefreshed}
        </div>
      )}

      {loading && assets.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="asset-item p-4 animate-pulse flex justify-between">
              <div className="h-5 bg-gray-600 rounded w-20"></div>
              <div className="h-5 bg-gray-600 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset, index) => (
            <div key={index} className="asset-item p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">{asset.icon}</span>
                <span className="font-medium">{asset.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono">
                  {parseFloat(asset.balance).toFixed(6)}
                </div>
                <button
                  onClick={() => setIsSendModalOpen(true)}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title={`Send ${asset.symbol}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {assets.length === 0 && !loading && (
            <div className="text-center p-6 text-gray-400">
              No assets found in this wallet
            </div>
          )}
        </div>
      )}
      
      {/* Send Tokens Modal */}
      <SendTokensModal 
        isOpen={isSendModalOpen} 
        onClose={() => setIsSendModalOpen(false)} 
      />
    </div>
  );
};

export default AssetList;