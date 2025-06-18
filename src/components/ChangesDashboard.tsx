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

interface Change {
  change_type: 'added' | 'modified' | 'deleted';
  path: string;
  human_path: string;
  created_at: string;
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

export const ChangesDashboard: React.FC<{ collectionId: string }> = ({ collectionId }) => {
 const [currentView, setCurrentView] = useState<'summary' | 'timeline' | 'hierarchy' | 'impact' | 'compare'>('summary');
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
  
  // Other views data
  const [hierarchy, setHierarchy] = useState<TreeNode | null>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSummaryData();
    loadRecentChanges();
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
  }, [currentView]);

  const loadSummaryData = async () => {
    try {
      const data = await changesService.getSummary(collectionId);
      setSummary(data);
    } catch (err) {
      setError('Failed to load summary');
    }
  };

  const loadRecentChanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (resourceFilter) params.append('resource', resourceFilter);
      if (pathFilter) params.append('path', pathFilter);
      
      const data = await changesService.getChanges(collectionId, params);
      setChanges(data.changes);
    } catch (err) {
      setError('Failed to load changes');
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineData = async () => {
    // Implementation for timeline data
  };

  const loadHierarchyData = async () => {
    try {
      const data = await changesService.getHierarchy(collectionId);
      setHierarchy(data);
    } catch (err) {
      setError('Failed to load hierarchy');
    }
  };

  const loadImpactAnalysis = async () => {
    try {
      const data = await changesService.getImpactAnalysis(collectionId);
      setImpactData(data);
    } catch (err) {
      setError('Failed to load impact analysis');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
    return date.toLocaleDateString();
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
    const hasChildren = node.children && node.children.length > 0;
    const nodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
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
          
          <span className="flex-1">{node.name}</span>
          
          {node.change_count && (
            <span className="text-sm text-gray-500">({node.change_count} changes)</span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
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
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-orange-500" />
              <h1 className="text-xl font-semibold text-gray-900">Changes Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option>Auth API Collection</option>
                <option>User Service API</option>
                <option>Payment Gateway API</option>
              </select>
              
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <Download className="h-4 w-4" />
                Export
              </button>
              
              <button 
                onClick={() => { loadSummaryData(); loadRecentChanges(); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
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
            {(['summary', 'timeline', 'hierarchy', 'impact', 'compare'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`py-4 border-b-2 font-medium text-sm capitalize transition-colors ${
                  currentView === view 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary View */}
        {currentView === 'summary' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard
                icon={<Plus className="h-6 w-6" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                value={summary?.changes_by_type.added || 0}
                label="Added"
              />
              <SummaryCard
                icon={<Clock className="h-6 w-6" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                value={summary?.changes_by_type.modified || 0}
                label="Modified"
              />
              <SummaryCard
                icon={<Minus className="h-6 w-6" />}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                value={summary?.changes_by_type.deleted || 0}
                label="Deleted"
              />
              <SummaryCard
                icon={<BarChart3 className="h-6 w-6" />}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                value={summary?.affected_endpoints.length || 0}
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
                ) : (
                  changes.map((change, index) => (
                    <div key={index} className="px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getChangeTypeBadgeClass(change.change_type)}`}>
                          {change.change_type}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{change.path}</div>
                          <div className="text-sm text-gray-600">{change.human_path}</div>
                          <div className="text-xs text-gray-500 mt-1">{formatTimestamp(change.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {currentView === 'timeline' && (
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
                Timeline chart would be rendered here
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy View */}
        {currentView === 'hierarchy' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Change Hierarchy</h2>
              <button
                onClick={() => setExpandedNodes(new Set())}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Expand All
              </button>
            </div>
            <div className="p-4">
              {hierarchy && renderTreeNode(hierarchy)}
            </div>
          </div>
        )}

        {/* Impact Analysis View */}
        {currentView === 'impact' && impactData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ImpactCard
              title="Breaking Changes"
              count={impactData.breaking_changes.length}
              icon={<AlertCircle className="h-5 w-5" />}
              bgColor="bg-red-100"
              textColor="text-red-800"
              items={impactData.breaking_changes}
            />
            <ImpactCard
              title="Security Changes"
              count={impactData.security_changes.length}
              icon={<Lock className="h-5 w-5" />}
              bgColor="bg-yellow-100"
              textColor="text-yellow-800"
              items={impactData.security_changes}
            />
            <ImpactCard
              title="Data Structure Changes"
              count={impactData.data_changes.length}
              icon={<Package className="h-5 w-5" />}
              bgColor="bg-blue-100"
              textColor="text-blue-800"
              items={impactData.data_changes}
            />
          </div>
        )}

        {/* Compare View */}
        {currentView === 'compare' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Compare Snapshots</h2>
            </div>
            <div className="p-8">
              <div className="flex gap-8 mb-8">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">From Snapshot:</label>
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>2025-06-16 10:00 AM</option>
                    <option>2025-06-15 02:30 PM</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">To Snapshot:</label>
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>2025-06-16 06:00 PM (Latest)</option>
                    <option>2025-06-16 02:00 PM</option>
                  </select>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600">
                  Compare
                </button>
              </div>
              <div className="text-gray-500 text-center">
                Comparison results will appear here
              </div>
            </div>
          </div>
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

// Impact Card Component
const ImpactCard: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  items: ImpactItem[];
}> = ({ title, count, icon, bgColor, textColor, items }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className={`px-6 py-4 ${bgColor} ${textColor} flex items-center gap-2`}>
      {icon}
      <span className="font-semibold">{title} ({count})</span>
    </div>
    <div className="p-6">
      {items.map((item, index) => (
        <div key={index} className="py-3 border-b border-gray-200 last:border-0">
          <div className="font-medium text-gray-900">{item.change.human_path}:</div>
          <div className="text-sm text-gray-700">{item.impact}</div>
          {item.suggestions && item.suggestions[0] && (
            <div className="text-sm text-gray-500 mt-1">{item.suggestions[0]}</div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default ChangesDashboard;