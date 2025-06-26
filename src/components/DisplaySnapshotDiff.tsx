import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  Edit3,
  Search,
  Loader2,
  Eye,
  Copy,
  ArrowLeft,
  ArrowRight,
  GitCompare,
  ChevronDown,
  ChevronRight,
  Hash,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';

import { changesService } from '../services/api';

interface DiffDetail {
  id: number;
  collection_id: string;
  old_snapshot_id: number;
  new_snapshot_id: number;
  change_type: 'added' | 'deleted' | 'modified';
  path: string;
  modification: string;
  created_at: string;
  human_path: string;
  path_segments: string[];
  endpoint_name?: string;
  resource_type: 'request' | 'response' | 'endpoint' | 'collection';
  old_value: any;
  new_value: any;
}

interface DiffResponse {
  old_snapshot_id: number;
  new_snapshot_id: number;
  collection_id: string;
  changes: DiffDetail[];
  summary: {
    total_changes: number;
    changes_by_type: {
      added: number;
      deleted: number;
      modified: number;
    };
    affected_endpoints: string[];
  };
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_more: boolean;
  };
  groups?: Array<{
    name: string;
    count: number;
    changes: DiffDetail[];
    expanded: boolean;
  }>;
}

interface DisplaySnapshotDiffProps {
  collectionId: string;
  snapshotId: number | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const DisplaySnapshotDiff: React.FC<DisplaySnapshotDiffProps> = ({ 
  collectionId,
  snapshotId,
}) => {
  const [diffData, setDiffData] = useState<DiffResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'added' | 'deleted' | 'modified'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'endpoint' | 'type'>('endpoint');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  

  const [selectedChange, setSelectedChange] = useState<DiffDetail | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

const fetchDiffData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    if(!snapshotId){
        setError('No snapshots available for this collection');
        return
    }

    const params = new URLSearchParams({
      search: debouncedSearchTerm,
      filter_type: filterType,
      group_by: groupBy,
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    const response = await changesService.getSnapshotDiff(collectionId, snapshotId, params);
    
    if (!response) {
      throw new Error('Failed to fetch diff data');
    }
    
    setDiffData(response);
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
}, [collectionId, snapshotId, debouncedSearchTerm, filterType, groupBy, page, pageSize]);


useEffect(() => {
  fetchDiffData();
}, [fetchDiffData]);


useEffect(() => {
  if (diffData && diffData.changes.length > 0 && !selectedChange) {
    setSelectedChange(diffData.changes[0]);
  }
}, [diffData, selectedChange]);


useEffect(() => {
  setSelectedChange(null);
  setPage(1);
}, [debouncedSearchTerm, filterType, groupBy]);
  const getChangeIcon = useCallback((type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'deleted': return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified': return <Edit3 className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  }, []);

  const getChangeTypeBadgeClass = useCallback((type: string) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800 border-green-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      case 'modified': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getResourceIcon = useCallback((type: string) => {
    switch (type) {
    case 'request': return '📨';     
    case 'response': return '📬';    
    case 'endpoint': return '🌐';     
    case 'collection': return '🗂️';  
    default: return '📄';         

    }
  }, []);

  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

  const navigateChange = useCallback((direction: 'prev' | 'next') => {
    if (!diffData || !selectedChange) return;
    
    const currentIndex = diffData.changes.findIndex(c => c.id === selectedChange.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedChange(diffData.changes[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < diffData.changes.length - 1) {
      setSelectedChange(diffData.changes[currentIndex + 1]);
    }
  }, [diffData, selectedChange]);

  if (loading && !diffData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading snapshot changes...</p>
          <p className="text-sm text-gray-500">Analyzing differences between snapshots</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium text-red-800">Unable to load changes</p>
          <p className="text-sm mt-2 text-red-600">{error}</p>
          <button 
            onClick={fetchDiffData} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!diffData) {
    return null;
  }

  const currentChangeIndex = selectedChange 
    ? diffData.changes.findIndex(c => c.id === selectedChange.id) 
    : -1;

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitCompare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Snapshot Comparison
                </h2>
                <p className="text-sm text-gray-600">
                  Snapshot {diffData.old_snapshot_id} → {diffData.new_snapshot_id} • {diffData.summary.total_changes} changes
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{diffData.summary.total_changes}</p>
              <p className="text-sm text-gray-500">Total Changes</p>
            </div>
          </div>

          {/* Affected Endpoints */}
          {diffData.summary.affected_endpoints.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Affected Endpoints:</p>
              <div className="flex flex-wrap gap-2">
                {diffData.summary.affected_endpoints.map((endpoint, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700"
                  >
                    {endpoint}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {diffData.changes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-6 text-green-400" />
            <p className="text-xl font-medium text-gray-700 mb-2">No changes detected</p>
            <p className="text-gray-500">This snapshot is identical to the previous one</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Changes List */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Changes {diffData.pagination && `(${diffData.pagination.total_items} total)`}
                </h3>
                
                {/* Controls */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search changes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All ({diffData.summary.total_changes})</option>
                      <option value="added">Added ({diffData.summary.changes_by_type.added || 0})</option>
                      <option value="modified">Modified ({diffData.summary.changes_by_type.modified || 0})</option>
                      <option value="deleted">Deleted ({diffData.summary.changes_by_type.deleted || 0})</option>
                    </select>
                    
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">No grouping</option>
                      <option value="endpoint">By endpoint</option>
                      <option value="type">By change type</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-[700px] overflow-y-auto">
                {diffData.groups && groupBy !== 'none' ? (
                  // Grouped view
                  diffData.groups.map((group) => (
                    <div key={group.name}>
                      <div 
                        className="px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleGroup(group.name)}
                      >
                        <span className="font-medium text-gray-700">{group.name} ({group.count})</span>
                        {expandedGroups.has(group.name) ? 
                          <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                      
                      {expandedGroups.has(group.name) && group.changes.map((change) => (
                        <ChangeItem
                          key={change.id}
                          change={change}
                          isSelected={selectedChange?.id === change.id}
                          onClick={() => setSelectedChange(change)}
                          getChangeIcon={getChangeIcon}
                          getChangeTypeBadgeClass={getChangeTypeBadgeClass}
                          getResourceIcon={getResourceIcon}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  // Flat view
                  diffData.changes.map((change) => (
                    <ChangeItem
                      key={change.id}
                      change={change}
                      isSelected={selectedChange?.id === change.id}
                      onClick={() => setSelectedChange(change)}
                      getChangeIcon={getChangeIcon}
                      getChangeTypeBadgeClass={getChangeTypeBadgeClass}
                      getResourceIcon={getResourceIcon}
                    />
                  ))
                )}

                {diffData.changes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No changes match your filters</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {diffData.pagination && diffData.pagination.total_pages > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {diffData.pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(diffData.pagination!.total_pages, p + 1))}
                      disabled={!diffData.pagination.has_more}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diff Viewer */}
          <div className="xl:col-span-3">
            {selectedChange ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getResourceIcon(selectedChange.resource_type)}</span>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {selectedChange.endpoint_name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="capitalize">{selectedChange.resource_type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(selectedChange.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 text-sm font-medium rounded-lg border ${getChangeTypeBadgeClass(selectedChange.change_type)}`}>
                        {selectedChange.change_type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigateChange('prev')}
                        disabled={currentChangeIndex === 0}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      
                      <span className="text-sm font-medium text-gray-700">
                        {currentChangeIndex + 1} of {diffData.changes.length}
                      </span>
                      
                      <button
                        onClick={() => navigateChange('next')}
                        disabled={currentChangeIndex === diffData.changes.length - 1}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <DiffContent
                    change={selectedChange}
                    formatValue={formatValue}
                    copyToClipboard={copyToClipboard}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-xl font-medium text-gray-700 mb-2">Select a change to view details</p>
                  <p className="text-gray-500">Click on any change in the list to see the detailed diff comparison</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Change Item Component
const ChangeItem: React.FC<{
  change: DiffDetail;
  isSelected: boolean;
  onClick: () => void;
  getChangeIcon: (type: string) => JSX.Element | null;
  getChangeTypeBadgeClass: (type: string) => string;
  getResourceIcon: (type: string) => string;
}> = ({ change, isSelected, onClick, getChangeIcon, getChangeTypeBadgeClass, getResourceIcon }) => {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getChangeIcon(change.change_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getChangeTypeBadgeClass(change.change_type)}`}>
              {change.change_type.toUpperCase()}
            </span>
            <span className="text-xs">{getResourceIcon(change.resource_type)}</span>
          </div>
          
          <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
            {change.human_path}
          </div>
          
          <div className="text-xs text-gray-600">
            {change.endpoint_name || 'Collection'} • {change.resource_type}
          </div>
        </div>
      </div>
    </div>
  );
};

// Diff Content Component
const DiffContent: React.FC<{
  change: DiffDetail;
  formatValue: (value: any) => string;
  copyToClipboard: (text: string) => void;
}> = ({ change, formatValue, copyToClipboard }) => {
  const getValuePreview = (value: any, maxLength: number = 100): string => {
    const str = formatValue(value);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  const isLargeValue = (value: any): boolean => {
    const str = formatValue(value);
    return str.length > 1000;
  };

  if (change.change_type === 'modified') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Minus className="h-4 w-4 text-red-500" />
                Before (Snapshot {change.old_snapshot_id})
              </h4>
              <button
                onClick={() => copyToClipboard(formatValue(change.old_value))}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            
            <ValueDisplay
              value={change.old_value}
              type="old"
              formatValue={formatValue}
              isLargeValue={isLargeValue}
              getValuePreview={getValuePreview}
            />
          </div>

          {/* After */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Plus className="h-4 w-4 text-green-500" />
                After (Snapshot {change.new_snapshot_id})
              </h4>
              <button
                onClick={() => copyToClipboard(formatValue(change.new_value))}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            
            <ValueDisplay
              value={change.new_value}
              type="new"
              formatValue={formatValue}
              isLargeValue={isLargeValue}
              getValuePreview={getValuePreview}
            />
          </div>
        </div>
      </div>
    );
  }

  // Added or Deleted
  const value = change.change_type === 'added' ? change.new_value : change.old_value;
  const colorClass = change.change_type === 'added' ? 'green' : 'red';
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {change.change_type === 'added' ? (
          <>
            <Plus className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold text-green-800">Added Value</h4>
          </>
        ) : (
          <>
            <Minus className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-800">Deleted Value</h4>
          </>
        )}
        <button
          onClick={() => copyToClipboard(formatValue(value))}
          className={`ml-auto p-1 text-${colorClass}-600 hover:text-${colorClass}-800 rounded`}
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      
      <ValueDisplay
        value={value}
        type={change.change_type === 'added' ? 'new' : 'old'}
        formatValue={formatValue}
        isLargeValue={isLargeValue}
        getValuePreview={getValuePreview}
      />
    </div>
  );
};

const ValueDisplay: React.FC<{
  value: any;
  type: 'old' | 'new';
  formatValue: (value: any) => string;
  isLargeValue: (value: any) => boolean;
  getValuePreview: (value: any, maxLength?: number) => string;
}> = ({ value, type, formatValue, isLargeValue, getValuePreview }) => {
  const colorClass = type === 'new' ? 'green' : 'red';
  
  return (
    <div className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg overflow-hidden`}>
      {isLargeValue(value) ? (
        <div className="p-4">
          <div className={`flex items-center gap-2 text-${colorClass}-700 mb-3`}>
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Large Value ({formatValue(value).length} characters)</span>
          </div>
          <details className="group">
            <summary className={`cursor-pointer text-${colorClass}-600 hover:text-${colorClass}-800 font-medium`}>
              Click to expand full content
            </summary>
            <pre className={`mt-3 text-sm text-${colorClass}-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto bg-${colorClass}-100 p-3 rounded`}>
              {formatValue(value)}
            </pre>
          </details>
          <div className={`mt-3 p-3 bg-${colorClass}-100 rounded`}>
            <p className={`text-sm text-${colorClass}-700 font-medium`}>Preview:</p>
            <pre className={`text-sm text-${colorClass}-800 whitespace-pre-wrap font-mono`}>
              {getValuePreview(value, 200)}
            </pre>
          </div>
        </div>
      ) : (
        <pre className={`p-4 text-sm text-${colorClass}-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto`}>
          {formatValue(value)}
        </pre>
      )}
    </div>
  );
};

export default DisplaySnapshotDiff;