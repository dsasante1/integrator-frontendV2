import React, { useState } from 'react';
import { AlertCircle, Lock, Package, ChevronDown, ChevronUp, AlertTriangle, FileText, Zap, Code, Database, Shield, Clock, Hash, GitBranch, TrendingUp, Plus, Minus, Edit, Circle } from 'lucide-react';

interface ImpactItem {
  change: { human_path: string };
  impact: string;
  suggestions?: string[];
}


// Main response interface
export interface ImpactAnalysisResponse {
  collection_id: string;
  snapshot_id: number;
  breaking_changes: ChangeItem[];
  security_changes: ChangeItem[];
  data_changes: ChangeItem[];
  cosmetic_changes: CosmeticChangeItem[];
  summary: Summary;
}

// Change item interface (for breaking, security, and data changes)
export interface ChangeItem {
  change: Change;
  impact: string;
  severity: Severity;
  suggestions?: string[];
}

// Cosmetic change item interface
export interface CosmeticChangeItem {
  change: Change;
  impact: string;
  severity: 'low';
}

// Change details interface
export interface Change {
  id: number;
  collection_id: string;
  old_snapshot_id: number;
  new_snapshot_id: number;
  change_type: ChangeType;
  path: string;
  modification: string;
  created_at: string;
  human_path: string;
  path_segments: string[];
  endpoint_name?: string;
  resource_type: ResourceType;
}

// Summary interface
export interface Summary {
  total_breaking: number;
  total_security: number;
  total_data: number;
  total_cosmetic: number;
  risk_score: number;
  recommendation: string;
}

// Enum types
export enum ChangeType {
  Added = 'added',
  Deleted = 'deleted',
  Modified = 'modified'
}

export enum Severity {
  Breaking = 'breaking',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  Data = 'data'
}

export enum ResourceType {
  Request = 'request',
  Response = 'response',
  Endpoint = 'endpoint',
  Collection = 'collection'
}

// Additional interfaces for masked values (if needed)
export interface MaskedValue {
  masked: string;
  path: string;
  type: MaskType;
}

export enum MaskType {
  Password = 'password',
  Email = 'email',
  Token = 'token'
}

// Stats interface (referenced in the response)
export interface Stats {
  masked_values: Record<string, MaskedValue>;
  fields_masked: number;
  masked_field_types: {
    password: number;
    email: number;
    token?: number;
  };
  processing_time: number;
  values_masked: number;
}

// Extended response with additional metadata (if needed)
export interface ExtendedImpactAnalysisResponse extends ImpactAnalysisResponse {
  masking_id?: string;
  masked_at?: string;
  stats?: Stats;
}

// Helper type for grouping changes by endpoint
export type ChangesByEndpoint = Record<string, {
  breaking: ChangeItem[];
  security: ChangeItem[];
  data: ChangeItem[];
  cosmetic: CosmeticChangeItem[];
}>;

// Helper function type definitions
export interface ImpactAnalysisHelpers {
  getRiskLevel: (score: number) => 'Low Risk' | 'Medium Risk' | 'High Risk';
  getRiskColor: (score: number) => string;
  getSeverityColor: (severity: Severity) => string;
  getChangeTypeIcon: (changeType: ChangeType) => string;
  groupChangesByEndpoint: (response: ImpactAnalysisResponse) => ChangesByEndpoint;
  filterChangesBySeverity: (changes: ChangeItem[], severity: Severity) => ChangeItem[];
  countTotalChanges: (response: ImpactAnalysisResponse) => number;
}

// Request/Response interfaces for API calls
export interface GetImpactAnalysisRequest {
  collection_id: string;
  old_snapshot_id: number;
  new_snapshot_id: number;
}

export interface GetImpactAnalysisParams {
  collectionId: string;
  snapshotId: number;
}

// Error response interface
export interface ImpactAnalysisError {
  error: string;
  message: string;
  status_code: number;
}

// Modification parsing interfaces
export interface ParsedModification {
  raw?: string;
  parsed?: any;
  isHash?: boolean;
  hashValue?: string;
}

// Path segment parsing
export interface ParsedPath {
  collection?: boolean;
  itemIndex?: number;
  property?: string;
  subProperties?: string[];
}

// Change impact assessment
export interface ImpactAssessment {
  requiresCodeChange: boolean;
  requiresDocumentationUpdate: boolean;
  requiresVersioning: boolean;
  backwardCompatible: boolean;
  affectedClients: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
}

