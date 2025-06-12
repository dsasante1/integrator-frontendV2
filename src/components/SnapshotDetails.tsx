import React, { useEffect, useState } from 'react';
import { snapshotService } from '../services/api';
import { Loader2, XCircle, FileText, Database, Folder } from 'lucide-react';

interface SnapshotDetail {
  collection_id: string;
  collection_name: string;
  filters_applied: {
    Fields: string;
    Search: string;
    ItemType: string;
    Depth: string;
  };
  items: Array<{ name: string }>;
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  snapshot_id: string;
}

const SnapshotDetails: React.FC<{ snapshotId: string; collectionId: string }> = ({ snapshotId, collectionId }) => {
  const [snapshot, setSnapshot] = useState<SnapshotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await snapshotService.getSnapshotFolders(snapshotId, collectionId);
        setSnapshot(response.data || response);
      } catch (err: any) {
        setError(err.message || 'Failed to load snapshot');
      } finally {
        setLoading(false);
      }
    };
    if (snapshotId) fetchSnapshot();
  }, [snapshotId, collectionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
            <FileText className="h-7 w-7 text-blue-600" />
            Snapshot Details
          </h1>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-24">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
            <span className="text-gray-600 text-lg font-medium">Loading snapshot...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center py-24 text-red-600">
            <XCircle className="h-12 w-12 mb-2" />
            <span className="text-lg font-medium">{error}</span>
          </div>
        )}

        {/* Snapshot Content */}
        {snapshot && !loading && !error && (
          <div className="space-y-8">
            {/* Collection Info */}
            <Card title="Collection Info" icon={<Database className="text-blue-500" />}>
              <Field label="Collection Name" value={snapshot.collection_name} />
              <Field label="Collection ID" value={snapshot.collection_id} />
              <Field label="Snapshot ID" value={snapshot.snapshot_id} />
            </Card>

            {/* Items */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
                <Folder className="text-orange-500" />
                Items ({snapshot.items.length})
              </div>
              {snapshot.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {snapshot.items.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No items available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// card container
const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
      {icon}
      {title}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">{children}</div>
  </div>
);

// field display
const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-gray-500">{label}</span>
    <span className="font-mono text-gray-800">{value}</span>
  </div>
);

export default SnapshotDetails;
