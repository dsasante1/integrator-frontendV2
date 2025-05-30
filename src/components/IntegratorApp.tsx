import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle, Upload, Key, Settings, BarChart3, Loader2 } from 'lucide-react';

// Types
interface Collection {
  id: string;
  name: string;
  snapshot_count: number;
  first_snapshot: string;
  last_snapshot: string;
}

interface Snapshot {
  id: number;
  snapshot_time: string;
  hash: string;
}

interface ApiKey {
  name: string;
  key: string;
  default: boolean;
}

interface PostmanCollection {
  id: string;
  name: string;
  description?: string;
  requests: number;
}

interface CompareResult {
  path: string;
  change_type: 'added' | 'deleted' | 'modified';
  old_value?: string;
  new_value?: string;
}

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  visible: boolean;
}

// Notification Component
const NotificationItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ 
  notification, 
  onClose 
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };
  
  const Icon = icons[notification.type];
  
  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };
  
  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400'
  };

  return (
    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border p-4 ${bgColors[notification.type]} transition-all duration-300`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColors[notification.type]}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button 
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Collection Modal Component
const CollectionModal: React.FC<{
  show: boolean;
  collection: Collection | null;
  snapshots: Snapshot[];
  isLoading: boolean;
  onClose: () => void;
  onViewSnapshot: (id: number) => void;
  onSelectForCompare: (snapshot: Snapshot) => void;
  selectedSnapshots: Snapshot[];
}> = ({ show, collection, snapshots, isLoading, onClose, onViewSnapshot, onSelectForCompare, selectedSnapshots }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 modal-backdrop flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Snapshots for {collection?.name || 'Collection'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
              <p className="mt-4 text-gray-600">Loading snapshots...</p>
            </div>
          )}
          
          {!isLoading && snapshots.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No snapshots found</h3>
              <p className="mt-2 text-gray-500">No snapshots found for this collection.</p>
            </div>
          )}
          
          {!isLoading && snapshots.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snapshot Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {snapshots.map(snapshot => {
                    const isSelected = selectedSnapshots.some(s => s.id === snapshot.id);
                    return (
                      <tr key={snapshot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{snapshot.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(snapshot.snapshot_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {snapshot.hash.substring(0, 16)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          <button
                            onClick={() => onViewSnapshot(snapshot.id)}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onSelectForCompare(snapshot)}
                            disabled={selectedSnapshots.length >= 2 && !isSelected}
                            className="text-green-600 hover:text-green-900 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {isSelected ? '✓ Selected' : 'Select for Compare'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const IntegratorApp: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('collections');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedSnapshots, setSelectedSnapshots] = useState<(Snapshot & { collectionName: string })[]>([]);
  const [compareResults, setCompareResults] = useState<CompareResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [modalSnapshots, setModalSnapshots] = useState<Snapshot[]>([]);

  // Add notification
  const addNotification = (type: Notification['type'], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message, visible: true }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Remove notification
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addNotification('info', `Selected file: ${file.name}`);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      addNotification('error', 'Please select a file first');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual file upload logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      addNotification('success', 'File uploaded successfully');
      setSelectedFile(null);
    } catch (error) {
      addNotification('error', 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle collection selection
  const handleCollectionSelect = async (collection: Collection) => {
    setSelectedCollection(collection);
    setShowCollectionModal(true);
    setIsLoading(true);
    try {
      // TODO: Implement actual API call to fetch snapshots
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      setModalSnapshots([]); // Replace with actual API response
    } catch (error) {
      addNotification('error', 'Failed to load snapshots');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle snapshot view
  const handleViewSnapshot = (snapshotId: number) => {
    // TODO: Implement snapshot view logic
    addNotification('info', `Viewing snapshot ${snapshotId}`);
  };

  // Handle snapshot selection for comparison
  const handleSelectForCompare = (snapshot: Snapshot) => {
    if (selectedSnapshots.length >= 2) {
      addNotification('warning', 'You can only compare two snapshots at a time');
      return;
    }

    const newSelected = [...selectedSnapshots, { ...snapshot, collectionName: selectedCollection?.name || '' }];
    setSelectedSnapshots(newSelected);

    if (newSelected.length === 2) {
      // TODO: Implement comparison logic
      addNotification('info', 'Comparing snapshots...');
    }
  };

  // Handle API key management
  const handleApiKeyAdd = () => {
    // TODO: Implement API key addition logic
    addNotification('info', 'Adding new API key...');
  };

  const handleApiKeyDelete = (key: string) => {
    // TODO: Implement API key deletion logic
    addNotification('info', 'Deleting API key...');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-4">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['collections', 'snapshots', 'api-keys'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {activeTab === 'collections' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Collections</h2>
                <div className="flex space-x-4">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".json"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Select File
                  </label>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                      <Upload className="h-5 w-5 mr-2" />
                    )}
                    Upload
                  </button>
                </div>
              </div>

              {/* Collections List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Snapshots</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Snapshot</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Snapshot</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {collections.map(collection => (
                      <tr key={collection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{collection.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{collection.snapshot_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(collection.first_snapshot).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(collection.last_snapshot).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleCollectionSelect(collection)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Snapshots
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">API Keys</h2>
                <button
                  onClick={handleApiKeyAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Key className="h-5 w-5 mr-2" />
                  Add API Key
                </button>
              </div>

              {/* API Keys List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map(apiKey => (
                      <tr key={apiKey.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apiKey.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {apiKey.key.substring(0, 16)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {apiKey.default ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleApiKeyDelete(apiKey.key)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collection Modal */}
      <CollectionModal
        show={showCollectionModal}
        collection={selectedCollection}
        snapshots={modalSnapshots}
        isLoading={isLoading}
        onClose={() => setShowCollectionModal(false)}
        onViewSnapshot={handleViewSnapshot}
        onSelectForCompare={handleSelectForCompare}
        selectedSnapshots={selectedSnapshots}
      />
    </div>
  );
};

export default IntegratorApp;