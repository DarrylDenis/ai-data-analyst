import React from 'react';
import { AIAnalysisResult } from '../types';
import { Sparkles, AlertOctagon, Lightbulb, CheckCircle2 } from 'lucide-react';

interface AIStatusReportProps {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

export const AIStatusReport: React.FC<AIStatusReportProps> = ({ analysis, loading, onAnalyze }) => {
  if (!analysis && !loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            AI Data Validation
          </h3>
          <p className="text-indigo-100 text-sm">
            Let AI analyze the structure, detect deeper issues, and score your dataset quality.
          </p>
        </div>
        <button 
          onClick={onAnalyze}
          className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
        >
          Run AI Scan
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center animate-pulse">
        <Sparkles className="w-10 h-10 text-indigo-400 mb-4 animate-spin-slow" />
        <h3 className="text-lg font-semibold text-gray-900">AI is analyzing your data...</h3>
        <p className="text-gray-500 text-sm mt-2">Checking types, spotting anomalies, and calculating quality score.</p>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI Quality Report
            </h3>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-100">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Quality Score</span>
              <span className={`text-lg font-bold ${
                analysis.dataQualityScore >= 80 ? 'text-green-600' : 
                analysis.dataQualityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysis.dataQualityScore}/100
              </span>
            </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Dataset Summary</h4>
              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {analysis.summary}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                 <AlertOctagon className="w-4 h-4 text-orange-500" /> Detected Issues
              </h4>
              <ul className="space-y-2">
                {analysis.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></span>
                    {issue}
                  </li>
                ))}
                {analysis.issues.length === 0 && (
                   <li className="text-sm text-gray-500 italic">No critical issues detected.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
             <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                 <Lightbulb className="w-4 h-4 text-yellow-500" /> AI Recommendations
              </h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-50">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
