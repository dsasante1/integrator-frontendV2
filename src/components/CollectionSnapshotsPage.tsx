import React, { useEffect, useState } from 'react';
import { collectionService, snapshotService } from '../services/api';
import { Loader2, XCircle, RefreshCw } from 'lucide-react';

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

interface CollectionInfo {
  id: string;
  name: string;
}

const DEFAULT_PAGE_SIZE = 10;

interface CollectionSnapshotsPageProps {
  collectionId: string;
}

const CollectionSnapshotsPage: React.FC<CollectionSnapshotsPageProps> = ({ collectionId }) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingSnapshot, setFetchingSnapshot] = useState(false);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
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
      
      // Set snapshots data
      setSnapshots(data.data || []);
      
      if (data.data && data.data.length > 0) {
        setCollectionInfo({
          id: data.data[0].collection_id,
          name: data.data[0].collection_name
        });
      }
      
      // Set pagination
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
    if (collectionId) {
      fetchSnapshots(1, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchSnapshots(newPage, pagination.pageSize);
  };

  const handleFetchSnapshot = async () => {
    if (!collectionInfo) {
      setError('Collection information not available');
      return;
    }

    setFetchingSnapshot(true);
    setError(null);
    
    try {
      await snapshotService.refreshSnapShots(collectionInfo.id, collectionInfo.name);
      
      await fetchSnapshots(pagination.page, pagination.pageSize);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create snapshot');
    } finally {
      setFetchingSnapshot(false);
    }
  };

  const formatFileSize = (sizeKb: number): string => {
    if (sizeKb < 1024) {
      return `${sizeKb} KB`;
    } else if (sizeKb < 1024 * 1024) {
      return `${(sizeKb / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeKb / (1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Collection Snapshots</h1>
            {collectionInfo && (
              <p className="text-gray-600 mt-2">
                Collection: <span className="font-medium">{collectionInfo.name}</span>
                <span className="text-sm text-gray-500 ml-2">({collectionInfo.id})</span>
              </p>
            )}
          </div>
          <button 
            onClick={handleFetchSnapshot}
            disabled={fetchingSnapshot || !collectionInfo}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition ${
              fetchingSnapshot || !collectionInfo
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {fetchingSnapshot ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Create Snapshot
              </>
            )}
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && snapshots.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12">
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Snapshots Found</h3>
              <p className="text-gray-500 mb-4">There are currently no snapshots for this collection.</p>
              <button
                onClick={handleFetchSnapshot}
                disabled={fetchingSnapshot || !collectionInfo}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  fetchingSnapshot || !collectionInfo
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {fetchingSnapshot ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Create First Snapshot
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && snapshots.length > 0 && (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Snapshot Time</th>
                    <th className="px-6 py-4 font-semibold">Collection Name</th>
                    <th className="px-6 py-4 font-semibold text-right">Items</th>
                    <th className="px-6 py-4 font-semibold text-right">Size</th>
                    <th className="px-6 py-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {snapshots.map((snapshot) => (
                    <tr key={snapshot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        #{snapshot.id}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(snapshot.snapshot_time)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="max-w-xs truncate" title={snapshot.collection_name}>
                          {snapshot.collection_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {snapshot.collection_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {snapshot.item_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {formatFileSize(snapshot.size_kb)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a
                          href={`/app/snapshot/${snapshot.id}?collectionId=${snapshot.collection_id}&itemSize=${snapshot.item_count}`}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          title="View Snapshot Details"
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
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
                {pagination.totalItems} snapshots
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                    pagination.page === 1 
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                      : 'text-gray-700 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                    pagination.page === pagination.totalPages 
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                      : 'text-gray-700 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CollectionSnapshotsPage;