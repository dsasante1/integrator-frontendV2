import React, { useEffect, useState, useRef } from 'react';
import { snapshotService } from '../services/api';
import { Loader2, XCircle, ChevronDown, ChevronRight, Folder, FileText, Hash } from 'lucide-react';

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
    item: Array<any>;
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const endpointRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const scrollToEndpoint = (endpointId: string, folderId?: string) => {
    // Expand the folder if it's not already expanded
    if (folderId && !expandedFolders.has(folderId)) {
      setExpandedFolders(prev => new Set([...prev, folderId]));
    }
    
    // Set active endpoint for highlighting
    setActiveEndpoint(endpointId);
    
    // Wait for the DOM to update if we just expanded a folder
    setTimeout(() => {
      const element = endpointRefs.current[endpointId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Remove highlight after 2 seconds
        setTimeout(() => setActiveEndpoint(null), 2000);
      }
    }, folderId ? 100 : 0);
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

  const getMethodBadgeClassesMini = (method: string) => {
    switch (method.toUpperCase()) {
      case 'PATCH':
        return 'bg-amber-100 text-amber-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'GET':
        return 'bg-green-100 text-green-700';
      case 'POST':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEndpointBorderColor = (name: string) => {
    return name.toLowerCase().includes('admin') ? 'border-t-orange-500' : 'border-t-green-500';
  };

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

  const renderMinimapItems = (items: any[], parentFolderId?: string, level: number = 0) => {
    return items.map(item => {
      if (item.item && Array.isArray(item.item)) {
        // This is a folder
        const isExpanded = expandedFolders.has(item.id);
        return (
          <div key={item.id} className={`${level > 0 ? 'ml-3' : ''}`}>
            <div 
              className="flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => toggleFolder(item.id)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Folder className="h-3 w-3 text-indigo-600" />
              <span className="text-gray-700 font-medium">{item.name}</span>
            </div>
            {isExpanded && (
              <div className="ml-2">
                {renderMinimapItems(item.item, item.id, level + 1)}
              </div>
            )}
          </div>
        );
      } else if (item.request) {
        // This is an endpoint
        return (
          <div 
            key={item.id} 
            className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer ${level > 0 ? 'ml-5' : 'ml-2'} ${
              activeEndpoint === item.id ? 'bg-indigo-100' : ''
            }`}
            onClick={() => scrollToEndpoint(item.id, parentFolderId)}
          >
            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${getMethodBadgeClassesMini(item.request.method)}`}>
              {item.request.method}
            </span>
            <span className="text-sm text-gray-600 truncate flex-1">{item.name}</span>
          </div>
        );
      }
      return null;
    });
  };

  const renderEndpoint = (endpoint: any, isNested: boolean = false) => {
    if (!endpoint.request) return null;

    const isCollapsed = collapsedSections.has(endpoint.id);
    const borderColor = getEndpointBorderColor(endpoint.name);
    const isActive = activeEndpoint === endpoint.id;
    
    return (
      <div 
        key={endpoint.id}
        ref={el => endpointRefs.current[endpoint.id] = el}
        className={`bg-white rounded-2xl p-8 mb-8 shadow-xl border-t-4 ${borderColor} ${isNested ? 'ml-8' : ''} ${
          isActive ? 'ring-4 ring-indigo-400 ring-opacity-50' : ''
        } transition-all duration-300`}
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
              {endpoint.request.url.variable.map((variable: { key: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; value: any; }, idx: React.Key | null | undefined) => (
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
                            .filter((h: { key: string; }) => ['Content-Type', 'Content-Length', 'Date', 'ETag'].includes(h.key))
                            .map((header: { key: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; value: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }, idx: React.Key | null | undefined) => (
                              <div key={idx} className="bg-gray-50 p-2 rounded text-sm border-l-2 border-gray-400">
                                <span className="font-semibold text-gray-700">{header.key}:</span>{' '}
                                <span className="text-gray-600 font-mono text-xs break-all">{header.value}</span>
                              </div>
                            ))}
                        </div>
                        
                        {/* Rate Limiting Info */}
                        {endpoint.response[0].header.some((h: { key: string; }) => h.key.startsWith('RateLimit')) && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-3">
                            <strong className="text-blue-900">Rate Limiting:</strong><br />
                            {endpoint.response[0].header.find((h: { key: string; }) => h.key === 'RateLimit-Policy') && (
                              <span>Policy: {endpoint.response[0].header.find((h: { key: string; }) => h.key === 'RateLimit-Policy')?.value}<br /></span>
                            )}
                            {endpoint.response[0].header.find((h: { key: string; }) => h.key === 'RateLimit-Limit') && (
                              <span>
                                Limit: {endpoint.response[0].header.find((h: { key: string; }) => h.key === 'RateLimit-Limit')?.value} | 
                                Remaining: {endpoint.response[0].header.find((h: { key: string; }) => h.key === 'RateLimit-Remaining')?.value} | 
                                Reset: {endpoint.response[0].header.find((h: { key: string; }) => h.key === 'RateLimit-Reset')?.value} seconds
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
  };

  const renderItems = (items: any[], isNested: boolean = false) => {
    return items.map(item => {
      // Check if this is a folder (has nested items) or an endpoint (has request)
      if (item.item && Array.isArray(item.item)) {
        // This is a folder
        const isExpanded = expandedFolders.has(item.id);
        const folderEndpointCount = countEndpoints(item.item);
        
        return (
          <div key={item.id} className={`${isNested ? 'ml-8' : ''}`}>
            <div 
              className="bg-white rounded-lg p-4 mb-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => toggleFolder(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-600" /> : <ChevronRight className="h-5 w-5 text-gray-600" />}
                  <Folder className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <span className="text-sm text-gray-500">({folderEndpointCount} endpoints)</span>
                </div>
              </div>
            </div>
            
            {isExpanded && (
              <div className="mb-4">
                {renderItems(item.item, true)}
              </div>
            )}
          </div>
        );
      } else if (item.request) {
        // This is an endpoint
        return renderEndpoint(item, isNested);
      }
      
      return null;
    });
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

  // Calculate total endpoints across all items
  const totalEndpoints = snapshot.items.reduce((total, item) => {
    return total + (item.item ? countEndpoints(item.item) : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-5">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
              <h1 className="text-white text-4xl font-bold mb-3">
                {snapshot.collection_name || 'API Endpoints'}
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

            {/* Collections and Endpoints */}
            {snapshot.items.map(collection => {
              if (!collection.item || collection.item.length === 0) {
                return (
                  <div key={collection.id} className="bg-white rounded-2xl p-8 mb-8 shadow-xl">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">{collection.name}</h2>
                    <p className="text-gray-500 italic">No endpoints available in this collection</p>
                  </div>
                );
              }

              return (
                <div key={collection.id}>
                  <div className="bg-white/90 rounded-lg p-4 mb-4 shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="h-6 w-6 text-indigo-600" />
                      {collection.name}
                    </h2>
                  </div>
                  {renderItems(collection.item)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimap Navigation */}
        <div className="w-80 bg-white/95 h-screen sticky top-0 overflow-y-auto shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Hash className="h-5 w-5 text-indigo-600" />
              API Navigation
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalEndpoints} endpoints
            </p>
          </div>
          
          <div className="p-4">
            {snapshot.items.map(collection => {
              if (!collection.item || collection.item.length === 0) {
                return (
                  <div key={collection.id} className="mb-4">
                    <div className="text-sm text-gray-500 italic p-2">{collection.name} (empty)</div>
                  </div>
                );
              }
              
              return (
                <div key={collection.id} className="mb-4">
                  <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    {collection.name}
                  </div>
                  {renderMinimapItems(collection.item)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndPointDetails;