import React, { useEffect, useState } from 'react';
import { collectionService } from '../services/api';
import { Loader2, XCircle, FileText, ArrowLeft, Hash, ListOrdered, Database, ClipboardCopy } from 'lucide-react';

interface SnapshotDetail {
  id: number;
  collection_id: string;
  snapshot_time: string;
  collection_name: string;
  item_count: number;
  size_kb: number;
  content?: string;
}

const SnapshotView: React.FC<{ snapshotId?: string }> = ({ snapshotId }) => {
  const [snapshot, setSnapshot] = useState<SnapshotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await collectionService.getCollectionDetails(snapshotId!);
        setSnapshot(response.data || response);
      } catch (err: any) {
        setError(err.message || 'Failed to load snapshot');
      } finally {
        setLoading(false);
      }
    };
    if (snapshotId) fetchSnapshot();
  }, [snapshotId]);

  const handleCopy = () => {
    if (!snapshot?.content) return;
    navigator.clipboard.writeText(
      (() => {
        try {
          return JSON.stringify(JSON.parse(snapshot.content), null, 2);
        } catch {
          return snapshot.content;
        }
      })()
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-2 md:px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-0 md:p-8 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 md:px-0 md:py-0 mb-6">
          <a href="/app" className="flex items-center gap-2 text-blue-600 hover:underline font-medium text-sm">
            <ArrowLeft className="h-5 w-5" />
            Back to Collections
          </a>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <FileText className="inline-block h-7 w-7 text-blue-500" />
            Snapshot Viewer
          </h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>
        {/* Main Content */}
        {loading && (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
            <span className="text-gray-600 text-lg font-medium">Loading snapshot...</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center py-24 text-red-600">
            <XCircle className="h-12 w-12 mb-2" />
            <span className="text-lg font-medium">{error}</span>
          </div>
        )}
        {snapshot && !loading && !error && (
          <div className="space-y-8">
            {/* Metadata Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <div className="bg-gray-50 rounded-xl p-5 border flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <Database className="h-5 w-5 text-blue-500" />
                  {snapshot.collection_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span>Snapshot ID:</span>
                  <span className="font-mono text-gray-700">{snapshot.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>Time:</span>
                  <span className="font-mono text-gray-700">{new Date(snapshot.snapshot_time).toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ListOrdered className="h-4 w-4 text-gray-400" />
                  <span>Items:</span>
                  <span className="font-bold text-gray-700">{snapshot.item_count}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Database className="h-4 w-4 text-gray-400" />
                  <span>Size:</span>
                  <span className="font-bold text-gray-700">{snapshot.size_kb} KB</span>
                </div>
              </div>
            </div>
            {/* Content Area */}
            <div className="relative bg-gray-100 rounded-xl p-4 border overflow-x-auto max-h-[60vh] shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Snapshot Content (JSON)</span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  title="Copy JSON"
                >
                  <ClipboardCopy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs md:text-sm whitespace-pre-wrap break-all font-mono text-gray-800 bg-gray-50 rounded p-2 border max-h-[50vh] overflow-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(snapshot.content || ''), null, 2);
                  } catch {
                    return snapshot.content || '(No content)';
                  }
                })()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapshotView; 