// Filter and sort options
export interface ImpactAnalysisFilters {
  severities?: Severity[];
  changeTypes?: ChangeType[];
  resourceTypes?: ResourceType[];
  endpoints?: string[];
  searchTerm?: string;
}

export interface ImpactAnalysisSortOptions {
  field: 'severity' | 'changeType' | 'endpoint' | 'createdAt';
  direction: 'asc' | 'desc';
}

const ImpactCard: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  items: ImpactItem[];
  borderColor: string; 
}> = ({ title, count, icon, bgColor, textColor, items, borderColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItemExpansion = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getSeverityColor = (severity: any) => {
    switch (severity) {
      case 'breaking':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getChangeTypeIcon = (changeType: any) => {
    switch (changeType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'deleted':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${borderColor} overflow-hidden`}>
      <div className={`p-6 ${bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${bgColor} ${textColor}`}>
              {icon}
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
              <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-full hover:bg-white/20 transition-colors ${textColor}`}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isExpanded && items.length > 0 && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getChangeTypeIcon(item.change.change_type)}
                    <span className="ml-2 font-medium text-gray-800">
                      {item.change.endpoint_name || 'Collection Level'}
                    </span>
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                      {item.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.impact}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Code className="h-3 w-3 mr-1" />
                    <span className="font-mono">{item.change.path}</span>
                  </div>

                  <button
                    onClick={() => toggleItemExpansion(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    {expandedItems[index] ? 'Hide Details' : 'Show Details'}
                    {expandedItems[index] ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                  </button>
                </div>
              </div>

              {expandedItems[index] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-1">Human Readable Path:</h5>
                      <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border border-gray-200">
                        {item.change.human_path}
                      </p>
                    </div>
                    
                    {item.change.modification && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">Modification:</h5>
                        <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                          {typeof item.change.modification === 'string' 
                            ? item.change.modification.startsWith('<<hash:') 
                              ? 'Large content (hash provided)'
                              : JSON.stringify(JSON.parse(item.change.modification), null, 2)
                            : JSON.stringify(item.change.modification, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {item.suggestions && item.suggestions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">Suggestions:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {item.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-600">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>Resource Type: {item.change.resource_type}</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Created: {new Date(item.change.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Summary Dashboard Component
const SummaryDashboard = ({ summary }) => {
  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Impact Analysis Summary</h2>
      
      <div className="flex justify-center items-center mb-10">
        <div className="grid grid-cols-3 gap-16 max-w-4xl">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
              <span className="text-4xl font-bold text-gray-800">{summary.total_breaking}</span>
            </div>
            <p className="text-base text-gray-600">Breaking Changes</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Lock className="h-8 w-8 text-yellow-500 mr-2" />
              <span className="text-4xl font-bold text-gray-800">{summary.total_security}</span>
            </div>
            <p className="text-base text-gray-600">Security Changes</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-8 w-8 text-blue-500 mr-2" />
              <span className="text-4xl font-bold text-gray-800">{summary.total_data}</span>
            </div>
            <p className="text-base text-gray-600">Data Changes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const ImpactAnalysisView = ({ impactData } ) => {
  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      {impactData.summary && <SummaryDashboard summary={impactData.summary} />}

      {/* Main Impact Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ImpactCard
          title="Breaking Changes"
          count={impactData.breaking_changes.length}
          icon={<AlertCircle className="h-5 w-5" />}
          bgColor="bg-red-100"
          textColor="text-red-800"
          borderColor="border-red-300"
          items={impactData.breaking_changes}
        />
        <ImpactCard
          title="Security Changes"
          count={impactData.security_changes.length}
          icon={<Lock className="h-5 w-5" />}
          bgColor="bg-yellow-100"
          textColor="text-yellow-800"
          borderColor="border-yellow-300"
          items={impactData.security_changes}
        />
        <ImpactCard
          title="Data Structure Changes"
          count={impactData.data_changes.length}
          icon={<Package className="h-5 w-5" />}
          bgColor="bg-blue-100"
          textColor="text-blue-800"
          borderColor="border-blue-300"
          items={impactData.data_changes}
        />
      </div>

      {/* Metadata */}
      <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <GitBranch className="h-4 w-4 mr-2" />
            <span>Collection ID: {impactData.collection_id}</span>
          </div>
          <div className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            <span>Snapshot ID: {impactData.snapshot_id}</span>
          </div>
          <div className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            <span>Total Changes: {impactData.breaking_changes.length + impactData.security_changes.length + impactData.data_changes.length + impactData.cosmetic_changes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ImpactAnalysisView;