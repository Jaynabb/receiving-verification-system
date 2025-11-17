import React, { useState } from 'react';
import type { InventoryItem } from '../types';
import { deleteInventoryItem, updateInventoryItem } from '../services/firestoreClient';

interface Props {
  inventory: InventoryItem[];
  onInventoryUpdated: () => void;
}

const InventoryListPage: React.FC<Props> = ({ inventory, onInventoryUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteInventoryItem(id);
      onInventoryUpdated();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleEditQuantity = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity);
  };

  const handleSaveQuantity = async (id: string) => {
    try {
      await updateInventoryItem(id, { quantity: editQuantity });
      setEditingId(null);
      onInventoryUpdated();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (inventory.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Inventory Items</h2>
          <p className="text-slate-400 mb-6">
            Start by scanning your inventory list to add items automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Inventory</h2>
            <p className="text-slate-400 mt-1">{inventory.length} total items</p>
          </div>

          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        {filteredInventory.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No items found matching "{searchTerm}"
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-lg">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 text-sm">Qty:</span>
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                          />
                          <button
                            onClick={() => handleSaveQuantity(item.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditQuantity(item)}
                          className="text-blue-400 text-sm hover:text-blue-300"
                        >
                          Qty: {item.quantity} {item.unit || 'units'}
                        </button>
                      )}

                      {item.price && (
                        <span className="text-green-400 text-sm">${item.price}</span>
                      )}
                      {item.sku && (
                        <span className="text-slate-400 text-sm">SKU: {item.sku}</span>
                      )}
                      {item.category && (
                        <span className="text-purple-400 text-sm">{item.category}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryListPage;
