import React, { useEffect, useState } from 'react';
import { collectionService } from '../services/api';
import { Loader2, XCircle } from 'lucide-react';

interface Snapshot {
  id: number;
  collection_id: string;
  snapshot_time: string;
  collection_name: string;
  item_count: number;
  size_kb: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

const DEFAULT_PAGE_SIZE = 10;

interface CollectionSnapshotsPageProps {
  collectionId: string;
}

const CollectionSnapshotsPage: React.FC<CollectionSnapshotsPageProps> = ({ collectionId }) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 1,
    totalItems: 0,
  });

  const fetchSnapshots = async (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectionService.getCollectionSnapshots(collectionId, page, pageSize);
      setSnapshots(data.data || []);
      setPagination({
        page: data.page || 1,
        pageSize: data.pageSize || DEFAULT_PAGE_SIZE,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || (data.data ? data.data.length : 0),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch snapshots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionId) fetchSnapshots(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchSnapshots(newPage, pagination.pageSize);
  };

  const handleFetchSnapshot = () => {
    // Add your fetch snapshot logic here
    console.log('Fetch snapshot clicked');
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Collection Snapshots</h1>
          <button 
            onClick={handleFetchSnapshot}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            Fetch Snapshot
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg text-gray-600">Loading snapshots...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-20">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <span className="text-lg text-red-600">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && snapshots.length === 0 && !error && (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Snapshots Found</h3>
            <p className="text-gray-500">There are currently no snapshots for this collection.</p>
          </div>
        )}

        {/* Table */}
        {!loading && snapshots.length > 0 && !error && (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Snapshot Time</th>
                    <th className="px-6 py-3">Collection ID</th>
                    <th className="px-6 py-3">Items</th>
                    <th className="px-6 py-3">Size (KB)</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {snapshots.map(snapshot => (
                    <tr key={snapshot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{snapshot.id}</td>
                      <td className="px-6 py-4">{new Date(snapshot.snapshot_time).toLocaleString()}</td>
                      <td className="px-6 py-4">{snapshot.collection_id.slice(0, 16)}...</td>
                      <td className="px-6 py-4">{snapshot.item_count}</td>
                      <td className="px-6 py-4">{snapshot.size_kb}</td>
                      <td className="px-6 py-4">
                        <a
                          href={`/app/snapshot/${snapshot.id}?collectionId=${snapshot.collection_id}`}
                          className="text-blue-600 hover:underline"
                          title="View Snapshot"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-6 mt-6 text-sm">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 border border-gray-300 rounded-md ${
                  pagination.page === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                Prev
              </button>
              <span className="text-gray-600">
                Page {pagination.page} of {pagination.totalPages} (Total: {pagination.totalItems})
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1 border border-gray-300 rounded-md ${
                  pagination.page === pagination.totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CollectionSnapshotsPage;