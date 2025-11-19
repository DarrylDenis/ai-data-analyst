
import React, { useState, useMemo } from 'react';
import { DataSet, ColumnType } from '../types';
import { 
  getHistogramData, 
  getCategoryCounts, 
  getScatterData, 
  getBarAggregateData, 
  calculateCorrelations 
} from '../services/dataProcessing';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Activity, BarChart2, Grid, ArrowRightLeft, Settings2 } from 'lucide-react';

interface VisualizationGalleryProps {
  dataset: DataSet;
}

export const VisualizationGallery: React.FC<VisualizationGalleryProps> = ({ dataset }) => {
  const [activeTab, setActiveTab] = useState<'univariate' | 'bivariate' | 'heatmap'>('univariate');

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-6 pt-4">
        <button
          onClick={() => setActiveTab('univariate')}
          className={`pb-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'univariate' 
            ? 'border-indigo-600 text-indigo-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Distributions
        </button>
        <button
          onClick={() => setActiveTab('bivariate')}
          className={`pb-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bivariate' 
            ? 'border-indigo-600 text-indigo-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Bivariate Explorer
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`pb-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'heatmap' 
            ? 'border-indigo-600 text-indigo-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Grid className="w-4 h-4" /> Correlation Heatmap
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'univariate' && <UnivariateView dataset={dataset} />}
        {activeTab === 'bivariate' && <BivariateView dataset={dataset} />}
        {activeTab === 'heatmap' && <HeatmapView dataset={dataset} />}
      </div>
    </div>
  );
};

// --- 1. Univariate View ---

const UnivariateView: React.FC<{ dataset: DataSet }> = ({ dataset }) => {
  const numericCols = dataset.columnProfiles.filter(c => c.type === ColumnType.Number);
  const categoryCols = dataset.columnProfiles.filter(c => c.type === ColumnType.String || c.type === ColumnType.Boolean);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
      {/* Numeric Histograms */}
      {numericCols.map(col => {
        const data = getHistogramData(dataset, col.name);
        return (
          <div key={col.name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-80">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex justify-between">
              {col.name} 
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Histogram</span>
            </h4>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                     contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     itemStyle={{ color: '#4f46e5' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}

      {/* Categorical Counts */}
      {categoryCols.map(col => {
        const data = getCategoryCounts(dataset, col.name);
        return (
          <div key={col.name} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-80">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex justify-between">
              {col.name}
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Counts</span>
            </h4>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                  <Tooltip 
                     cursor={{fill: '#f3f4f6'}}
                     contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- 2. Bivariate Explorer ---

const BivariateView: React.FC<{ dataset: DataSet }> = ({ dataset }) => {
  const [xCol, setXCol] = useState<string>(dataset.headers[0]);
  const [yCol, setYCol] = useState<string>(dataset.headers.length > 1 ? dataset.headers[1] : dataset.headers[0]);

  const xType = dataset.columnProfiles.find(c => c.name === xCol)?.type || ColumnType.Unknown;
  const yType = dataset.columnProfiles.find(c => c.name === yCol)?.type || ColumnType.Unknown;

  const chartData = useMemo(() => {
    if (xType === ColumnType.Number && yType === ColumnType.Number) {
        return getScatterData(dataset, xCol, yCol);
    } else if ((xType === ColumnType.String || xType === ColumnType.Boolean) && yType === ColumnType.Number) {
        return getBarAggregateData(dataset, xCol, yCol);
    }
    return [];
  }, [dataset, xCol, yCol, xType, yType]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Controls */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">X Axis (Independent)</label>
          <select 
            value={xCol} 
            onChange={(e) => setXCol(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            {dataset.headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Y Axis (Dependent / Metric)</label>
          <select 
            value={yCol} 
            onChange={(e) => setYCol(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
            {dataset.headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-6 min-h-0">
        {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Unsupported combination. Try Numeric vs Numeric or Category vs Numeric.
            </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
                {xType === ColumnType.Number && yType === ColumnType.Number ? (
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="x" name={xCol} label={{ value: xCol, position: 'bottom', offset: 0, fontSize: 12 }} />
                        <YAxis type="number" dataKey="y" name={yCol} label={{ value: yCol, angle: -90, position: 'left', fontSize: 12 }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Scatter name={`${xCol} vs ${yCol}`} data={chartData} fill="#8884d8" fillOpacity={0.6} />
                    </ScatterChart>
                ) : (
                     <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} fontSize={10} />
                        <YAxis label={{ value: `Avg ${yCol}`, angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                     </BarChart>
                )}
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// --- 3. Correlation Heatmap ---

const HeatmapView: React.FC<{ dataset: DataSet }> = ({ dataset }) => {
  const correlations = useMemo(() => calculateCorrelations(dataset), [dataset]);
  const numericCols = dataset.columnProfiles.filter(c => c.type === ColumnType.Number).map(c => c.name);

  if (numericCols.length < 2) {
    return <div className="p-12 text-center text-gray-500">Not enough numeric columns for a heatmap.</div>;
  }

  // Build matrix for rendering
  const matrix: Record<string, Record<string, number>> = {};
  numericCols.forEach(c1 => {
      matrix[c1] = {};
      numericCols.forEach(c2 => {
          if (c1 === c2) {
              matrix[c1][c2] = 1;
          } else {
              const corr = correlations.find(
                  r => (r.column1 === c1 && r.column2 === c2) || (r.column1 === c2 && r.column2 === c1)
              );
              matrix[c1][c2] = corr ? corr.value : 0;
          }
      });
  });

  const getColor = (val: number) => {
    // Red (Negative) -> White (0) -> Blue (Positive)
    if (val === 1) return 'bg-blue-600 text-white';
    if (val > 0.7) return 'bg-blue-500 text-white';
    if (val > 0.4) return 'bg-blue-300 text-blue-900';
    if (val > 0.1) return 'bg-blue-100 text-blue-800';
    
    if (val < -0.7) return 'bg-red-500 text-white';
    if (val < -0.4) return 'bg-red-300 text-red-900';
    if (val < -0.1) return 'bg-red-100 text-red-800';
    
    return 'bg-gray-50 text-gray-400';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Correlation Matrix</h3>
      <div className="inline-block min-w-full">
          <div className="grid" style={{ gridTemplateColumns: `auto repeat(${numericCols.length}, minmax(80px, 1fr))` }}>
            
            {/* Header Row */}
            <div className="h-12"></div> {/* Corner spacer */}
            {numericCols.map(col => (
                <div key={col} className="h-32 flex items-end justify-center pb-2">
                    <span className="transform -rotate-45 text-xs font-medium text-gray-500 whitespace-nowrap w-4 origin-bottom-left translate-x-4">
                        {col}
                    </span>
                </div>
            ))}

            {/* Rows */}
            {numericCols.map(rowCol => (
                <React.Fragment key={rowCol}>
                    <div className="h-12 flex items-center justify-end pr-4">
                        <span className="text-xs font-medium text-gray-600 text-right truncate w-32" title={rowCol}>
                            {rowCol}
                        </span>
                    </div>
                    {numericCols.map(colCol => {
                        const val = matrix[rowCol][colCol];
                        return (
                            <div 
                                key={`${rowCol}-${colCol}`} 
                                className={`h-12 border border-white flex items-center justify-center text-xs font-medium transition-all hover:scale-105 hover:shadow-lg hover:z-10 rounded-sm ${getColor(val)}`}
                                title={`${rowCol} vs ${colCol}: ${val.toFixed(2)}`}
                            >
                                {val.toFixed(2)}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
          </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
         <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-600 rounded"></div> Positive Correlation</div>
         <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-500 rounded"></div> Negative Correlation</div>
      </div>
    </div>
  );
};
