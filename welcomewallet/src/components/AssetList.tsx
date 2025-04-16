import React, { useState, useCallback } from 'react';
import useAssets from '../hooks/useAssets';
import useWallet from '../hooks/useWallet';
import SendTokensModal from './SendTokensModal';

const AssetList: React.FC = () => {
  const { walletAddress } = useWallet();
  const { assets, loading, error, refreshAssets, lastRefreshed } = useAssets(walletAddress);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Handle pull-to-refresh
  const handleTouchStart = useCallback(() => {
    // This would be a good place to implement full pull-to-refresh in a real app
    // For now, we'll just pre-fetch on touch to make the app feel more responsive
    if (!loading) {
      refreshAssets();
    }
  }, [refreshAssets, loading]);

  // Open the send modal with a specific asset
  const openSendModal = (symbol: string) => {
    setSelectedAsset(symbol);
    setIsSendModalOpen(true);
  };
  
  return (
    <div className="w-full max-w-md mx-auto" onTouchStart={handleTouchStart}>
      {/* Mobile-optimized header with responsive layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold">Your Assets</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={refreshAssets}
            disabled={loading}
            className="flex items-center justify-center gap-1 text-sm py-2 px-4 rounded-lg bg-welcome-accent bg-opacity-20 hover:bg-opacity-30 transition-colors min-w-[44px] min-h-[44px]"
            title="Refresh balances"
            aria-label="Refresh balances"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} 
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
            <span className="sm:inline hidden">{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          <button 
            onClick={() => setIsSendModalOpen(true)}
            disabled={!walletAddress || assets.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-sm py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px]"
            title="Send tokens"
            aria-label="Send tokens"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
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
            <span className="sm:inline">Send</span>
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
            <div key={index} className="asset-item p-4 rounded-lg">
              {/* Mobile-optimized asset card with expanded tap area */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                {/* Token info */}
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <span className="text-2xl">{asset.icon}</span>
                  <div>
                    <span className="font-medium text-lg">{asset.symbol}</span>
                    {/* Show USD value if available */}
                    {asset.usdValue && (
                      <div className="text-xs text-gray-400">
                        ${asset.usdValue}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Balance and send button */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="font-mono">
                    <div>{parseFloat(asset.balance).toFixed(6)}</div>
                  </div>
                  <button
                    onClick={() => openSendModal(asset.symbol)}
                    className="text-gray-400 hover:text-blue-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center p-2"
                    title={`Send ${asset.symbol}`}
                    aria-label={`Send ${asset.symbol}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
        initialAsset={selectedAsset}
      />
    </div>
  );
};

export default AssetList;