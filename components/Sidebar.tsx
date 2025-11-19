

import React from 'react';
import { LayoutDashboard, TableProperties, Sparkles, BarChart3, Database, FileSpreadsheet, PieChart, FlaskConical, Binary } from 'lucide-react';

export type ViewType = 'overview' | 'columns' | 'cleaning' | 'statistics' | 'visualizations' | 'hypothesis' | 'transformation';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  fileName: string;
  totalRows: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, fileName, totalRows }) => {
  
  const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'columns', label: 'Column Analysis', icon: TableProperties },
    { id: 'cleaning', label: 'Smart Cleaning', icon: Sparkles },
    { id: 'transformation', label: 'Data Transformation', icon: Binary },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'hypothesis', label: 'Hypothesis Testing', icon: FlaskConical },
    { id: 'visualizations', label: 'Visual Studio', icon: PieChart },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen flex-shrink-0 transition-all duration-300 shadow-xl z-20">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="bg-indigo-600 p-1.5 rounded-lg mr-3 shadow-lg shadow-indigo-500/30">
          <Database className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          AI Analyst
        </span>
      </div>

      {/* File Info Card */}
      <div className="p-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current File</p>
              <p className="text-sm font-semibold text-white truncate" title={fileName}>{fileName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span>Rows:</span>
            <span className="font-mono text-indigo-300">{totalRows.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Analysis Tools
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <Icon className={`
                w-5 h-5 mr-3 transition-colors
                ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
              `} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          v1.0.0 • AI Powered
        </div>
      </div>
    </div>
  );
};
