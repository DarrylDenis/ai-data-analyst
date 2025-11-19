

import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataPreview } from './components/DataPreview';
import { DataProfile } from './components/DataProfile';
import { AIStatusReport } from './components/AIStatusReport';
import { CleaningZone } from './components/CleaningZone';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { HypothesisTesting } from './components/HypothesisTesting';
import { VisualizationGallery } from './components/VisualizationGallery';
import { DataTransformation } from './components/DataTransformation';
import { Sidebar, ViewType } from './components/Sidebar';
import { processFile } from './services/dataProcessing';
import { analyzeDataQuality } from './services/gemini';
import { DataSet, AIAnalysisResult } from './types';
import { Undo2, LogOut, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [originalDataset, setOriginalDataset] = useState<DataSet | null>(null);
  const [dataset, setDataset] = useState<DataSet | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Routing State
  const [currentView, setCurrentView] = useState<ViewType>('overview');

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setDataset(null);
    setOriginalDataset(null);
    setAiAnalysis(null);

    try {
      const data = await processFile(file);
      setDataset(data);
      setOriginalDataset(data);
      setCurrentView('overview'); // Reset view on new upload
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleRunAI = async () => {
    if (!dataset) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDataQuality(dataset);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDataUpdated = (newDataset: DataSet) => {
    setDataset(newDataset);
    setAiAnalysis(null); // Invalidate previous analysis
  };

  const handleUndo = () => {
    if (originalDataset) {
      setDataset(originalDataset);
      setAiAnalysis(null);
    }
  };

  const handleReset = () => {
    setDataset(null);
    setOriginalDataset(null);
    setAiAnalysis(null);
    setError(null);
    setCurrentView('overview');
  };

  // --- Render Logic ---

  // 1. No Dataset -> Show Upload Screen
  if (!dataset) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-xl mb-6">
               <div className="h-8 w-8 bg-indigo-600 rounded-lg"></div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
              Data Analytics <br />
              <span className="text-indigo-600">Reimagined</span>
            </h1>
            <p className="text-lg text-slate-500">
              Upload your CSV or Excel file to unlock instant AI-powered cleaning, validation, and professional insights.
            </p>
          </div>

          <div className="w-full max-w-2xl animate-fade-in-up">
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Dataset Exists -> Show Dashboard Layout
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        fileName={dataset.fileName}
        totalRows={dataset.totalRows}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header / Toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
             {/* Breadcrumb-ish title */}
             <h2 className="text-xl font-semibold text-slate-800 capitalize">
               {currentView === 'overview' ? 'Dashboard Overview' : 
                currentView === 'columns' ? 'Column Profiling' :
                currentView === 'cleaning' ? 'Data Cleaning Studio' :
                currentView === 'transformation' ? 'Feature Engineering' :
                currentView === 'statistics' ? 'Statistical Analysis' :
                currentView === 'hypothesis' ? 'Hypothesis Testing' : 'Visualization Studio'}
             </h2>
          </div>

          <div className="flex items-center gap-3">
            {dataset !== originalDataset && (
              <button
                onClick={handleUndo}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 border border-transparent hover:border-indigo-100"
              >
                <Undo2 className="w-4 h-4" /> Undo Changes
              </button>
            )}
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button 
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 group"
              title="Close File"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-auto p-6 sm:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto h-full">
            
            {/* VIEW: OVERVIEW */}
            {currentView === 'overview' && (
              <div className="space-y-6 h-full flex flex-col">
                <AIStatusReport 
                  analysis={aiAnalysis} 
                  loading={isAnalyzing} 
                  onAnalyze={handleRunAI} 
                />
                <div className="flex-1 min-h-[400px]">
                  <DataPreview dataset={dataset} />
                </div>
              </div>
            )}

            {/* VIEW: COLUMNS */}
            {currentView === 'columns' && (
               <div className="animate-fade-in">
                 <DataProfile dataset={dataset} />
               </div>
            )}

            {/* VIEW: CLEANING */}
            {currentView === 'cleaning' && (
              <div className="animate-fade-in max-w-4xl mx-auto">
                <CleaningZone dataset={dataset} onDataCleaned={handleDataUpdated} />
              </div>
            )}

             {/* VIEW: TRANSFORMATION */}
             {currentView === 'transformation' && (
              <div className="animate-fade-in max-w-5xl mx-auto">
                <DataTransformation dataset={dataset} onDataTransformed={handleDataUpdated} />
              </div>
            )}

            {/* VIEW: STATISTICS */}
            {currentView === 'statistics' && (
               <div className="animate-fade-in">
                 <StatisticsDashboard dataset={dataset} />
               </div>
            )}

            {/* VIEW: HYPOTHESIS TESTING */}
            {currentView === 'hypothesis' && (
               <div className="animate-fade-in h-full">
                 <HypothesisTesting dataset={dataset} />
               </div>
            )}

            {/* VIEW: VISUALIZATIONS */}
            {currentView === 'visualizations' && (
               <div className="animate-fade-in h-full">
                 <VisualizationGallery dataset={dataset} />
               </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
};

export default App;
