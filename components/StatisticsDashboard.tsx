
import React, { useMemo } from 'react';
import { DataSet, ColumnStats, CorrelationResult } from '../types';
import { generateStatistics, calculateCorrelations } from '../services/dataProcessing';
import { Calculator, TrendingUp, Minus, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';

interface StatisticsDashboardProps {
  dataset: DataSet;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ dataset }) => {
  const stats = useMemo(() => generateStatistics(dataset), [dataset]);
  const correlations = useMemo(() => calculateCorrelations(dataset), [dataset]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Statistical Summary Table */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Numeric Summaries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mean</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Median</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Std Dev</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((stat) => (
                  <tr key={stat.column} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.column}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{stat.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{stat.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{stat.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{stat.min.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{stat.max.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correlations */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Top Correlations</h3>
          </div>
          <div className="flex-1 overflow-auto p-0">
             {correlations.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400">
                     <HelpCircle className="w-8 h-8 mb-2" />
                     <p className="text-sm">Not enough numeric data</p>
                 </div>
             ) : (
                 <div className="divide-y divide-gray-100">
                    {correlations.slice(0, 8).map((corr, idx) => (
                        <div key={idx} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <span>{corr.column1}</span>
                                    <span className="text-gray-400">&</span>
                                    <span>{corr.column2}</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${
                                Math.abs(corr.value) > 0.7 ? 'text-indigo-600' : 
                                Math.abs(corr.value) > 0.4 ? 'text-indigo-400' : 'text-gray-400'
                            }`}>
                                {corr.value > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(corr.value).toFixed(2)}
                            </div>
                        </div>
                    ))}
                 </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
