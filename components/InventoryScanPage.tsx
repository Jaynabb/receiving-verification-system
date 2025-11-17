import React, { useState, useRef } from 'react';
import { convertPdfToImage, convertPdfToImages } from '../services/pdfHelper';
import { analyzeInventoryPhoto } from '../services/geminiService';
import { addInventoryItems } from '../services/firestoreClient';
import type { InventoryItem } from '../types';

interface Props {
  onInventoryAdded: () => void;
}

const InventoryScanPage: React.FC<Props> = ({ onInventoryAdded }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<InventoryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setExtractedItems([]);

    try {
      let dataUrl: string;

      if (file.type === 'application/pdf') {
        const images = await convertPdfToImages(file);
        dataUrl = images[0];
        (window as any).__pdfPages = images;
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        (window as any).__pdfPages = null;
      }

      setImagePreview(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to load file');
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    setAnalyzing(true);
    setError(null);

    try {
      const pdfPages = (window as any).__pdfPages;
      let allItems: InventoryItem[] = [];

      if (pdfPages && pdfPages.length > 1) {
        for (let i = 0; i < pdfPages.length; i++) {
          const base64Image = pdfPages[i].split(',')[1];
          const pageItems = await analyzeInventoryPhoto(base64Image);
          allItems = [...allItems, ...pageItems];
        }
      } else {
        const base64Image = imagePreview.split(',')[1];
        allItems = await analyzeInventoryPhoto(base64Image);
      }

      setExtractedItems(allItems);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
  };
  };

  const handleSaveInventory = async () => {
    if (extractedItems.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      await addInventoryItems(extractedItems);
      setSuccess(true);
      setExtractedItems([]);
      setImagePreview(null);
      onInventoryAdded();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save inventory');
    } finally {
      setSaving(false);
    }
  };

  const handleNewScan = () => {
    setImagePreview(null);
    setExtractedItems([]);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-2">Scan Inventory List</h2>
        <p className="text-slate-400 mb-6">
          Take a photo of your inventory list, shelf, or storage area to automatically extract and save all items.
        </p>

        {/* Upload Section */}
        {!imagePreview && (
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="inventory-upload"
            />
            <label htmlFor="inventory-upload" className="cursor-pointer">
              <div className="text-6xl mb-4">📸</div>
              <div className="text-white font-medium mb-2">Take Photo, Upload Image or PDF</div>
              <div className="text-slate-400 text-sm">Supports images (JPG, PNG) and PDF files</div>
            </label>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && !analyzing && extractedItems.length === 0 && (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Inventory preview"
              className="w-full rounded-lg border-2 border-slate-700"
            />
            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                🔍 Analyze Image
              </button>
              <button
                onClick={handleNewScan}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {analyzing && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">🔍</div>
            <div className="text-white text-xl font-medium mb-2">Analyzing Image...</div>
            <div className="text-slate-400">Extracting inventory items from photo</div>
          </div>
        )}

        {/* Extracted Items */}
        {extractedItems.length > 0 && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
              <div className="text-green-400 font-medium">
                ✓ Found {extractedItems.length} item{extractedItems.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {extractedItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="font-medium text-white">{item.name}</div>
                  {item.description && (
                    <div className="text-sm text-slate-400 mt-1">{item.description}</div>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    {item.quantity > 0 && (
                      <span className="text-blue-400">
                        Qty: {item.quantity} {item.unit || 'units'}
                      </span>
                    )}
                    {item.price && <span className="text-green-400">${item.price}</span>}
                    {item.sku && <span className="text-slate-400">SKU: {item.sku}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveInventory}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {saving ? '💾 Saving...' : `💾 Save ${extractedItems.length} Items to Inventory`}
              </button>
              <button
                onClick={handleNewScan}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                New Scan
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <div className="text-red-400">⚠️ {error}</div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <div className="text-green-400">✓ Inventory items saved successfully!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryScanPage;
