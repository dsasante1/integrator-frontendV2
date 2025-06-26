import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { collectionService } from '../services/api';

interface Collection {
  id: string;
  user_id: string;
  name: string;
  first_seen: string;
  last_seen: string;
}

interface PostmanCollection {
  id: string;
  name: string;
  description?: string;
  requests: number;
}

interface ImportCollectionProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onCollectionImported?: (collection: Collection) => void;
}

export interface ImportCollectionRef {
  fetchPostmanCollections: () => Promise<void>;
  refreshCollections: () => Promise<void>;
}

const ImportCollection = forwardRef<ImportCollectionRef, ImportCollectionProps>((props, ref) => {
  const {
    isLoading,
    setIsLoading,
    addNotification,
    onCollectionImported,
  } = props;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [postmanCollections, setPostmanCollections] = useState<PostmanCollection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [isFetchingCollections, setIsFetchingCollections] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addNotification('info', `Selected file: ${file.name}`);
    }
  };

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
          
          if (!content.info || !content.info._postman_id || !content.info.name) {
            addNotification('error', 'Invalid Postman collection file format');
            return;
          }

          await collectionService.saveCollection(content.info._postman_id, content.info.name);
          addNotification('success', 'Collection imported successfully');
          setSelectedFile(null);
          
          if (onCollectionImported) {
            const newCollection: Collection = {
              id: content.info._postman_id,
              name: content.info.name,
              user_id: '', 
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString()
            };
            onCollectionImported(newCollection);
          }
          
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

  const fetchPostmanCollections = async () => {
    setIsFetchingCollections(true);
    setImportError('');
    try {
      const collections = await collectionService.getCollections();
      setPostmanCollections(collections);
    } catch (error) {

      const errorMessage = 'Failed to fetch collections from Postman API';
      setImportError(errorMessage);
      setPostmanCollections([]);
    } finally {
      setIsFetchingCollections(false);
    }
  };


  const handleCollectionToggle = (collectionId: string) => {
    const newSelected = new Set(selectedCollectionIds);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollectionIds(newSelected);
  };

  const handleBulkImport = async () => {
    if (selectedCollectionIds.size === 0) {
      addNotification('warning', 'Please select at least one collection to import');
      return;
    }

    setImportStatus('importing');
    setIsLoading(true);
    
    try {
      const selectedCollections = postmanCollections.filter(col => 
        selectedCollectionIds.has(col.id)
      );
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const collection of selectedCollections) {
        try {
          await collectionService.saveCollection(collection.id, collection.name);
          successCount++;
          
          if (onCollectionImported) {
            const newCollection: Collection = {
              id: collection.id,
              name: collection.name,
              user_id: '',
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString()
            };
            onCollectionImported(newCollection);
          }
        } catch (error) {
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        addNotification('success', 
          `Successfully imported ${successCount} collection${successCount > 1 ? 's' : ''}`
        );
      }
      
      if (errorCount > 0) {
        addNotification('error', 
          `Failed to import ${errorCount} collection${errorCount > 1 ? 's' : ''}`
        );
      }
      

      setSelectedCollectionIds(new Set());
      setImportStatus(errorCount === 0 ? 'success' : 'error');
      
    } catch (error) {
      addNotification('error', 'Failed to import selected collections');
      setImportStatus('error');
    } finally {
      setIsLoading(false);
 
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };


  useImperativeHandle(ref, () => ({
    fetchPostmanCollections,
    refreshCollections: fetchPostmanCollections
  }));


  useEffect(() => {
    fetchPostmanCollections();
  }, []);

  return (
    <section>
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-semibold mb-6">Import API Collections</h2>
        {/* TODO from the backend */}
        {/* File Upload Section */}
        {/* <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Upload Collection File</h3>
          <p className="text-sm text-gray-600 mb-4">Upload a Postman collection JSON file to import it into the system.</p>
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
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md shadow transition-colors duration-200 flex items-center"
              >
                {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                <span>{isLoading ? 'Importing...' : 'Import Collection'}</span>
              </button>
            </div>
          </form>
        </div> */}

        {/* Import from Postman API */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Available Collections from Postman API</h3>
            <button
              onClick={fetchPostmanCollections}
              disabled={isFetchingCollections}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md shadow transition-colors duration-200 flex items-center"
            >
              {isFetchingCollections && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              <span>{isFetchingCollections ? 'Fetching...' : 'Refresh Collections'}</span>
            </button>
          </div>

          {/* Collections Loading */}
          {isFetchingCollections && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto" />
              <p className="mt-2 text-gray-600">Fetching API collections...</p>
            </div>
          )}

          {/* Collections Grid */}
          {!isFetchingCollections && postmanCollections.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {postmanCollections.length} collection(s) found
                  {selectedCollectionIds.size > 0 && ` • ${selectedCollectionIds.size} selected`}
                </p>
                {selectedCollectionIds.size > 0 && (
                  <button
                    onClick={handleBulkImport}
                    disabled={importStatus === 'importing'}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md shadow transition-colors duration-200 flex items-center"
                  >
                    {importStatus === 'importing' && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    <span>{importStatus === 'importing' ? 'Importing...' : `Import Selected (${selectedCollectionIds.size})`}</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postmanCollections.map(collection => (
                  <div
                    key={collection.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedCollectionIds.has(collection.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleCollectionToggle(collection.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{collection.name}</h3>
                        {collection.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{collection.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-400">{collection.requests} requests</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedCollectionIds.has(collection.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCollectionToggle(collection.id);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Collections Found */}
          {!isFetchingCollections && postmanCollections.length === 0 && !importError && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
              <p className="mt-1 text-sm text-gray-500">Try refreshing or check your API key configuration.</p>
            </div>
          )}

          {/* Import Status Messages */}
          {importError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{importError}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

ImportCollection.displayName = 'ImportCollection';

export default ImportCollection;