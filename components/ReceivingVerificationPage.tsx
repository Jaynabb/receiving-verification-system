import React, { useState, useRef } from 'react';
import { convertPdfToImages } from '../services/pdfHelper';
import { analyzeInvoicePhoto } from '../services/geminiService';
import type { InventoryItem } from '../types';

interface VerificationItem {
  name: string;
  expectedQty: number;
  actualQty: number;
  unitPrice?: number;
  verified: boolean;
  status: 'pending' | 'match' | 'shortage' | 'overage' | 'missing' | 'damaged';
  notes: string;
}

interface Props {
  inventory: InventoryItem[];
}

const ReceivingVerificationPage: React.FC<Props> = ({ inventory }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [currentStep, setCurrentStep] = useState<'scan' | 'verify' | 'report'>('scan');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

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

    setAnalyzing(true);
    setError(null);

    try {
      const pdfPages = (window as any).__invoicePdfPages;
      let allInvoiceItems: any[] = [];

      if (pdfPages && pdfPages.length > 1) {
        for (let i = 0; i < pdfPages.length; i++) {
          const base64Image = pdfPages[i].split(',')[1];
          const pageItems = await analyzeInvoicePhoto(base64Image, inventory);
          allInvoiceItems = [...allInvoiceItems, ...pageItems];
        }
      } else {
        const base64Image = imagePreview.split(',')[1];
        allInvoiceItems = await analyzeInvoicePhoto(base64Image, inventory);
      }

      // Convert to verification items - START COUNTING AT ZERO
      const verificationItems: VerificationItem[] = allInvoiceItems.map(item => ({
        name: item.name,
        expectedQty: item.quantity || 0,
        actualQty: 0, // Start at zero - user taps +1 as they count
        unitPrice: item.unitPrice,
        verified: false,
        status: 'pending',
        notes: ''
      }));

      setItems(verificationItems);
      setCurrentStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze invoice');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (index: number, updates: Partial<VerificationItem>) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;

      const updated = { ...item, ...updates };

      // Auto-determine status based on quantities
      if (updates.actualQty !== undefined) {
        if (updated.actualQty === updated.expectedQty) {
          updated.status = 'match';
          updated.verified = true; // Auto-verify when count matches
        } else if (updated.actualQty < updated.expectedQty) {
          updated.status = 'shortage';
        } else if (updated.actualQty > updated.expectedQty) {
          updated.status = 'overage';
        } else {
          updated.status = 'pending';
        }
      }

      return updated;
    }));
  };

  const incrementCount = (index: number) => {
    const item = items[index];
    const newQty = item.actualQty + 1;
    updateItem(index, { actualQty: newQty });
  };

  const decrementCount = (index: number) => {
    const item = items[index];
    const newQty = Math.max(0, item.actualQty - 1);
    updateItem(index, { actualQty: newQty });
  };

  const resetCount = (index: number) => {
    updateItem(index, { actualQty: 0, verified: false, status: 'pending' });
  };

  const finishCounting = (index: number) => {
    const item = items[index];
    updateItem(index, { verified: true });
  };

  const markAs = (index: number, status: VerificationItem['status']) => {
    updateItem(index, { status, verified: true });
  };

  const getStatusColor = (status: VerificationItem['status']) => {
    switch (status) {
      case 'match': return 'bg-green-500/20 border-green-500';
      case 'shortage': return 'bg-yellow-500/20 border-yellow-500';
      case 'overage': return 'bg-blue-500/20 border-blue-500';
      case 'missing': return 'bg-red-500/20 border-red-500';
      case 'damaged': return 'bg-gray-500/20 border-gray-500';
      default: return 'bg-slate-700/50 border-slate-600';
    }
  };

  const getStatusIcon = (status: VerificationItem['status']) => {
    switch (status) {
      case 'match': return '✓';
      case 'shortage': return '⚠';
      case 'overage': return '↑';
      case 'missing': return '✗';
      case 'damaged': return '⚡';
      default: return '○';
    }
  };

  const stats = {
    total: items.length,
    verified: items.filter(i => i.verified).length,
    matched: items.filter(i => i.status === 'match').length,
    issues: items.filter(i => ['shortage', 'overage', 'missing', 'damaged'].includes(i.status)).length
  };

  const resetScan = () => {
    setImagePreview(null);
    setItems([]);
    setCurrentStep('scan');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Receiving Verification</h2>
          <p className="text-slate-400">
            {currentStep === 'scan' && 'Scan delivery invoice to start verification'}
            {currentStep === 'verify' && 'Check off items as you physically verify them'}
            {currentStep === 'report' && 'Review discrepancies and save report'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${currentStep === 'scan' ? 'text-blue-400' : 'text-green-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'scan' ? 'bg-blue-500' : 'bg-green-500'}`}>
              {currentStep === 'scan' ? '1' : '✓'}
            </div>
            <span className="font-medium">Scan</span>
          </div>
          <div className="flex-1 h-1 bg-slate-700 rounded"></div>
          <div className={`flex items-center gap-2 ${currentStep === 'verify' ? 'text-blue-400' : currentStep === 'report' ? 'text-green-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'verify' ? 'bg-blue-500' : currentStep === 'report' ? 'bg-green-500' : 'bg-slate-700'}`}>
              {currentStep === 'report' ? '✓' : '2'}
            </div>
            <span className="font-medium">Verify</span>
          </div>
          <div className="flex-1 h-1 bg-slate-700 rounded"></div>
          <div className={`flex items-center gap-2 ${currentStep === 'report' ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'report' ? 'bg-blue-500' : 'bg-slate-700'}`}>
              3
            </div>
            <span className="font-medium">Report</span>
          </div>
        </div>

        {/* Step 1: Scan Invoice */}
        {currentStep === 'scan' && (
          <>
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
                  <div className="text-white font-medium mb-2">Scan Delivery Invoice</div>
                  <div className="text-slate-400 text-sm">Take photo or upload PDF</div>
                </label>
              </div>
            )}

            {imagePreview && !analyzing && (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Invoice preview"
                  className="w-full rounded-lg border-2 border-slate-700"
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleAnalyze}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Extract Items
                  </button>
                  <button
                    onClick={resetScan}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-pulse">🔍</div>
                <div className="text-white text-xl font-medium mb-2">Analyzing Invoice...</div>
                <div className="text-slate-400">Extracting line items</div>
              </div>
            )}
          </>
        )}

        {/* Step 2: Verification Checklist */}
        {currentStep === 'verify' && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-slate-400">Total Items</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-4 text-center border border-green-500/50">
                <div className="text-2xl font-bold text-green-400">{stats.matched}</div>
                <div className="text-sm text-green-300">Matched</div>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-4 text-center border border-yellow-500/50">
                <div className="text-2xl font-bold text-yellow-400">{stats.issues}</div>
                <div className="text-sm text-yellow-300">Issues</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-400">{stats.total - stats.verified}</div>
                <div className="text-sm text-slate-400">Pending</div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border-2 transition-all ${getStatusColor(item.status)}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="text-3xl">{getStatusIcon(item.status)}</div>

                    {/* Item Info */}
                    <div className="flex-1">
                      <div className="font-medium text-white text-lg mb-2">{item.name}</div>

                      {/* Counting Interface */}
                      <div className="mb-3">
                        {/* Big Counter Display */}
                        <div className="bg-slate-900/70 rounded-xl p-4 mb-3 text-center">
                          <div className="text-sm text-slate-400 mb-1">Count Progress</div>
                          <div className="text-4xl font-bold text-white">
                            <span className={item.actualQty === item.expectedQty ? 'text-green-400' : 'text-blue-400'}>
                              {item.actualQty}
                            </span>
                            <span className="text-slate-600"> / </span>
                            <span className="text-slate-400">{item.expectedQty}</span>
                          </div>
                          {item.unitPrice && (
                            <div className="text-sm text-slate-400 mt-1">@ ${item.unitPrice} each</div>
                          )}
                        </div>

                        {/* Counting Buttons */}
                        {!item.verified && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {/* Big +1 Button */}
                            <button
                              onClick={() => incrementCount(index)}
                              className="col-span-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-6 px-4 rounded-xl text-2xl shadow-lg transform active:scale-95 transition-all"
                            >
                              +1
                            </button>

                            {/* Side buttons */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => decrementCount(index)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => resetCount(index)}
                                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-lg"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Quick Action Buttons */}
                        {!item.verified && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => finishCounting(index)}
                              disabled={item.actualQty === 0}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white text-sm py-2 px-4 rounded-lg"
                            >
                              Done Counting
                            </button>
                            <button
                              onClick={() => markAs(index, 'missing')}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg"
                            >
                              Missing
                            </button>
                            <button
                              onClick={() => markAs(index, 'damaged')}
                              className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg"
                            >
                              Damaged
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {item.verified && (
                        <input
                          type="text"
                          placeholder="Add notes (optional)"
                          value={item.notes}
                          onChange={(e) => updateItem(index, { notes: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('report')}
                disabled={stats.verified === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Continue to Report ({stats.verified}/{stats.total})
              </button>
              <button
                onClick={resetScan}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Step 3: Reconciliation Report */}
        {currentStep === 'report' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-slate-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Receiving Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Perfect Matches</div>
                  <div className="text-2xl font-bold text-green-400">{stats.matched}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Discrepancies</div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.issues}</div>
                </div>
              </div>
            </div>

            {/* Issues List */}
            {stats.issues > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Issues Found</h3>
                <div className="space-y-2">
                  {items.filter(i => ['shortage', 'overage', 'missing', 'damaged'].includes(i.status)).map((item, index) => (
                    <div key={index} className="bg-slate-900/50 rounded p-3">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        Expected: {item.expectedQty} | Actual: {item.actualQty} | Status: {item.status.toUpperCase()}
                      </div>
                      {item.notes && (
                        <div className="text-sm text-yellow-300 mt-1">Note: {item.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  // TODO: Save report to database
                  alert('Report saved! (Database integration needed)');
                  resetScan();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Save Report
              </button>
              <button
                onClick={() => setCurrentStep('verify')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Back to Verify
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <div className="text-red-400">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivingVerificationPage;
