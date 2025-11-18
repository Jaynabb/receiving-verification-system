import React, { useState, useEffect } from 'react';
import ReceivingVerificationPage from './components/ReceivingVerificationPage';
import DeliveryHistoryPage from './components/DeliveryHistoryPage';
import type { InventoryItem } from './types';
import { getInventoryItems } from './services/firestoreClient';

type Page = 'receive-delivery' | 'delivery-history';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('receive-delivery');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await getInventoryItems();
      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryUpdated = () => {
    loadInventory();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-2">Receiving Verification System</h1>
          <p className="text-slate-400 text-sm mb-4">Verify deliveries quickly and catch discrepancies</p>
          <nav className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage('receive-delivery')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'receive-delivery'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📦 Receive Delivery
            </button>
            <button
              onClick={() => setCurrentPage('delivery-history')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 'delivery-history'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📋 Delivery History
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading && currentPage === 'receive-delivery' ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Loading...</div>
          </div>
        ) : (
          <>
            {currentPage === 'receive-delivery' && (
              <ReceivingVerificationPage inventory={inventory} />
            )}
            {currentPage === 'delivery-history' && (
              <DeliveryHistoryPage />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
