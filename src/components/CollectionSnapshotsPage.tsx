import React, { useEffect, useState } from 'react';
import { collectionService } from '../services/api';
import { Loader2, XCircle, FileText, ArrowLeft, Hash, ListOrdered, Database, } from 'lucide-react';

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

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '0' }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0' }}>
        {/* Header */}
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '24px 0 24px 0' }}>Collection Snapshots</h1>

        {/* Content */}
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', color: '#444' }}>Loading snapshots...</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'red' }}>
            <span style={{ fontSize: '1.2rem' }}>{error}</span>
          </div>
        )}

        {!loading && snapshots.length === 0 && !error && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '16px' }}>No Snapshots Found</h3>
            <p style={{ color: '#666', marginTop: '8px' }}>There are currently no snapshots for this collection.</p>
          </div>
        )}

        {!loading && snapshots.length > 0 && !error && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.05rem', color: '#111' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 8px 8px 0', fontWeight: 'bold' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Snapshot Time</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Collection ID</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Items</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Size (KB)</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map(snapshot => (
                    <tr key={snapshot.id}>
                      <td style={{ padding: '4px 8px 4px 0' }}>{snapshot.id}</td>
                      <td style={{ padding: '4px 8px' }}>{new Date(snapshot.snapshot_time).toLocaleString()}</td>
                      <td style={{ padding: '4px 8px' }}>{snapshot.collection_id.slice(0, 16)}...</td>
                      <td style={{ padding: '4px 8px' }}>{snapshot.item_count}</td>
                      <td style={{ padding: '4px 8px' }}>{snapshot.size_kb}</td>
                      <td style={{ padding: '4px 8px' }}>
                        <a
                          href={`/app/snapshot/${snapshot.id}?collectionId=${snapshot.collection_id}`}
                          style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
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
            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px 0' }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{ marginRight: 16, padding: '6px 12px', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              <span style={{ margin: '0 12px' }}>
                Page {pagination.page} of {pagination.totalPages} (Total: {pagination.totalItems})
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                style={{ marginLeft: 16, padding: '6px 12px', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
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