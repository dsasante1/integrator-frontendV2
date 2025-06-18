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

//TODO move this to the snapshots view. so that when two snapshots are selected then the analysis is rendered

interface Snapshot extends Array<number> {}

interface ChangeDetail {
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
}

interface ChangeWithImpact {
  change: ChangeDetail;
  impact: string;
  severity: 'breaking' | 'security' | 'data' | 'low';
  suggestions?: string[];
}

interface CompareData {
  collection_id: string;
  snapshot_id: number;
  breaking_changes: ChangeWithImpact[];
  security_changes: ChangeWithImpact[];
  data_changes: ChangeWithImpact[];
  cosmetic_changes: ChangeWithImpact[];
  summary: {
    total_breaking: number;
    total_security: number;
    total_data: number;
    total_cosmetic: number;
    risk_score: number;
    recommendation: string;
  };
}


export const CompareSnapshots: React.FC<{ collectionId: string }> = ({ collectionId }) => {
    const [compareData, setCompareData] = useState<CompareData | null>(null);
const [compareSnapshot1, setCompareSnapshot1] = useState<number | null>(null);
const [compareSnapshot2, setCompareSnapshot2] = useState<number | null>(null);
const [error, setError] = useState<string | null>(null);
const [compareLoading, setCompareLoading] = useState(false);
const [activeChangeTab, setActiveChangeTab] = useState<'breaking' | 'security' | 'data' | 'cosmetic'>('breaking');


const loadCompareSnapshots = async () => {
  if (!compareSnapshot1 || !compareSnapshot2) {
    setError('Please select both snapshots to compare');
    return;
  }

  if (compareSnapshot1 === compareSnapshot2) {
    setError('Please select different snapshots to compare');
    return;
  }

  setCompareLoading(true);
  try {
    const data = await changesService.compareSnapshots(
      collectionId, 
      compareSnapshot1, 
      compareSnapshot2
    );
    setCompareData(data);
    setError(null);
  } catch (err) {
    setError('Failed to compare snapshots');
    setCompareData(null);
  } finally {
    setCompareLoading(false);
  }
};

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
return (
    <div className="space-y-6">
    {/* Snapshot Selector */}
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Compare Snapshots</h2>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From Snapshot:</label>
            <select 
              value={compareSnapshot1 || ''}
              onChange={(e) => setCompareSnapshot1(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Snapshot</option>
              {snapshot && snapshot.map((id, index) => (
                <option key={id} value={id}>
                  Snapshot {id} {index === 0 ? '(Latest)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To Snapshot:</label>
            <select 
              value={compareSnapshot2 || ''}
              onChange={(e) => setCompareSnapshot2(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select Snapshot</option>
              {snapshot && snapshot.map((id, index) => (
                <option key={id} value={id}>
                  Snapshot {id} {index === 0 ? '(Latest)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={loadCompareSnapshots}
            disabled={!compareSnapshot1 || !compareSnapshot2 || compareLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {compareLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing...
              </span>
            ) : (
              'Compare'
            )}
          </button>
        </div>

        {!compareData && !compareLoading && (
          <div className="text-gray-500 text-center py-8">
            Select two snapshots to compare changes between them
          </div>
        )}
      </div>
    </div>

    {/* Comparison Results */}
    {compareData && (
      <>
        {/* Risk Assessment Summary */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
              <p className="text-sm text-gray-600 mt-1">{compareData.summary.recommendation}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {compareData.summary.risk_score.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
              activeChangeTab === 'breaking' ? 'border-red-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveChangeTab('breaking')}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {compareData.summary.total_breaking}
                </div>
                <div className="text-sm text-gray-600">Breaking Changes</div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
              activeChangeTab === 'security' ? 'border-orange-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveChangeTab('security')}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {compareData.summary.total_security}
                </div>
                <div className="text-sm text-gray-600">Security Changes</div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
              activeChangeTab === 'data' ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveChangeTab('data')}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {compareData.summary.total_data}
                </div>
                <div className="text-sm text-gray-600">Data Changes</div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
              activeChangeTab === 'cosmetic' ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveChangeTab('cosmetic')}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {compareData.summary.total_cosmetic}
                </div>
                <div className="text-sm text-gray-600">Cosmetic Changes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Changes List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeChangeTab.charAt(0).toUpperCase() + activeChangeTab.slice(1)} Changes
            </h3>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {(() => {
              const changes = compareData[`${activeChangeTab}_changes`] as ChangeWithImpact[];
              
              if (changes.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    No {activeChangeTab} changes found
                  </div>
                );
              }

              return changes.map((item, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getChangeTypeBadgeClass(item.change.change_type)}`}>
                          {item.change.change_type}
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="font-medium text-gray-900">{item.change.path}</div>
                          <div className="text-sm text-gray-600">{item.change.human_path}</div>
                          {item.change.endpoint_name && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.change.endpoint_name} • {item.change.resource_type}
                            </div>
                          )}
                        </div>

                        {/* Impact */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              item.severity === 'breaking' ? 'text-red-500' :
                              item.severity === 'security' ? 'text-orange-500' :
                              item.severity === 'data' ? 'text-blue-500' :
                              'text-green-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">Impact:</p>
                              <p className="text-sm text-gray-600">{item.impact}</p>
                            </div>
                          </div>
                        </div>

                        {/* Suggestions */}
                        {item.suggestions && item.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {item.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Modification Details */}
                        {item.change.modification && item.change.modification !== '' && (
                          <div className="mt-3">
                            <details className="group">
                              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                                View modification details
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                                {(() => {
                                  try {
                                    // Try to parse and format JSON
                                    const parsed = JSON.parse(item.change.modification);
                                    return JSON.stringify(parsed, null, 2);
                                  } catch {
                                    // If not JSON, return as-is
                                    return item.change.modification;
                                  }
                                })()}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </>
    )}
  </div>
)
}
export default CompareSnapshots;