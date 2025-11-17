import React, { useState, useRef } from 'react';
import { convertPdfToImage, convertPdfToImages } from '../services/pdfHelper';
import { analyzeInvoicePhoto } from '../services/geminiService';
import { addInvoice } from '../services/firestoreClient';
import type { InventoryItem, InvoiceItem } from '../types';

interface Props {
  inventory: InventoryItem[];
}

const InvoiceMatchPage: React.FC<Props> = ({ inventory }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setInvoiceItems([]);

    try {
      let dataUrl: string;

      if (file.type === 'application/pdf') {
        const images = await convertPdfToImages(file);
        dataUrl = images[0];
        (window as any).__invoicePdfPages = images;
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        (window as any).__invoicePdfPages = null;
      }

      setImagePreview(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to load file');
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    if (inventory.length === 0) {
      setError('Please add inventory items first before scanning invoices');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const pdfPages = (window as any).__invoicePdfPages;
      let allItems: InvoiceItem[] = [];

      if (pdfPages && pdfPages.length > 1) {
        for (let i = 0; i < pdfPages.length; i++) {
          const base64Image = pdfPages[i].split(',')[1];
          const pageItems = await analyzeInvoicePhoto(base64Image, inventory);
          allItems = [...allItems, ...pageItems];
        }
      } else {
        const base64Image = imagePreview.split(',')[1];
        allItems = await analyzeInvoicePhoto(base64Image, inventory);
      }

      setInvoiceItems(allItems);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze invoice');
    } finally {
      setAnalyzing(false);
    }
  };


  const handleSaveInvoice = async () => {
    if (invoiceItems.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      await addInvoice({
        items: invoiceItems,
        createdAt: new Date()
      });
      setSuccess(true);
      setInvoiceItems([]);
      setImagePreview(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleNewScan = () => {
    setImagePreview(null);
    setInvoiceItems([]);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMatchedItem = (matchedId?: string) => {
    if (!matchedId) return null;
    return inventory.find(item => item.id === matchedId);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-2">Match Invoice</h2>
        <p className="text-slate-400 mb-6">
          Scan an invoice to automatically match items with your existing inventory.
        </p>

        {inventory.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <div className="text-yellow-400">
              ⚠️ You don't have any inventory items yet. Please scan your inventory first.
            </div>
          </div>
        )}

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
              id="invoice-upload"
            />
            <label htmlFor="invoice-upload" className="cursor-pointer">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-white font-medium mb-2">Take Photo, Upload Image or PDF</div>
              <div className="text-slate-400 text-sm">Supports images (JPG, PNG) and PDF files</div>
            </label>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && !analyzing && invoiceItems.length === 0 && (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Invoice preview"
              className="w-full rounded-lg border-2 border-slate-700"
            />
            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={inventory.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                🔍 Analyze & Match
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
            <div className="text-white text-xl font-medium mb-2">Analyzing Invoice...</div>
            <div className="text-slate-400">Extracting items and matching to inventory</div>
          </div>
        )}

        {/* Invoice Items with Matches */}
        {invoiceItems.length > 0 && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
              <div className="text-green-400 font-medium">
                ✓ Found {invoiceItems.length} item{invoiceItems.length !== 1 ? 's' : ''} on invoice
              </div>
              <div className="text-green-300 text-sm mt-1">
                {invoiceItems.filter(item => item.matchedInventoryId).length} matched to existing inventory
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {invoiceItems.map((item, index) => {
                const matchedItem = getMatchedItem(item.matchedInventoryId);
                return (
                  <div
                    key={index}
                    className={`rounded-lg p-4 border ${
                      matchedItem
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-slate-700/50 border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-blue-400">Qty: {item.quantity}</span>
                          {item.unitPrice && <span className="text-slate-400">${item.unitPrice} each</span>}
                          {item.total && <span className="text-green-400">Total: ${item.total}</span>}
                        </div>
                      </div>
                      {matchedItem && (
                        <div className="ml-4 text-right">
                          <div className="text-green-400 text-sm font-medium">✓ Matched</div>
                          <div className="text-slate-400 text-xs">→ {matchedItem.name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveInvoice}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {saving ? '💾 Saving...' : '💾 Save Invoice'}
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
            <div className="text-green-400">✓ Invoice saved successfully!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceMatchPage;
