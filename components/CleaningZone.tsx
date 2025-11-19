
import React, { useState } from 'react';
import { DataSet, CleaningPlan } from '../types';
import { generateCleaningPlan } from '../services/gemini';
import { performDataCleaning } from '../services/dataProcessing';
import { Wand2, Play, CheckCircle2, RefreshCcw, Trash2, Type, Hash, AlertCircle } from 'lucide-react';

interface CleaningZoneProps {
  dataset: DataSet;
  onDataCleaned: (newDataset: DataSet) => void;
}

export const CleaningZone: React.FC<CleaningZoneProps> = ({ dataset, onDataCleaned }) => {
  const [plan, setPlan] = useState<CleaningPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isCleaned, setIsCleaned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedPlan = await generateCleaningPlan(dataset);
      setPlan(generatedPlan);
    } catch (e) {
      console.error(e);
      setError("Failed to generate AI plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCleaning = async () => {
    if (!plan) return;
    setIsCleaning(true);
    setError(null);
    try {
      const cleaned = await performDataCleaning(dataset, plan);
      onDataCleaned(cleaned);
      setIsCleaned(true);
      setPlan(null); 
    } catch (e) {
      console.error(e);
      setError("Data cleaning failed. Ensure backend is running.");
    } finally {
      setIsCleaning(false);
    }
  };

  if (isCleaned) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
                <h3 className="font-bold text-green-900">Data Successfully Cleaned</h3>
                <p className="text-green-700 text-sm">Your dataset has been transformed and is ready for visualization.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-indigo-600" />
          AI Data Cleaner
        </h3>
      </div>

      <div className="p-6">
        {error && (
           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
             <AlertCircle className="w-4 h-4" /> {error}
           </div>
        )}

        {!plan ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
            <p className="text-gray-600 max-w-md">
              Let our AI analyze your columns and suggest the best cleaning operations (imputation, formatting, deduplication).
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <>
                   <RefreshCcw className="w-4 h-4 animate-spin" /> Generating Plan...
                </>
              ) : (
                <>
                   <Wand2 className="w-4 h-4" /> Generate Cleaning Plan
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-1">AI Proposal</h4>
                <p className="text-sm text-gray-700">{plan.summary}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Proposed Actions ({plan.actions.length})</h4>
              <div className="grid gap-3">
                {plan.actions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                    <div className="mt-1">
                        {action.type === 'impute' && <Hash className="w-4 h-4 text-blue-500" />}
                        {action.type === 'normalize_headers' && <Type className="w-4 h-4 text-purple-500" />}
                        {action.type === 'remove_duplicates' && <Trash2 className="w-4 h-4 text-red-500" />}
                        {action.type === 'cast_type' && <Wand2 className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <span className="text-sm font-medium text-gray-900 capitalize">
                                {action.type.replace('_', ' ')}
                             </span>
                             {action.column && (
                                 <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                     {action.column}
                                 </span>
                             )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setPlan(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleApplyCleaning}
                disabled={isCleaning}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70"
              >
                {isCleaning ? (
                    <>
                        <RefreshCcw className="w-4 h-4 animate-spin" /> Cleaning...
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4" /> Apply Changes
                    </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
