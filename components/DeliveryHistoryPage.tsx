import React, { useState, useEffect } from 'react';
import { getReceivingReports } from '../services/firestoreClient';
import type { ReceivingReport } from '../types';

const DeliveryHistoryPage: React.FC = () => {
  const [reports, setReports] = useState<ReceivingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReceivingReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getReceivingReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'match': return 'text-green-400';
      case 'shortage': return 'text-yellow-400';
      case 'overage': return 'text-blue-400';
      case 'missing': return 'text-red-400';
      case 'damaged': return 'text-gray-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match': return '✓';
      case 'shortage': return '⚠';
      case 'overage': return '↑';
      case 'missing': return '✗';
      case 'damaged': return '⚡';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
          <div className="text-white text-lg">Loading delivery history...</div>
        </div>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Delivery Report Details</h2>
              <p className="text-slate-400">{formatDate(selectedReport.createdAt)}</p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg"
            >
              ← Back to List
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-slate-400">Total Items</div>
              <div className="text-2xl font-bold text-white">{selectedReport.totalItems}</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/50">
              <div className="text-sm text-green-300">Matched</div>
              <div className="text-2xl font-bold text-green-400">{selectedReport.matchedItems}</div>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/50">
              <div className="text-sm text-yellow-300">Issues</div>
              <div className="text-2xl font-bold text-yellow-400">{selectedReport.issueItems}</div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white mb-3">Items</h3>
            {selectedReport.items.map((item, index) => (
              <div
                key={index}
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white text-lg mb-1">{item.name}</div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-400">
                        Expected: <span className="font-bold text-white">{item.expectedQty}</span>
                      </span>
                      <span className="text-slate-400">
                        Actual: <span className={`font-bold ${item.actualQty === item.expectedQty ? 'text-green-400' : 'text-yellow-400'}`}>
                          {item.actualQty}
                        </span>
                      </span>
                      {item.unitPrice && (
                        <span className="text-slate-400">@ ${item.unitPrice}</span>
                      )}
                    </div>
                    {item.notes && (
                      <div className="text-sm text-blue-300 mt-2">Note: {item.notes}</div>
                    )}
                  </div>
                  <div className={`text-2xl ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-2">Delivery History</h2>
        <p className="text-slate-400 mb-6">
          View past receiving verifications and track delivery accuracy
        </p>

        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-white text-xl font-medium mb-2">No delivery reports yet</div>
            <div className="text-slate-400">Start by receiving a delivery and saving the report</div>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      {formatDate(report.createdAt)}
                      {report.vendorName && <span className="text-slate-400 ml-2">• {report.vendorName}</span>}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-400">
                        {report.totalItems} items
                      </span>
                      <span className="text-green-400">
                        {report.matchedItems} matched
                      </span>
                      {report.issueItems > 0 && (
                        <span className="text-yellow-400">
                          {report.issueItems} issues
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-400">→</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryHistoryPage;
