
import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle, Upload, Key, Settings, BarChart3, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collectionService, apiKeyService } from '../services/api';
import LoginForm from './LoginForm';

// Types
interface Collection {
  id: string;
  user_id: string;
  name: string;
  first_seen: string;
  last_seen: string;
}

interface Snapshot {
  id: number;
  collection_id: string;
  snapshot_time: string;
  collection_name: string;
  item_count: number;
  size_kb: number;
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

const TAB_LIST = [
  { key: 'collections', label: 'Collections' },
  { key: 'import', label: 'Import' },
  { key: 'settings', label: 'Settings' },
];

//TODO Utility function for formatting dates. move to utility directory
function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'N/A';
  }
}

// Main App Component
const IntegratorApp: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = React.useState<'collections' | 'import' | 'settings'>('collections');
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [selectedSnapshots, setSelectedSnapshots] = React.useState<(Snapshot & { collectionName: string })[]>([]);
  const [compareResults, setCompareResults] = React.useState<CompareResult[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCollectionModal, setShowCollectionModal] = React.useState(false);
  const [selectedCollection, setSelectedCollection] = React.useState<Collection | null>(null);
  const [modalSnapshots, setModalSnapshots] = React.useState<Snapshot[]>([]);
  const [showActionsForCollection, setShowActionsForCollection] = React.useState<{[key: string]: boolean}>({});
  const [dropdownPosition, setDropdownPosition] = React.useState<{[key: string]: {top: number, left: number}}>({});
  const actionButtonRefs = React.useRef<{[key: string]: HTMLButtonElement | null}>({});

  const toggleActions = (collectionId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setDropdownPosition(prev => ({
      ...prev,
      [collectionId]: {
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 160
      }
    }));
    
    setShowActionsForCollection(prev => ({
      ...prev,
      [collectionId]: !prev[collectionId]
    }));
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (collectionId: string) => {
    setShowActionsForCollection(prev => ({
      ...prev,
      [collectionId]: false
    }));
  };

  // Fetch collections on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections();
    }
  }, [isAuthenticated]);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const data = await collectionService.getUserCollections();
      setCollections(data);
    } catch (error) {
      addNotification('error', 'Failed to fetch collections');
    } finally {
      setIsLoading(false);
    }
  };

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
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          const response = await collectionService.saveCollection(content.info._postman_id, content.info.name);
          addNotification('success', 'Collection imported successfully');
          setSelectedFile(null);
          // Refresh collections list
          setCollections(prev => [...prev, {
            id: content.info._postman_id,
            name: content.info.name,
            user_id: '',  // This will be set by the server
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
          }]);
        } catch (error) {
          addNotification('error', 'Failed to import collection');
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      addNotification('error', 'Failed to process file');
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
      const response = await collectionService.getCollectionSnapshots(collection.id);
      setModalSnapshots(response.data);
    } catch (error) {
      addNotification('error', 'Failed to fetch snapshots for this collection');
      setModalSnapshots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle snapshot selection for comparison
  const handleSelectForCompare = async (snapshot: Snapshot) => {
    if (selectedSnapshots.length >= 2) {
      addNotification('warning', 'You can only compare two snapshots at a time');
      return;
    }

    const newSelected = [...selectedSnapshots, { ...snapshot, collectionName: selectedCollection?.name || '' }];
    setSelectedSnapshots(newSelected);

    if (newSelected.length === 2) {
      try {
        const data = await collectionService.compareSnapshots(selectedCollection?.id || '');
        setCompareResults(data);
        addNotification('success', 'Comparison completed');
      } catch (error) {
        addNotification('error', 'Failed to compare snapshots');
      }
    }
  };

  // Handle API key management
  const handleApiKeyAdd = async (apiKey: string) => {
    try {
      await apiKeyService.saveApiKey(apiKey);
      addNotification('success', 'API key added successfully');
      // Refresh API keys list
      const keys = await apiKeyService.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      addNotification('error', 'Failed to add API key');
    }
  };

  const handleApiKeyDelete = async (id: string) => {
    try {
      await apiKeyService.deleteApiKey(id);
      addNotification('success', 'API key deleted successfully');
      // Refresh API keys list
      const keys = await apiKeyService.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      addNotification('error', 'Failed to delete API key');
    }
  };

  // Fetch API keys on mount
  useEffect(() => {
    if (isAuthenticated) {
      const fetchApiKeys = async () => {
        try {
          const keys = await apiKeyService.getApiKeys();
          setApiKeys(keys);
        } catch (error) {
          addNotification('error', 'Failed to fetch API keys');
        }
      };
      fetchApiKeys();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">integrator*</h1>
          <p className="text-gray-600">Manage, import, and compare your Postman collections</p>
        </div>
        <button
          onClick={logout}
          className="ml-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors duration-200"
        >
          Logout
        </button>
      </header>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Tabs Navigation */}
      <nav className="mb-8">
        <ul className="flex gap-2">
          {TAB_LIST.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm rounded-t`}
            >
              {tab.label}
            </button>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <div>
        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <section>
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-xl font-semibold mb-6">Collection Snapshots</h2>

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading collections...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && collections.length === 0 && (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
                  <p className="mt-1 text-sm text-gray-500">Use the Import tab to fetch collections.</p>
                  <div className="mt-6">
                    <button onClick={() => setActiveTab('import')} className="btn btn-primary">
                      Import Collections
                    </button>
                  </div>
                </div>
              )}

              {/* Collections Table */}
              {!isLoading && collections.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Collection</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">First Seen</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Last Seen</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {collections.map(collection => (
                        <tr key={collection.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{collection.name}</div>
                            <div className="text-xs text-gray-400">{collection.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(collection.first_seen)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(collection.last_seen)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              ref={el => actionButtonRefs.current[collection.id] = el}
                              onClick={(e) => toggleActions(collection.id, e)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            
                            {showActionsForCollection[collection.id] && (
                              <>
                                {/* Backdrop to close menu */}
                                <div 
                                  className="fixed inset-0 z-10"
                                  onClick={() => handleClickOutside(collection.id)}
                                />
                                {/* Dropdown menu - using fixed positioning to escape overflow container */}
                                <div 
                                  className="fixed z-20 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[160px]"
                                  style={{
                                    top: `${dropdownPosition[collection.id]?.top || 0}px`,
                                    left: `${dropdownPosition[collection.id]?.left || 0}px`
                                  }}
                                >
                                   <a
                                href={`/app/collection/${collection.id}`}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                                  >
                                    View Snapshots
                                        </a>
                                   <a
                                href={`/app/changedashboard/${collection.id}`}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                                  >
                                    View Collection History
                                        </a>
                                
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <section>
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-xl font-semibold mb-6">Import Postman Collection</h2>

              {/* File Upload Section */}
              <div className="mb-8">
                <p className="text-gray-600 mb-4">Upload a Postman collection JSON file to import it into the system.</p>
                <form onSubmit={e => { e.preventDefault(); handleUpload(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Collection File</label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".json"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {selectedFile && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected file: <span className="font-medium">{selectedFile.name}</span></p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!selectedFile || isLoading}
                      className="btn btn-primary flex items-center"
                    >
                      {isLoading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>}
                      <span>{isLoading ? 'Importing...' : 'Import Collection'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Import from Postman API */}
              <div className="border-t border-gray-200 pt-8 mt-8">
                <h2 className="text-xl font-semibold mb-6">Available Collections</h2>
                <p className="text-gray-600 mb-4">Browse and import collections from your Postman API keys.</p>

                {/* API Key Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select API Key</label>
                  <select
                    value={apiKeys.find(k => k.default)?.name || ''}
                    onChange={e => {/* TODO: handle API key change */}}
                    className="form-input"
                  >
                    <option value="">Choose an API key</option>
                    {apiKeys.map(key => (
                      <option key={key.name} value={key.name}>
                        {key.name}{key.default ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Collections Loading */}
                {/* TODO: Add isFetchingCollections state */}
                {/* <div className="text-center py-8">...</div> */}

                {/* No API Key Selected */}
                {/* TODO: Add selectedKeyName state */}
                {/* <div className="text-center py-8">...</div> */}

                {/* Collections Grid */}
                {/* TODO: Add postmanCollections, selectedCollectionIds, and related logic */}
                {/* <div>...</div> */}

                {/* No Collections Found */}
                {/* <div className="text-center py-8">...</div> */}
              </div>

              {/* Import Status Messages */}
              {/* TODO: Add importStatus, importError, and related logic */}
            </div>
          </section>
        )}
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <section>
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-xl font-semibold mb-6">API Keys Management</h2>

              {/* Existing API Keys */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-3">Your Postman API Keys</h3>
                {/* Empty State */}
                {apiKeys.length === 0 && (
                  <div className="text-center py-8 border rounded-md border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys configured</h3>
                    <p className="mt-1 text-sm text-gray-500">Add a key below to get started.</p>
                  </div>
                )}
                {/* API Keys Table */}
                {apiKeys.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Key</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {apiKeys.map(key => (
                          <tr key={key.name} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{key.name}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-gray-500 font-mono text-xs">{key.key.substring(0, 12) + '...'}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {key.default && (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Default</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                              {!key.default && (
                                <button
                                  onClick={() => {/* TODO: set default key */}}
                                  className="text-blue-600 hover:text-blue-900 hover:underline"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => handleApiKeyDelete(key.name)}
                                className="text-red-600 hover:text-red-900 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add New API Key */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium mb-3">Add New API Key</h3>
                <form onSubmit={e => { e.preventDefault(); /* TODO: add API key */ }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                      <input
                        type="text"
                        id="key-name"
                        // value and onChange for newKey.name
                        placeholder="e.g., Work, Personal"
                        className="form-input"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">A name to identify this API key</p>
                    </div>
                    <div>
                      <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">Postman API Key</label>
                      <input
                        type="password"
                        id="api-key"
                        // value and onChange for newKey.key
                        placeholder="PMAK-xxxx..."
                        className="form-input"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Your Postman API key from your Postman account</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="set-default"
                      // checked and onChange for newKey.setDefault
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="set-default" className="ml-2 block text-sm text-gray-700">Set as default key</label>
                  </div>
                  <div>
                    <button
                      type="submit"
                      // disabled logic for isAddingKey, newKey.name, newKey.key
                      className="btn btn-primary flex items-center"
                    >
                      {/* isAddingKey spinner */}
                      <span>Add API Key</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Instructions */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium mb-3">How to Get Your Postman API Key</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                    <li>Log in to your <a href="https://www.postman.com" target="_blank" className="text-blue-600 hover:text-blue-800 underline">Postman account</a></li>
                    <li>Click on your profile icon in the top-right corner</li>
                    <li>Select <strong>Settings</strong> from the dropdown menu</li>
                    <li>Go to the <strong>API Keys</strong> tab</li>
                    <li>Click <strong>Generate API Key</strong> and provide a name</li>
                    <li>Copy the generated key and paste it above</li>
                  </ol>
                  <p className="mt-4 text-sm text-gray-600">Your API key allows this application to access your Postman collections. The key is stored locally on your machine.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default IntegratorApp;