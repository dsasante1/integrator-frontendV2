import React, { useEffect, useState } from 'react';
import { collectionService } from '../../services/api';
import { Loader2, XCircle } from 'lucide-react';

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

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      try {
        // You may need to adjust this API call if you have a direct snapshot endpoint
        const response = await collectionService.getCollectionDetails(snapshotId!);
        setSnapshot(response.data || response); // handle both {data: ...} and direct object
      } catch (err: any) {
        setError(err.message || 'Failed to load snapshot');
      } finally {
        setLoading(false);
      }
    };
    if (snapshotId) fetchSnapshot();
  }, [snapshotId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-8">
        <a
          href="/app"
          className="mb-4 text-blue-600 hover:underline inline-block"
        >
          ← Back
        </a>
        <h1 className="text-2xl font-bold mb-4">Snapshot Viewer</h1>
        {loading && (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-4" />
            <span className="text-gray-600">Loading snapshot...</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center py-20 text-red-600">
            <XCircle className="h-10 w-10 mb-2" />
            <span>{error}</span>
          </div>
        )}
        {snapshot && !loading && !error && (
          <div>
            <div className="mb-6">
              <div className="text-lg font-semibold">{snapshot.collection_name}</div>
              <div className="text-sm text-gray-500">Snapshot ID: {snapshot.id}</div>
              <div className="text-sm text-gray-500">Time: {new Date(snapshot.snapshot_time).toLocaleString()}</div>
              <div className="text-sm text-gray-500">Items: {snapshot.item_count} | Size: {snapshot.size_kb} KB</div>
            </div>
            <div className="bg-gray-100 rounded p-4 overflow-x-auto max-h-[60vh]">
              <pre className="text-xs md:text-sm whitespace-pre-wrap break-all">
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