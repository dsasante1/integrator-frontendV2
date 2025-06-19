import React, { useState, useEffect } from 'react';
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
  Zap,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';

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
}

interface DisplaySnapshotDiffProps {
  diffData: DiffResponse | null;
  loading?: boolean;
  error?: string | null;
}

export const DisplaySnapshotDiff: React.FC<DisplaySnapshotDiffProps> = ({ 
  diffData,
  loading = false,
  error = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'added' | 'deleted' | 'modified'>('all');
  const [selectedChange, setSelectedChange] = useState<DiffDetail | null>(null);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'none' | 'endpoint' | 'type'>('endpoint');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Reset when diffData changes
  useEffect(() => {
    if (diffData && diffData.changes.length > 0) {
      setSelectedChange(diffData.changes[0]);
      setCurrentChangeIndex(0);
    } else {
      setSelectedChange(null);
      setCurrentChangeIndex(0);
    }
    setSearchTerm('');
    setFilterType('all');
  }, [diffData]);

  const filteredChanges = diffData?.changes.filter(change => {
    const matchesSearch = searchTerm === '' || 
      change.human_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (change.endpoint_name && change.endpoint_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || change.change_type === filterType;
    
    return matchesSearch && matchesFilter;
  }) || [];

  const groupedChanges = () => {
    if (groupBy === 'none') return { 'All Changes': filteredChanges };
    
    const groups: Record<string, DiffDetail[]> = {};
    
    filteredChanges.forEach(change => {
      let key: string;
      if (groupBy === 'endpoint') {
        key = change.endpoint_name || 'Collection Level';
      } else {
        key = change.change_type.charAt(0).toUpperCase() + change.change_type.slice(1);
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(change);
    });
    
    return groups;
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'deleted': return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified': return <Edit3 className="h-4 w-4 text-yellow-600" />;
      default: return <Zap className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800 border-green-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      case 'modified': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'request': return '📤';
      case 'response': return '📥';
      case 'endpoint': return '🔗';
      case 'collection': return '📁';
      default: return '📄';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const isLargeValue = (value: any): boolean => {
    const str = formatValue(value);
    return str.length > 1000;
  };

  const getValuePreview = (value: any, maxLength: number = 100): string => {
    const str = formatValue(value);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  const navigateChange = (direction: 'prev' | 'next') => {
    const currentIndex = filteredChanges.findIndex(c => c.id === selectedChange?.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedChange(filteredChanges[currentIndex - 1]);
      setCurrentChangeIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < filteredChanges.length - 1) {
      setSelectedChange(filteredChanges[currentIndex + 1]);
      setCurrentChangeIndex(currentIndex + 1);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getChangeImpact = (change: DiffDetail) => {
    if (change.change_type === 'added' && change.resource_type === 'endpoint') {
      return { level: 'info', message: 'New endpoint added to collection' };
    }
    if (change.change_type === 'deleted' && change.resource_type === 'endpoint') {
      return { level: 'warning', message: 'Endpoint removed from collection' };
    }
    if (change.path.includes('url') || change.path.includes('method')) {
      return { level: 'warning', message: 'API contract change detected' };
    }
    if (change.path.includes('body') || change.path.includes('header')) {
      return { level: 'info', message: 'Request/response data updated' };
    }
    return { level: 'low', message: 'Minor change detected' };
  };

  // Loading State
  if (loading) {
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

  // Error State
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium text-red-800">Unable to load changes</p>
          <p className="text-sm mt-2 text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!diffData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
        <div className="text-center">
          <GitCompare className="h-16 w-16 mx-auto mb-6 text-gray-300" />
          <p className="text-xl font-medium text-gray-700 mb-2">Ready to compare snapshots</p>
          <p className="text-gray-500">Select a snapshot from the dropdown above to view its changes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Bar */}
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
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Plus className="h-8 w-8 text-green-600 bg-green-100 rounded-lg p-2" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{diffData.summary.changes_by_type.added}</p>
                  <p className="text-sm text-green-700">Added</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Edit3 className="h-8 w-8 text-yellow-600 bg-yellow-100 rounded-lg p-2" />
                <div>
                  <p className="text-2xl font-bold text-yellow-900">{diffData.summary.changes_by_type.modified}</p>
                  <p className="text-sm text-yellow-700">Modified</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Minus className="h-8 w-8 text-red-600 bg-red-100 rounded-lg p-2" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{diffData.summary.changes_by_type.deleted}</p>
                  <p className="text-sm text-red-700">Deleted</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-blue-600 bg-blue-100 rounded-lg p-2" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{diffData.summary.affected_endpoints.length}</p>
                  <p className="text-sm text-blue-700">Endpoints</p>
                </div>
              </div>
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
          {/* Enhanced Changes List */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Changes ({filteredChanges.length})</h3>
                
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
                      <option value="all">All ({diffData.changes.length})</option>
                      <option value="added">Added ({diffData.summary.changes_by_type.added})</option>
                      <option value="modified">Modified ({diffData.summary.changes_by_type.modified})</option>
                      <option value="deleted">Deleted ({diffData.summary.changes_by_type.deleted})</option>
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
                {Object.entries(groupedChanges()).map(([groupName, changes]) => (
                  <div key={groupName}>
                    {groupBy !== 'none' && (
                      <div 
                        className="px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleSection(groupName)}
                      >
                        <span className="font-medium text-gray-700">{groupName} ({changes.length})</span>
                        {expandedSections.has(groupName) ? 
                          <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                    )}
                    
                    {(groupBy === 'none' || expandedSections.has(groupName)) && changes.map((change, index) => {
                      const impact = getChangeImpact(change);
                      return (
                        <div
                          key={change.id}
                          onClick={() => {
                            setSelectedChange(change);
                            setCurrentChangeIndex(filteredChanges.findIndex(c => c.id === change.id));
                          }}
                          className={`px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedChange?.id === change.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
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
                              
                              <div className="text-xs text-gray-600 mb-2">
                                {change.endpoint_name || 'Collection'} • {change.resource_type}
                              </div>
                              
                              {/* Value preview */}
                              {change.change_type === 'modified' && (
                                <div className="text-xs bg-gray-100 rounded p-2 mt-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="font-medium text-red-700">Old:</span>
                                      <div className="text-red-600 truncate">{getValuePreview(change.old_value, 30)}</div>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">New:</span>
                                      <div className="text-green-600 truncate">{getValuePreview(change.new_value, 30)}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Impact indicator */}
                              <div className={`mt-2 flex items-center gap-1 text-xs ${
                                impact.level === 'warning' ? 'text-yellow-600' : 
                                impact.level === 'info' ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {impact.level === 'warning' ? <AlertTriangle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                                <span>{impact.message}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {filteredChanges.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No changes match your filters</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Diff Viewer */}
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
                          {selectedChange.human_path}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{selectedChange.endpoint_name || 'Collection Level'}</span>
                        <span>•</span>
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
                        {currentChangeIndex + 1} of {filteredChanges.length}
                      </span>
                      
                      <button
                        onClick={() => navigateChange('next')}
                        disabled={currentChangeIndex === filteredChanges.length - 1}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-100"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      <Hash className="h-4 w-4" />
                      Technical Details
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {selectedChange.change_type === 'modified' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Before */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Minus className="h-4 w-4 text-red-500" />
                              Before (Snapshot {diffData.old_snapshot_id})
                            </h4>
                            <button
                              onClick={() => copyToClipboard(formatValue(selectedChange.old_value))}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                            {isLargeValue(selectedChange.old_value) ? (
                              <div className="p-4">
                                <div className="flex items-center gap-2 text-red-700 mb-3">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="font-medium">Large Value ({formatValue(selectedChange.old_value).length} characters)</span>
                                </div>
                                <details className="group">
                                  <summary className="cursor-pointer text-red-600 hover:text-red-800 font-medium">
                                    Click to expand full content
                                  </summary>
                                  <pre className="mt-3 text-sm text-red-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto bg-red-100 p-3 rounded">
                                    {formatValue(selectedChange.old_value)}
                                  </pre>
                                </details>
                                <div className="mt-3 p-3 bg-red-100 rounded">
                                  <p className="text-sm text-red-700 font-medium">Preview:</p>
                                  <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                                    {getValuePreview(selectedChange.old_value, 200)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <pre className="p-4 text-sm text-red-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                                {formatValue(selectedChange.old_value)}
                              </pre>
                            )}
                          </div>
                        </div>

                        {/* After */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Plus className="h-4 w-4 text-green-500" />
                              After (Snapshot {diffData.new_snapshot_id})
                            </h4>
                            <button
                              onClick={() => copyToClipboard(formatValue(selectedChange.new_value))}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                            {isLargeValue(selectedChange.new_value) ? (
                              <div className="p-4">
                                <div className="flex items-center gap-2 text-green-700 mb-3">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="font-medium">Large Value ({formatValue(selectedChange.new_value).length} characters)</span>
                                </div>
                                <details className="group">
                                  <summary className="cursor-pointer text-green-600 hover:text-green-800 font-medium">
                                    Click to expand full content
                                  </summary>
                                  <pre className="mt-3 text-sm text-green-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto bg-green-100 p-3 rounded">
                                    {formatValue(selectedChange.new_value)}
                                  </pre>
                                </details>
                                <div className="mt-3 p-3 bg-green-100 rounded">
                                  <p className="text-sm text-green-700 font-medium">Preview:</p>
                                  <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono">
                                    {getValuePreview(selectedChange.new_value, 200)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <pre className="p-4 text-sm text-green-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                                {formatValue(selectedChange.new_value)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        {selectedChange.change_type === 'added' ? (
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
                      </div>
                      
                      <div className={`${
                        selectedChange.change_type === 'added' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      } border rounded-lg overflow-hidden`}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium ${
                              selectedChange.change_type === 'added' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {selectedChange.change_type === 'added' ? 'New Value:' : 'Removed Value:'}
                            </span>
                            <button
                              onClick={() => copyToClipboard(formatValue(
                                selectedChange.change_type === 'added' ? selectedChange.new_value : selectedChange.old_value
                              ))}
                              className={`p-1 rounded ${
                                selectedChange.change_type === 'added' 
                                  ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                                  : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                              }`}
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {isLargeValue(selectedChange.change_type === 'added' ? selectedChange.new_value : selectedChange.old_value) ? (
                            <div>
                              <div className={`flex items-center gap-2 mb-3 ${
                                selectedChange.change_type === 'added' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">
                                  Large Value ({formatValue(selectedChange.change_type === 'added' ? selectedChange.new_value : selectedChange.old_value).length} characters)
                                </span>
                              </div>
                              
                              <details className="group">
                                <summary className={`cursor-pointer font-medium ${
                                  selectedChange.change_type === 'added' 
                                    ? 'text-green-600 hover:text-green-800' 
                                    : 'text-red-600 hover:text-red-800'
                                }`}>
                                  Click to expand full content
                                </summary>
                                <pre className={`mt-3 text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto p-3 rounded ${
                                  selectedChange.change_type === 'added' 
                                    ? 'text-green-800 bg-green-100' 
                                    : 'text-red-800 bg-red-100'
                                }`}>
                                  {formatValue(selectedChange.change_type === 'added' ? selectedChange.new_value : selectedChange.old_value)}
                                </pre>
                              </details>
                              
                              <div className={`mt-3 p-3 rounded ${
                                selectedChange.change_type === 'added' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                <p className={`text-sm font-medium ${
                                  selectedChange.change_type === 'added' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  Preview:
                                </p>
                                <pre className={`text-sm whitespace-pre-wrap font-mono ${
                                  selectedChange.change_type === 'added' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  {getValuePreview(selectedChange.change_type === 'added' ? selectedChange.new_value : selectedChange.old_value, 300)}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <pre className={`text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto ${
                              selectedChange.change_type === 'added' ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {formatValue(selectedChange.change_type === 'added' ? selectedChange.new_value : selectedChange.old_value)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  {showTechnicalDetails && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Technical Details
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Change Information</p>
                            <div className="mt-2 space-y-1">
                              <div><span className="text-gray-600">ID:</span> <code className="bg-gray-200 px-1 rounded">{selectedChange.id}</code></div>
                              <div><span className="text-gray-600">Type:</span> <span className="font-medium">{selectedChange.change_type}</span></div>
                              <div><span className="text-gray-600">Resource:</span> <span className="font-medium">{selectedChange.resource_type}</span></div>
                              <div><span className="text-gray-600">Created:</span> {new Date(selectedChange.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-700">Path Information</p>
                            <div className="mt-2 space-y-1">
                              <div><span className="text-gray-600">Technical Path:</span></div>
                              <code className="block bg-gray-200 p-2 rounded text-xs break-all">{selectedChange.path}</code>
                              <div><span className="text-gray-600">Path Segments:</span></div>
                              <div className="flex flex-wrap gap-1">
                                {selectedChange.path_segments.map((segment, index) => (
                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {segment}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {selectedChange.modification && (
                          <div className="mt-4">
                            <p className="font-medium text-gray-700 mb-2">Raw Modification Data</p>
                            <details className="group">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Show raw modification string
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto border">
                                {selectedChange.modification}
                              </pre>
                            </details>
                          </div>
                        )}
                        
                        {/* Value metadata */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedChange.old_value !== null && selectedChange.old_value !== undefined && (
                            <div>
                              <p className="font-medium text-gray-700">Old Value Metadata</p>
                              <div className="mt-1 text-xs text-gray-600">
                                <div>Type: {typeof selectedChange.old_value}</div>
                                <div>Size: {formatValue(selectedChange.old_value).length} characters</div>
                                {typeof selectedChange.old_value === 'object' && selectedChange.old_value !== null && (
                                  <div>Keys: {Object.keys(selectedChange.old_value).length}</div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {selectedChange.new_value !== null && selectedChange.new_value !== undefined && (
                            <div>
                              <p className="font-medium text-gray-700">New Value Metadata</p>
                              <div className="mt-1 text-xs text-gray-600">
                                <div>Type: {typeof selectedChange.new_value}</div>
                                <div>Size: {formatValue(selectedChange.new_value).length} characters</div>
                                {typeof selectedChange.new_value === 'object' && selectedChange.new_value !== null && (
                                  <div>Keys: {Object.keys(selectedChange.new_value).length}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                  <p className="text-xl font-medium text-gray-700 mb-2">Select a change to view details</p>
                  <p className="text-gray-500">Click on any change in the list to see the detailed diff comparison</p>
                  
                  {filteredChanges.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedChange(filteredChanges[0]);
                        setCurrentChangeIndex(0);
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View First Change
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplaySnapshotDiff;