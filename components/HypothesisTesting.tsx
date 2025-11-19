
import React, { useState, useMemo } from 'react';
import { DataSet, TestType, TestResult, ColumnType } from '../types';
import { performHypothesisTest } from '../services/dataProcessing';
import { Calculator, FlaskConical, AlertCircle, CheckCircle2, XCircle, HelpCircle, AlertTriangle, Info } from 'lucide-react';

interface HypothesisTestingProps {
  dataset: DataSet;
}

export const HypothesisTesting: React.FC<HypothesisTestingProps> = ({ dataset }) => {
  const [selectedTest, setSelectedTest] = useState<TestType>('t-test');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [secondColumn, setSecondColumn] = useState<string>('');
  const [groupColumn, setGroupColumn] = useState<string>('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const numericColumns = useMemo(() => dataset.columnProfiles.filter(p => p.type === 'Number').map(p => p.name), [dataset]);
  const categoricalColumns = useMemo(() => dataset.columnProfiles.filter(p => p.type === 'String' || p.type === 'Boolean').map(p => p.name), [dataset]);

  useMemo(() => {
    if (numericColumns.length > 0) setTargetColumn(numericColumns[0]);
    if (numericColumns.length > 1) setSecondColumn(numericColumns[1]);
    if (categoricalColumns.length > 0) setGroupColumn(categoricalColumns[0]);
  }, [dataset, numericColumns, categoricalColumns]);

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await performHypothesisTest(dataset, {
        type: selectedTest,
        targetColumn,
        secondColumn: (selectedTest === 't-test' || selectedTest === 'z-test' || selectedTest === 'chi-square') ? secondColumn : undefined,
        groupColumn: selectedTest === 'anova' ? groupColumn : undefined
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during the test.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTestDescription = () => {
    switch (selectedTest) {
      case 't-test': return "Compares the means of two independent numeric columns to see if they are significantly different.";
      case 'z-test': return "Similar to T-Test, but assumes larger sample size. Used to compare means.";
      case 'chi-square': return "Tests whether two categorical variables are independent or related.";
      case 'anova': return "Tests if the means of a numeric column are different across the groups of a categorical column.";
      default: return "";
    }
  };

  // --- Data Readiness Logic ---
  const warnings = useMemo(() => {
    const list: { type: 'warning' | 'info'; msg: string }[] = [];
    
    const checkColumn = (colName: string, label: string) => {
      const profile = dataset.columnProfiles.find(p => p.name === colName);
      if (!profile) return;

      if (profile.missingCount > 0) {
        list.push({
          type: 'warning',
          msg: `Warning: Column '${colName}' has ${profile.missingCount} missing values. These rows will be ignored, which may bias your results.`
        });
      }
    };

    if (targetColumn) checkColumn(targetColumn, "Target");
    if ((selectedTest === 't-test' || selectedTest === 'z-test' || selectedTest === 'chi-square') && secondColumn) {
      checkColumn(secondColumn, "Second");
    }
    if (selectedTest === 'anova' && groupColumn) {
       checkColumn(groupColumn, "Group");
    }

    if (selectedTest !== 'chi-square') {
        list.push({
            type: 'info',
            msg: "Tip: Ensure your numeric data is free of extreme outliers or scaled (Standardized) for the most reliable results."
        });
    }

    return list;
  }, [dataset, selectedTest, targetColumn, secondColumn, groupColumn]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-600" />
                Test Configuration
              </h3>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Test Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Statistical Test</label>
                <select 
                  value={selectedTest}
                  onChange={(e) => {
                    setSelectedTest(e.target.value as TestType);
                    setResult(null);
                    setError(null);
                  }}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                >
                  <option value="t-test">T-Test (Two-Sample)</option>
                  <option value="z-test">Z-Test (Two-Sample)</option>
                  <option value="chi-square">Chi-Square Test</option>
                  <option value="anova">ANOVA (One-Way)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2 italic">
                  {getTestDescription()}
                </p>
              </div>

              {/* Inputs based on Test Type */}
              {(selectedTest === 't-test' || selectedTest === 'z-test') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variable 1 (Numeric)</label>
                    <select 
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    >
                      {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variable 2 (Numeric)</label>
                    <select 
                      value={secondColumn}
                      onChange={(e) => setSecondColumn(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    >
                      {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                </>
              )}

              {selectedTest === 'anova' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Variable (Numeric)</label>
                    <select 
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    >
                      {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grouping Variable (Categorical)</label>
                    <select 
                      value={groupColumn}
                      onChange={(e) => setGroupColumn(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    >
                      {categoricalColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                </>
              )}

              {selectedTest === 'chi-square' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variable 1 (Categorical)</label>
                    <select 
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    >
                      {categoricalColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variable 2 (Categorical)</label>
                    <select 
                      value={secondColumn}
                      onChange={(e) => setSecondColumn(e.target.value)}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    >
                      {categoricalColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                </>
              )}
              
              {/* Data Readiness Check */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data Readiness Check</h4>
                 {warnings.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                       <CheckCircle2 className="w-3 h-3" />
                       <span>Data looks good for testing.</span>
                    </div>
                 ) : (
                    warnings.map((w, idx) => (
                       <div key={idx} className={`flex items-start gap-2 text-xs p-2 rounded ${w.type === 'warning' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                           {w.type === 'warning' ? <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> : <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                           <span>{w.msg}</span>
                       </div>
                    ))
                 )}
              </div>

              <button
                onClick={handleRunTest}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-70"
              >
                {isLoading ? 'Running Test...' : (
                  <><Calculator className="w-4 h-4" /> Run Test</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
               <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
               <div>
                 <h4 className="font-bold text-red-800">Test Failed</h4>
                 <p className="text-sm text-red-600 mt-1">{error}</p>
               </div>
            </div>
          )}

          {!result && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                 <FlaskConical className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Analyze</h3>
              <p className="text-gray-500 max-w-xs mt-2">Select your variables and run a hypothesis test to see statistical significance.</p>
            </div>
          )}

          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">{result.testName} Results</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${result.isSignificant ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {result.isSignificant ? 'Significant' : 'Not Significant'}
                  </span>
               </div>
               
               <div className="p-8">
                  {/* Main Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 text-center">
                       <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider mb-1">Test Statistic ({result.statisticName})</p>
                       <p className="text-3xl font-extrabold text-indigo-700">{result.statistic.toFixed(3)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                       <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Critical Value</p>
                       <p className="text-3xl font-bold text-gray-700">{result.criticalValue.toFixed(3)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                       <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Degrees of Freedom</p>
                       <p className="text-3xl font-bold text-gray-700">{result.degreesOfFreedom}</p>
                    </div>
                  </div>

                  {/* Conclusion Section */}
                  <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-indigo-500" /> Interpretation
                        </h4>
                        <div className={`p-4 rounded-lg border ${result.isSignificant ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                           <div className="flex items-start gap-3">
                              {result.isSignificant ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                              ) : (
                                  <XCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                              )}
                              <div>
                                <p className="text-gray-800 font-medium leading-relaxed">
                                    {result.insights[0]}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {result.insights[1]}
                                </p>
                              </div>
                           </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Details</h4>
                        <p className="text-sm text-gray-600 bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
                            {result.details}
                        </p>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
