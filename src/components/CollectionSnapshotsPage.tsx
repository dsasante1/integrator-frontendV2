import React, { useEffect, useState } from 'react';
import { collectionService } from '../services/api';
import {
  Loader2,
  BarChart3,
  FileText,
  Hash,
  ListOrdered,
  Database,
  Eye,
} from 'lucide-react';

interface Snapshot {
  id: number;
  collection_id: string;
  snapshot_time: string;
  collection_name: string;
  item_count: number;
  size_kb: number;
}

const CollectionSnapshotsPage: React.FC<{ collectionId: string }> = ({ collectionId }) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshots = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await collectionService.getCollectionSnapshots(collectionId);
        setSnapshots(data.data || data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch snapshots');
      } finally {
        setLoading(false);
      }
    };
    if (collectionId) fetchSnapshots();
  }, [collectionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-5xl bg-white/90 rounded-3xl shadow-2xl px-8 py-10 border border-gray-100 mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 flex items-center gap-4 tracking-tight">
            <FileText className="h-10 w-10 text-blue-600" />
            Collection Snapshots
          </h1>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-6" />
            <p className="text-xl text-gray-600 font-semibold">Loading snapshots...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-red-600">
            <BarChart3 className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">{error}</p>
          </div>
        )}

        {!loading && snapshots.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BarChart3 className="h-20 w-20 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-6">No Snapshots Found</h3>
            <p className="text-gray-500 mt-3">There are currently no snapshots for this collection.</p>
          </div>
        )}

        {!loading && snapshots.length > 0 && !error && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-md bg-white">
            <table className="min-w-full table-auto text-sm text-left rounded-2xl overflow-hidden">
              <thead className="bg-blue-50 text-blue-900 text-xs uppercase font-bold tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 flex items-center gap-2 whitespace-nowrap">
                    <Hash className="w-4 h-4 text-blue-400" /> ID
                  </th>
                  <th className="px-6 py-4 flex items-center gap-2 whitespace-nowrap">
                    <FileText className="w-4 h-4 text-blue-400" /> Snapshot Time
                  </th>
                  <th className="px-6 py-4 flex items-center gap-2 whitespace-nowrap">
                    <Hash className="w-4 h-4 text-blue-400" /> Hash
                  </th>
                  <th className="px-6 py-4 flex items-center gap-2 whitespace-nowrap">
                    <ListOrdered className="w-4 h-4 text-blue-400" /> Items
                  </th>
                  <th className="px-6 py-4 flex items-center gap-2 whitespace-nowrap">
                    <Database className="w-4 h-4 text-blue-400" /> Size (KB)
                  </th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {snapshots.map((snapshot, idx) => (
                  <tr
                    key={snapshot.id}
                    className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/60'} hover:bg-blue-100/60`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{snapshot.id}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {new Date(snapshot.snapshot_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono whitespace-nowrap">
                      {snapshot.collection_id.slice(0, 16)}...
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{snapshot.item_count}</td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{snapshot.size_kb}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <a
                        href={`/app/snapshot/${snapshot.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 hover:from-blue-200 hover:to-blue-300 hover:text-blue-900 text-xs font-semibold transition-all shadow-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        title="View Snapshot"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionSnapshotsPage;