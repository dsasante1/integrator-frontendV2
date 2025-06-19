import React, { useState } from 'react';
import { AlertCircle, Lock, Package, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Minus, Edit, Circle, Code, Shield, Clock, GitBranch, Database, Zap } from 'lucide-react';

// Interface definitions (keeping all the existing interfaces)
interface ImpactItem {
  change: { human_path: string };
  impact: string;
  suggestions?: string[];
}

export interface ImpactAnalysisResponse {
  collection_id: string;
  snapshot_id: number;
  breaking_changes: ChangeItem[];
  security_changes: ChangeItem[];
  data_changes: ChangeItem[];
  cosmetic_changes: CosmeticChangeItem[];
  summary: Summary;
}

export interface ChangeItem {
  change: Change;
  impact: string;
  severity: Severity;
  suggestions?: string[];
}

export interface CosmeticChangeItem {
  change: Change;
  impact: string;
  severity: 'low';
}

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

export interface Summary {
  total_breaking: number;
  total_security: number;
  total_data: number;
  total_cosmetic: number;
  risk_score: number;
  recommendation: string;
}

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

const ImpactCard: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  items: ImpactItem[];
  borderColor: string; 
}> = ({ title, count, icon, bgColor, textColor, items, borderColor }) => {
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
    <div className={`bg-white rounded-lg shadow-md border-2 ${borderColor} overflow-hidden w-full`}>
      <div className={`p-6 ${bgColor}`}>
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${bgColor} ${textColor}`}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-semibold ${textColor}`}>{title}</h3>
            <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
          </div>
        </div>
      </div>

      {items.length > 0 && (
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

// Main Component with Carousel
const ImpactAnalysisView = ({ impactData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const cards = [
    {
      title: "Breaking Changes",
      count: impactData.breaking_changes.length,
      icon: <AlertCircle className="h-5 w-5" />,
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-300",
      items: impactData.breaking_changes
    },
    {
      title: "Security Changes",
      count: impactData.security_changes.length,
      icon: <Lock className="h-5 w-5" />,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-300",
      items: impactData.security_changes
    },
    {
      title: "Data Structure Changes",
      count: impactData.data_changes.length,
      icon: <Package className="h-5 w-5" />,
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-300",
      items: impactData.data_changes
    }
  ];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      {impactData.summary && <SummaryDashboard summary={impactData.summary} />}

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous change type"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Next change type"
        >
          <ChevronRight className="h-6 w-6 text-gray-600" />
        </button>

        {/* Card Display */}
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {cards.map((card, index) => (
              <div key={index} className="w-full flex-shrink-0 px-4">
                <ImpactCard {...card} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-gray-800' : 'bg-gray-300'
              }`}
              aria-label={`Go to ${cards[index].title}`}
            />
          ))}
        </div>
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