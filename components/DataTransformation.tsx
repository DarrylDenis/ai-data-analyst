
import React, { useState, useMemo } from 'react';
import { DataSet, ColumnType, TransformationAction, TransformationMethod } from '../types';
import { performDataTransformation } from '../services/dataProcessing';
import { Binary, Hash, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';

interface DataTransformationProps {
  dataset: DataSet;
  onDataTransformed: (newDataset: DataSet) => void;
}

export const DataTransformation: React.FC<DataTransformationProps> = ({ dataset, onDataTransformed }) => {
  const categoricalCols = useMemo(() => 
    dataset.columnProfiles.filter(p => 
      p.type === 'String' || 
      p.type === 'Boolean' ||
      (p.type === 'Mixed' && p.uniqueCount < 50)
    ), [dataset]
  );

  const numericalCols = useMemo(() => 
    dataset.columnProfiles.filter(p => 
      p.type === 'Number'
    ), [dataset]
  );

  const [transformations, setTransformations] = useState<Record<string, TransformationMethod>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const handleMethodChange = (col: string, method: string) => {
    if (method === 'none') {
       const { [col]: _, ...rest } = transformations;
       setTransformations(rest);
    } else {
       setTransformations(prev => ({
         ...prev,
         [col]: method as TransformationMethod
       }));
    }
    setSuccess(false);
  };

  const handleApply = async () => {
    const actions: TransformationAction[] = Object.entries(transformations)
      .map(([col, method]) => ({ 
        column: col, 
        method: method as TransformationMethod 
      }));
    
    if (actions.length === 0) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const newDataset = await performDataTransformation(dataset, actions);
      onDataTransformed(newDataset);
      setSuccess(true);
      setTransformations({}); 
    } catch (e) {
      console.error("Transformation failed", e);
      setError("Transformation failed. Check backend connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = Object.keys(transformations).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
       <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-indigo-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm text-pink-600">
               <Binary className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Feature Engineering</h3>
              <p className="text-xs text-gray-500">Prepare your data for Machine Learning with Encoding and Scaling.</p>
            </div>
          </div>
      </div>

      {error && (
         <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
           {error}
         </div>
      )}

      {success && (
         <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-3 text-green-700 animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Transformation applied successfully! Your dataset has been updated.</span>
         </div>
      )}

      <div className="p-6 space-y-8">
        
        {/* Categorical Encoding */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
             <Binary className="w-4 h-4 text-indigo-500" /> Categorical Encoding
          </h4>
          {categoricalCols.length === 0 ? (
            <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg">
              No categorical columns found suitable for encoding.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoricalCols.map((col) => {
                    const selected = transformations[col.name] || 'none';
                    const isHighCardinality = col.uniqueCount > 20;
                    const showWarning = selected === 'one_hot' && isHighCardinality;

                    return (
                      <tr key={col.name} className={transformations[col.name] ? 'bg-indigo-50/30' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.uniqueCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-1">
                             <select 
                               value={selected}
                               onChange={(e) => handleMethodChange(col.name, e.target.value)}
                               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5 border"
                             >
                               <option value="none">None</option>
                               <option value="label">Label Encoding</option>
                               <option value="one_hot">One-Hot Encoding</option>
                             </select>
                             {showWarning && (
                               <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Creates {col.uniqueCount} new cols</span>
                               </div>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Numerical Scaling */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
             <Hash className="w-4 h-4 text-green-500" /> Numerical Scaling
          </h4>
          {numericalCols.length === 0 ? (
            <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg">
              No numeric columns found.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {numericalCols.map((col) => {
                    const selected = transformations[col.name] || 'none';
                    return (
                      <tr key={col.name} className={transformations[col.name] ? 'bg-green-50/30' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                           <select 
                             value={selected}
                             onChange={(e) => handleMethodChange(col.name, e.target.value)}
                             className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-1.5 border"
                           >
                             <option value="none">None</option>
                             <option value="min_max">Min-Max Scaling (0-1)</option>
                             <option value="z_score">Standardization (Z-Score)</option>
                             <option value="log">Log Transformation</option>
                           </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
               <span className="font-medium text-gray-900">{pendingCount}</span> operation{pendingCount !== 1 && 's'} pending
            </div>
            <button 
              onClick={handleApply}
              disabled={pendingCount === 0 || isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? 'Applying...' : (
                 <><Play className="w-4 h-4" /> Apply Transformations</>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};
