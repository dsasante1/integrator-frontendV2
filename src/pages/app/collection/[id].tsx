import React, { useEffect, useState } from 'react';

interface Snapshot {
  id: number;
  collection_id: string;
  snapshot_time: string;
  collection_name: string;
  item_count: number;
  size_kb: number;
}

const CollectionSnapshotsPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get collection ID from URL
  const collectionId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchSnapshots = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/collections/${collectionId}/snapshots`);
        if (!response.ok) throw new Error('Failed to fetch snapshots');
        const data = await response.json();
        setSnapshots(data.data || data); // handle both {data: ...} and direct array
      } catch (err: any) {
        setError(err.message || 'Failed to fetch snapshots');
      } finally {
        setLoading(false);
      }
    };
    if (collectionId) fetchSnapshots();
  }, [collectionId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Collection Snapshots</h1>
      {loading && <div>Loading snapshots...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <table className="min-w-full text-sm bg-white rounded shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Snapshot Time</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Size (KB)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {snapshots.map(snapshot => (
              <tr key={snapshot.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{snapshot.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(snapshot.snapshot_time).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{snapshot.item_count}</td>
                <td className="px-6 py-4 whitespace-nowrap">{snapshot.size_kb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CollectionSnapshotsPage; 