import React, { useEffect, useState } from 'react';
import { snapshotService } from '../services/api';
import { Loader2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface EndPointDetail {
  collection_id: string;
  collection_name: string;
  filters_applied: {
    Fields: string;
    Search: string;
    ItemType: string;
    Depth: string;
  };
  items: Array<{
    id: string;
    name: string;
    item: Array<{
      id: string;
      name: string;
      request: {
        url: {
          raw: string;
          host: string[];
          path: string[];
          variable?: Array<{ key: string; value: string }>;
        };
        auth?: {
          type: string;
          bearer?: Array<{ key: string; value: string }>;
        };
        method: string;
        description?: string;
      };
      response?: Array<{
        body: string;
        code: number;
        status: string;
        header: Array<{ key: string; value: string }>;
      }>;
    }>;
  }>;
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  snapshot_id: string;
}

const EndPointDetails: React.FC<{ snapshotId: string; collectionId: string; search: string }> = ({ 
  snapshotId, 
  collectionId, 
  search 
}) => {
  const [snapshot, setEndPoint] = useState<EndPointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEndPoint = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await snapshotService.getEndPointDetails(snapshotId, collectionId, search);
        setEndPoint(response.data || response);
      } catch (err: any) {
        setError(err.message || 'Failed to load endpoint details');
      } finally {
        setLoading(false);
      }
    };
    if (snapshotId) fetchEndPoint();
  }, [snapshotId, collectionId, search]);

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const formatUrl = (url: string) => {
    const parts = url.split('/');
    return parts.map((part, index) => {
      if (part.startsWith(':')) {
        return <span key={index} className="text-amber-400 bg-amber-400/10 px-1 rounded">{part}</span>;
      }
      return <span key={index}>{part}{index < parts.length - 1 ? '/' : ''}</span>;
    });
  };

  const getMethodBadgeClasses = (method: string) => {
    switch (method.toUpperCase()) {
      case 'PATCH':
        return 'bg-amber-50 text-amber-800 border-2 border-amber-300';
      case 'DELETE':
        return 'bg-red-50 text-red-800 border-2 border-red-300';
      case 'GET':
        return 'bg-green-50 text-green-800 border-2 border-green-300';
      case 'POST':
        return 'bg-blue-50 text-blue-800 border-2 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-800 border-2 border-gray-300';
    }
  };

  const getEndpointBorderColor = (name: string) => {
    return name.toLowerCase().includes('admin') ? 'border-t-orange-500' : 'border-t-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
          <span className="text-gray-600 text-lg">Loading endpoint details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-red-600">
          <XCircle className="h-12 w-12 mb-2" />
          <span className="text-lg">{error}</span>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  // Helper function to count all endpoints recursively
  const countEndpoints = (items: any[]): number => {
    return items.reduce((total, item) => {
      if (item.request && item.request.method) {
        // This is an endpoint
        return total + 1;
      } else if (item.item && Array.isArray(item.item)) {
        // This is a folder with nested items
        return total + countEndpoints(item.item);
      }
      return total;
    }, 0);
  };

  // Helper function to collect all endpoints recursively
  const collectEndpoints = (items: any[]): any[] => {
    const endpoints: any[] = [];
    
    items.forEach(item => {
      if (item.request && item.request.method) {
        // This is an endpoint
        endpoints.push(item);
      } else if (item.item && Array.isArray(item.item)) {
        // This is a folder with nested items
        endpoints.push(...collectEndpoints(item.item));
      }
    });
    
    return endpoints;
  };

  // Calculate total endpoints across all items
  const totalEndpoints = snapshot.items.reduce((total, item) => {
    return total + (item.item ? countEndpoints(item.item) : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h1 className="text-white text-4xl font-bold mb-3">
            {snapshot.items[0]?.name || 'API Endpoints'}
          </h1>
          <p className="text-white/80 text-lg">API Documentation</p>
        </div>

        {/* Collection Meta */}
        <div className="bg-white/95 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-600">
              <h3 className="text-gray-800 font-semibold mb-2">Collection Name</h3>
              <p className="text-gray-600">{snapshot.collection_name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-600">
              <h3 className="text-gray-800 font-semibold mb-2">Collection ID</h3>
              <p className="text-gray-600 font-mono text-sm break-all">{snapshot.collection_id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-600">
              <h3 className="text-gray-800 font-semibold mb-2">Total Items</h3>
              <p className="text-gray-600">{snapshot.items.length} collection with {totalEndpoints} endpoints</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-600">
              <h3 className="text-gray-800 font-semibold mb-2">Snapshot ID</h3>
              <p className="text-gray-600">{snapshot.snapshot_id}</p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        {snapshot.items.map(collection => {
          // Check if collection has item array and it's not empty
          if (!collection.item || collection.item.length === 0) {
            return (
              <div key={collection.id} className="bg-white rounded-2xl p-8 mb-8 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{collection.name}</h2>
                <p className="text-gray-500 italic">No endpoints available in this collection</p>
              </div>
            );
          }

          // Collect all endpoints from nested structure
          const allEndpoints = collectEndpoints(collection.item);

          if (allEndpoints.length === 0) {
            return (
              <div key={collection.id} className="bg-white rounded-2xl p-8 mb-8 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{collection.name}</h2>
                <p className="text-gray-500 italic">No endpoints found in nested structure</p>
              </div>
            );
          }

          return allEndpoints.map(endpoint => {
            // Safety check for endpoint structure
            if (!endpoint.request) {
              return null;
            }

            const isCollapsed = collapsedSections.has(endpoint.id);
            const borderColor = getEndpointBorderColor(endpoint.name);
            
            return (
              <div 
                key={endpoint.id} 
                className={`bg-white rounded-2xl p-8 mb-8 shadow-xl border-t-4 ${borderColor}`}
              >
                {/* Endpoint Header */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${getMethodBadgeClasses(endpoint.request.method)}`}>
                    {endpoint.request.method}
                  </span>
                  <h2 className="text-2xl font-semibold text-gray-800 flex-1 capitalize">
                    {endpoint.name}
                  </h2>
                  <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    ID: {endpoint.id}
                  </span>
                </div>

                {/* URL */}
                <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-gray-200 mb-6 border-l-4 border-indigo-600 overflow-x-auto">
                  {formatUrl(endpoint.request.url.raw)}
                </div>

                {/* Description */}
                {endpoint.request.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                      Description
                    </h3>
                    <div className="text-gray-600 bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
                      {endpoint.request.description.split('\n')[0]}
                    </div>
                  </div>
                )}

                {/* Authentication */}
                {endpoint.request.auth && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                      Authentication
                    </h3>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex justify-between">
                        <span><strong>Type:</strong> {endpoint.request.auth.type === 'bearer' ? 'Bearer Token' : endpoint.request.auth.type}</span>
                        {endpoint.request.auth.bearer && endpoint.request.auth.bearer[0] && (
                          <span><strong>Token:</strong> {endpoint.request.auth.bearer[0].value}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Variables */}
                {endpoint.request.url.variable && endpoint.request.url.variable.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                      URL Variables
                    </h3>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      {endpoint.request.url.variable.map((variable, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-amber-200 last:border-b-0">
                          <span className="font-semibold text-amber-800 font-mono">{variable.key}</span>
                          <span className="text-amber-800 font-mono bg-white px-2 py-1 rounded text-sm">
                            {variable.value || '(empty)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                                  {/* Request Body */}
                  {endpoint.request.body && endpoint.request.body.raw && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                        Request Body
                      </h3>
                      <pre className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{endpoint.request.body.raw}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                {endpoint.response && endpoint.response.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                      Response Example
                    </h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <div className="bg-gray-200 p-4 border-b border-gray-300">
                        <div className="flex flex-wrap gap-4 items-center">
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {endpoint.response[0].code} {endpoint.response[0].status}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <pre className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{endpoint.response[0].body}
                        </pre>
                        
                        {/* Response Headers */}
                        {endpoint.response[0].header && endpoint.response[0].header.length > 0 && (
                          <div className="mt-4">
                            <h4 
                              className="flex items-center gap-2 cursor-pointer select-none text-gray-700 hover:text-indigo-600 transition-colors"
                              onClick={() => toggleCollapse(endpoint.id)}
                            >
                              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              Response Headers
                            </h4>
                            {!isCollapsed && (
                              <div className="mt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {endpoint.response[0].header
                                    .filter(h => ['Content-Type', 'Content-Length', 'Date', 'ETag'].includes(h.key))
                                    .map((header, idx) => (
                                      <div key={idx} className="bg-gray-50 p-2 rounded text-sm border-l-2 border-gray-400">
                                        <span className="font-semibold text-gray-700">{header.key}:</span>{' '}
                                        <span className="text-gray-600 font-mono text-xs break-all">{header.value}</span>
                                      </div>
                                    ))}
                                </div>
                                
                                {/* Rate Limiting Info */}
                                {endpoint.response[0].header.some(h => h.key.startsWith('RateLimit')) && (
                                  <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-3">
                                    <strong className="text-blue-900">Rate Limiting:</strong><br />
                                    {endpoint.response[0].header.find(h => h.key === 'RateLimit-Policy') && (
                                      <span>Policy: {endpoint.response[0].header.find(h => h.key === 'RateLimit-Policy')?.value}<br /></span>
                                    )}
                                    {endpoint.response[0].header.find(h => h.key === 'RateLimit-Limit') && (
                                      <span>
                                        Limit: {endpoint.response[0].header.find(h => h.key === 'RateLimit-Limit')?.value} | 
                                        Remaining: {endpoint.response[0].header.find(h => h.key === 'RateLimit-Remaining')?.value} | 
                                        Reset: {endpoint.response[0].header.find(h => h.key === 'RateLimit-Reset')?.value} seconds
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                      Response
                    </h3>
                    <div className="text-gray-500 italic text-center p-5 bg-gray-50 rounded-lg">
                      No response data available for this endpoint
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default EndPointDetails;