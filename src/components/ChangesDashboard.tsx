import React, { useEffect, useState } from 'react';
import { changesService } from '../services/api';
import { 
  Zap, 
  Plus, 
  Clock, 
  Minus, 
  BarChart3, 
  Download, 
  RefreshCw, 
  Filter,
  AlertCircle,
  Lock,
  Package,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  File,
  Loader2
} from 'lucide-react';
import ImpactAnalysisView from './ChangeImpactAnalysis';
import DisplaySnapshotDiff from './DisplaySnapshotDiff';

interface SnapshotDiffParams {
  pageSize?: number;
  page?: number;
  filterType?: string;
  sortOrder?: string;
}

interface Snapshot extends Array<number> {}

interface Change {
  change_type: 'added' | 'modified' | 'deleted';
  path: string;
  human_path: string;
  created_at: string;
  modification: string;
  endpoint_name: string;
}

interface Summary {
  changes_by_type: {
    added: number;
    modified: number;
    deleted: number;
  };
  affected_endpoints: any[];
}

interface TreeNode {
  name: string;
  type: string;
  change_count?: number;
  change_type?: string;
  children?: TreeNode[];
}

interface ImpactItem {
  change: { human_path: string };
  impact: string;
  suggestions?: string[];
}

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

export const ChangesDashboard: React.FC<{ collectionId: string }> = ({ collectionId }) => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'summary' |'history'| 'timeline' | 'hierarchy' | 'impact' | 'compare'>('summary');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Summary data
  const [summary, setSummary] = useState<Summary | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  
  const [hierarchy, setHierarchy] = useState<TreeNode | null>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [fetchingSnapshot, setFetchingSnapshot] = useState(false);

  useEffect(() => {
    if (collectionId) {
      loadSummaryData();
      loadRecentChanges();
      getCollectionSnapshots();
    }
  }, [collectionId]);

  useEffect(() => {
    switch (currentView) {
      case 'timeline':
        loadTimelineData();
        break;
      case 'hierarchy':
        loadHierarchyData();
        break;
      case 'impact':
        loadImpactAnalysis();
        break;
    }
  }, [currentView, selectedSnapshotId]);

  const getCollectionSnapshots = async () => {
    setFetchingSnapshot(true);
    setError(null);
    try {
      const response = await changesService.getCollectionSnapshots(collectionId);
      const snapshotData = response?.data || response;

      if (Array.isArray(snapshotData) && snapshotData.length > 0) {
        setSnapshot(snapshotData);
        setSelectedSnapshotId(snapshotData[0]);
      } else {
        setSnapshot([]);
        setSelectedSnapshotId(null);
        setError('No snapshots available for this collection');
      }
    } catch (err) {
      setError('Failed to load collection snapshots');
      setSnapshot([]);
      setSelectedSnapshotId(null);
    } finally {
      setFetchingSnapshot(false);
    }
  };

  const loadSummaryData = async () => {
    try {
      const data = await changesService.getSummary(collectionId);
      setSummary(data || null);
    } catch (err) {
      setError('Failed to load summary');
      setSummary(null);
    }
  };

  const loadRecentChanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (resourceFilter) params.append('resource', resourceFilter);
      if (pathFilter) params.append('path', pathFilter);
      
      const data = await changesService.getChanges(collectionId);
      setChanges(Array.isArray(data?.changes) ? data.changes : []);
    } catch (err) {
      setError('Failed to load changes');
      setChanges([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineData = async () => {
    // TODO: Implement timeline data loading
  };

  const loadHierarchyData = async () => {
    if (!selectedSnapshotId) {
      setError('No snapshot selected for hierarchy view');
      return;
    }

    try {
      const data = await changesService.getHierarchy(collectionId, selectedSnapshotId);
      setHierarchy(data || null);
    } catch (err) {
      setError('Failed to load hierarchy');
      setHierarchy(null);
    }
  };

  const loadImpactAnalysis = async () => {
    if (!selectedSnapshotId) {
      setError('No snapshot selected for impact analysis');
      return;
    }
    try {
      const data = await changesService.getImpactAnalysis(collectionId, selectedSnapshotId);
      setImpactData(data || null);
    } catch (err) {
      setError('Failed to load impact analysis');
      setImpactData(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
      return date.toLocaleDateString();
    } catch (err) {
      return 'Unknown time';
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderTreeNode = (node: TreeNode, level = 0): JSX.Element => {
    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const nodeId = `node-${node.name}-${level}`;
    const isExpanded = expandedNodes.has(nodeId);

    return (
      <div key={nodeId} className="select-none">
        <div 
          className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          {hasChildren && (
            <span className="mr-2 transition-transform duration-200">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          {!hasChildren && <span className="w-6" />}
          
          <span className="mr-2">
            {node.type === 'folder' ? 
              <FolderOpen className="h-4 w-4 text-blue-500" /> : 
              <File className="h-4 w-4 text-gray-400" />
            }
          </span>
          
          <span className="flex-1">{node.name || 'Unnamed'}</span>
          
          {node.change_count && (
            <span className="text-sm text-gray-500">({node.change_count} changes)</span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child, index) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4" />;
      case 'modified': return <Clock className="h-4 w-4" />;
      case 'deleted': return <Minus className="h-4 w-4" />;
      default: return null;
    }
  };

  const getChangeTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Safe getters for summary data
  const getAddedCount = () => summary?.changes_by_type?.added || 0;
  const getModifiedCount = () => summary?.changes_by_type?.modified || 0;
  const getDeletedCount = () => summary?.changes_by_type?.deleted || 0;
  const getAffectedEndpointsCount = () => Array.isArray(summary?.affected_endpoints) ? summary.affected_endpoints.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-black-500" />
              <h1 className="text-xl font-semibold text-gray-900">Changes Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Snapshot Selector */}
              {snapshot && Array.isArray(snapshot) && snapshot.length > 0 && (
                <select
                  value={selectedSnapshotId || ''}
                  onChange={(e) => setSelectedSnapshotId(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={fetchingSnapshot}
                >
                  <option value="">Select Snapshot</option>
                  {snapshot.map((id, index) => (
                    <option key={id} value={id}>
                      Snapshot {id} {index === 0 ? '(Latest)' : ''}
                    </option>
                  ))}
                </select>
              )}
              
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <Download className="h-4 w-4" />
                Export
              </button>
              
              <button 
                onClick={() => { 
                  loadSummaryData(); 
                  loadRecentChanges(); 
                  getCollectionSnapshots();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black-500 rounded-md hover:bg-black-600"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['summary', 'history', 'timeline', 'hierarchy', 'impact'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`py-4 border-b-2 font-medium text-sm capitalize transition-colors ${
                  currentView === view 
                    ? 'border-black-500 text-black-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {fetchingSnapshot && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading snapshots...</span>
          </div>
        )}

        {/* No Collection ID */}
        {!collectionId && !fetchingSnapshot && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Collection Selected</h3>
            <p>Please select a collection to view changes.</p>
          </div>
        )}

        {/* Summary View */}
        {currentView === 'summary' && !fetchingSnapshot && collectionId && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard
                icon={<Plus className="h-6 w-6" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                value={getAddedCount()}
                label="Added"
              />
              <SummaryCard
                icon={<Clock className="h-6 w-6" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                value={getModifiedCount()}
                label="Modified"
              />
              <SummaryCard
                icon={<Minus className="h-6 w-6" />}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                value={getDeletedCount()}
                label="Deleted"
              />
              <SummaryCard
                icon={<BarChart3 className="h-6 w-6" />}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                value={getAffectedEndpointsCount()}
                label="Endpoints Affected"
              />
            </div>

            {/* Recent Changes */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Changes</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Type:</label>
                    <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="added">Added</option>
                      <option value="modified">Modified</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Resource:</label>
                    <select 
                      value={resourceFilter}
                      onChange={(e) => setResourceFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Resources</option>
                      <option value="endpoint">Endpoints</option>
                      <option value="request">Requests</option>
                      <option value="response">Responses</option>
                      <option value="header">Headers</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Path:</label>
                    <input
                      type="text"
                      value={pathFilter}
                      onChange={(e) => setPathFilter(e.target.value)}
                      placeholder="Search path..."
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Changes List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : Array.isArray(changes) && changes.length > 0 ? (
                  changes.map((change, index) => (
                    <div key={index} className="px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getChangeTypeBadgeClass(change.change_type)}`}>
                          {change.change_type}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{change.endpoint_name || 'Unknown endpoint'}</div>
                          <div className="text-sm text-gray-600">{change.modification || 'Unknown content'}</div>
                          <div className="text-xs text-gray-500 mt-1">{formatTimestamp(change.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes Found</h3>
                    <p>There are no recent changes to display.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && !fetchingSnapshot && collectionId && (
          <DisplaySnapshotDiff 
            collectionId={collectionId}
            snapshotId={selectedSnapshotId}
          />
        )}

        {/* Timeline View */}
        {currentView === 'timeline' && !fetchingSnapshot && collectionId && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Change Timeline</h2>
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="p-8">
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline Coming Soon</h3>
                  <p>Timeline chart will be rendered here</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy View */}
        {currentView === 'hierarchy' && !fetchingSnapshot && collectionId && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Change Hierarchy</h2>
              <div className="flex items-center gap-3">
                {!selectedSnapshotId && (
                  <span className="text-sm text-red-600">Please select a snapshot</span>
                )}
                <button
                  onClick={() => setExpandedNodes(new Set())}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Collapse All
                </button>
                <button
                  onClick={() => {
                    if (hierarchy) {
                      const getAllNodeIds = (node: TreeNode): string[] => {
                        const ids = [`node-${node.name}`];
                        if (node.children && Array.isArray(node.children)) {
                          node.children.forEach(child => {
                            ids.push(...getAllNodeIds(child));
                          });
                        }
                        return ids;
                      };
                      setExpandedNodes(new Set(getAllNodeIds(hierarchy)));
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Expand All
                </button>
              </div>
            </div>
            <div className="p-4">
              {selectedSnapshotId ? (
                hierarchy ? (
                  renderTreeNode(hierarchy)
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading hierarchy...</span>
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Snapshot Selected</h3>
                  <p>Please select a snapshot to view the hierarchy</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Impact Analysis View */}
        {currentView === 'impact' && !fetchingSnapshot && collectionId && (
          <>
            {selectedSnapshotId ? (
              impactData ? (
                <ImpactAnalysisView impactData={impactData} />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading impact analysis...</span>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Snapshot Selected</h3>
                  <p>Please select a snapshot to view impact analysis</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// Summary Card Component
const SummaryCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
}> = ({ icon, iconBg, iconColor, value, label }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <div className="text-3xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

export default ChangesDashboard;