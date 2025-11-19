
import Papa from 'papaparse';
import { DataSet, DataRow, ColumnProfile, ColumnType, CleaningPlan, ColumnStats, CorrelationResult, TestParams, TestResult, TransformationAction, ImputationStrategy, TypeCastTarget } from '../types';

// --- Helper Functions for Client-Side Logic ---

const identifyType = (values: any[]): ColumnType => {
  let numCount = 0;
  let strCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  const total = values.length;

  values.forEach(v => {
    if (v === null || v === undefined || v === '') return;
    if (typeof v === 'number') numCount++;
    else if (typeof v === 'boolean') boolCount++;
    else if (!isNaN(Number(v)) && v !== '') numCount++;
    else if (!isNaN(Date.parse(v)) && v.length > 5) dateCount++; // simplistic date check
    else strCount++;
  });

  if (total === 0) return ColumnType.Unknown;
  if (numCount / total > 0.8) return ColumnType.Number;
  if (boolCount / total > 0.8) return ColumnType.Boolean;
  if (dateCount / total > 0.8) return ColumnType.Date;
  if (strCount / total > 0.8) return ColumnType.String;
  return ColumnType.Mixed;
};

const createColumnProfiles = (rows: DataRow[], headers: string[]): ColumnProfile[] => {
  return headers.map(header => {
    const values = rows.map(r => r[header]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(nonNullValues.map(String));
    
    return {
      name: header,
      type: identifyType(nonNullValues),
      missingCount: values.length - nonNullValues.length,
      missingPercentage: ((values.length - nonNullValues.length) / values.length) * 100,
      uniqueCount: uniqueValues.size,
      example: nonNullValues[0] ?? null
    };
  });
};

const rebuildDataSet = (rows: DataRow[], fileName: string, fileSize: number): DataSet => {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const profiles = createColumnProfiles(rows, headers);
    return {
        fileName,
        fileSize,
        totalRows: rows.length,
        headers,
        rows,
        columnProfiles: profiles
    };
};

// --- Main Service Functions ---

export const processFile = (file: File): Promise<DataSet> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
           console.warn("CSV Parsing Errors:", results.errors);
        }
        const rows = results.data as DataRow[];
        const headers = results.meta.fields || [];
        const profiles = createColumnProfiles(rows, headers);

        resolve({
          fileName: file.name,
          fileSize: file.size,
          totalRows: rows.length,
          headers,
          rows,
          columnProfiles: profiles
        });
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

export const performDataCleaning = async (dataset: DataSet, plan: CleaningPlan): Promise<DataSet> => {
  let cleanedRows = [...dataset.rows];
  let currentHeaders = [...dataset.headers];

  // Helper to get column values safely
  const getValues = (col: string) => cleanedRows.map(r => r[col]);

  // 1. Apply Column Drops first to avoid processing deleted cols
  const dropActions = plan.actions.filter(a => a.type === 'drop_column');
  dropActions.forEach(action => {
      if(action.column) {
          currentHeaders = currentHeaders.filter(h => h !== action.column);
          cleanedRows.forEach(row => delete row[action.column!]);
      }
  });

  for (const action of plan.actions) {
    if (action.type === 'drop_column') continue; // Already handled

    if (action.type === 'remove_duplicates') {
       const seen = new Set();
       cleanedRows = cleanedRows.filter(row => {
           const sig = JSON.stringify(row);
           if (seen.has(sig)) return false;
           seen.add(sig);
           return true;
       });
    }

    if (action.type === 'normalize_headers') {
        const newMap: Record<string, string> = {};
        const newHeaders = currentHeaders.map(h => {
            const newH = h.trim().toLowerCase().replace(/[\s\W]+/g, '_').replace(/^_+|_+$/g, '');
            newMap[h] = newH;
            return newH;
        });
        cleanedRows = cleanedRows.map(row => {
            const newRow: DataRow = {};
            Object.keys(row).forEach(k => {
                if (newMap[k]) newRow[newMap[k]] = row[k];
            });
            return newRow;
        });
        currentHeaders = newHeaders;
    }

    if (action.type === 'impute' && action.column && action.parameters?.strategy) {
        const col = action.column;
        const strat = action.parameters.strategy;
        const values = cleanedRows.map(r => r[col]);
        
        let fillValue: any = null;
        
        if (strat === 'mean' || strat === 'median') {
            const nums = values.filter(v => typeof v === 'number' && !isNaN(v)) as number[];
            if (nums.length > 0) {
                if (strat === 'mean') fillValue = nums.reduce((a, b) => a + b, 0) / nums.length;
                else {
                    nums.sort((a, b) => a - b);
                    const mid = Math.floor(nums.length / 2);
                    fillValue = nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
                }
            }
        } else if (strat === 'mode') {
            const counts: Record<string, number> = {};
            let maxC = 0;
            let modeVal = null;
            values.forEach(v => {
                if (v !== null && v !== undefined && v !== '') {
                    const s = String(v);
                    counts[s] = (counts[s] || 0) + 1;
                    if (counts[s] > maxC) {
                         maxC = counts[s];
                         modeVal = v;
                    }
                }
            });
            fillValue = modeVal;
        } else if (strat === 'fill_zero') {
            fillValue = 0;
        }

        if (strat === 'remove_row') {
            cleanedRows = cleanedRows.filter(r => r[col] !== null && r[col] !== undefined && r[col] !== '');
        } else if (fillValue !== null) {
            cleanedRows.forEach(r => {
                if (r[col] === null || r[col] === undefined || r[col] === '') {
                    r[col] = fillValue;
                }
            });
        }
    }

    if (action.type === 'cast_type' && action.column && action.parameters?.targetType) {
        const col = action.column;
        const type = action.parameters.targetType;
        cleanedRows.forEach(r => {
            const val = r[col];
            if (type === 'Number') {
                const num = Number(val);
                r[col] = isNaN(num) ? null : num;
            } else if (type === 'String') {
                r[col] = val === null || val === undefined ? null : String(val);
            } else if (type === 'Date') {
                 r[col] = val ? new Date(String(val)).toISOString() : null;
            } else if (type === 'Boolean') {
                const s = String(val).toLowerCase();
                r[col] = s === 'true' || s === '1' || s === 'yes';
            }
        });
    }
  }

  return rebuildDataSet(cleanedRows, dataset.fileName, dataset.fileSize);
};

export const performDataTransformation = async (dataset: DataSet, actions: TransformationAction[]): Promise<DataSet> => {
  let rows = JSON.parse(JSON.stringify(dataset.rows)); // Deep copy
  let headers = [...dataset.headers];

  for (const action of actions) {
      const col = action.column;
      
      if (action.method === 'label') {
          const unique = Array.from(new Set(rows.map((r: any) => String(r[col])))).sort();
          const map = new Map(unique.map((val, idx) => [val, idx]));
          rows.forEach((r: any) => {
              r[`${col}_encoded`] = map.get(String(r[col]));
          });
          headers.push(`${col}_encoded`);
      }
      
      else if (action.method === 'one_hot') {
          const unique = Array.from(new Set(rows.map((r: any) => String(r[col])))).sort() as string[];
          // Limit one hot to prevent explosion if not caught by UI
          if (unique.length > 50) continue; 
          
          unique.forEach(val => {
             const newHeader = `${col}_${val.replace(/[^a-zA-Z0-9]/g, '_')}`;
             headers.push(newHeader);
             rows.forEach((r: any) => {
                r[newHeader] = String(r[col]) === val ? 1 : 0;
             });
          });
      }

      else if (action.method === 'min_max') {
          const values = rows.map((r: any) => Number(r[col])).filter((v: number) => !isNaN(v));
          const min = Math.min(...values);
          const max = Math.max(...values);
          if (max !== min) {
              rows.forEach((r: any) => {
                 const val = Number(r[col]);
                 if(!isNaN(val)) {
                     r[col] = (val - min) / (max - min);
                 }
              });
          }
      }

      else if (action.method === 'z_score') {
          const values = rows.map((r: any) => Number(r[col])).filter((v: number) => !isNaN(v));
          const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
          const stdDev = Math.sqrt(values.map((v: number) => Math.pow(v - mean, 2)).reduce((a: number, b: number) => a + b, 0) / values.length);
          
          if (stdDev !== 0) {
              rows.forEach((r: any) => {
                  const val = Number(r[col]);
                  if (!isNaN(val)) {
                      r[col] = (val - mean) / stdDev;
                  }
              });
          }
      }

      else if (action.method === 'log') {
          rows.forEach((r: any) => {
              const val = Number(r[col]);
              if (!isNaN(val) && val > 0) {
                  r[col] = Math.log(val);
              } else if (!isNaN(val) && val <= 0) {
                   r[col] = 0; // Handle non-positive logs roughly or set null
              }
          });
      }
  }

  return rebuildDataSet(rows, dataset.fileName, dataset.fileSize);
};


// --- Statistical Logic (Approximations for Client Side) ---
// Note: Real stats libraries (jStat, stdlib) are heavy. We use basic implementations.

export const performHypothesisTest = async (dataset: DataSet, params: TestParams): Promise<TestResult> => {
    const getNumData = (col: string) => dataset.rows.map(r => Number(r[col])).filter(n => !isNaN(n));
    const getCatData = (col: string) => dataset.rows.map(r => String(r[col]));

    let statistic = 0;
    let pValue = 0.05; // Placeholder as precise p-value calc in JS is complex without huge libs
    let isSignificant = false;
    let criticalValue = 1.96; // Default Z
    let df = 0;
    let statName = "Z";
    let details = "";
    let insights: string[] = [];

    // T-Test (Independent Two Sample)
    if (params.type === 't-test' || params.type === 'z-test') {
        const data1 = getNumData(params.targetColumn);
        const data2 = params.secondColumn ? getNumData(params.secondColumn) : [];
        
        if (data1.length < 2 || data2.length < 2) throw new Error("Not enough numeric data");

        const mean1 = data1.reduce((a, b) => a + b, 0) / data1.length;
        const mean2 = data2.reduce((a, b) => a + b, 0) / data2.length;
        
        // Variance
        const var1 = data1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (data1.length - 1);
        const var2 = data2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (data2.length - 1);

        const se = Math.sqrt((var1 / data1.length) + (var2 / data2.length));
        statistic = (mean1 - mean2) / se;
        statName = params.type === 't-test' ? "t" : "z";
        
        df = data1.length + data2.length - 2;
        // Critical Value approx (using 1.96 for large N, else rough t-table lookup)
        criticalValue = df > 30 ? 1.96 : 2.04; 
        
        isSignificant = Math.abs(statistic) > criticalValue;
        details = `Mean ${params.targetColumn}: ${mean1.toFixed(2)}, Mean ${params.secondColumn}: ${mean2.toFixed(2)}. Standard Error: ${se.toFixed(4)}.`;
        insights = [
            isSignificant 
              ? `We reject the null hypothesis. There is a significant difference between the means of ${params.targetColumn} and ${params.secondColumn}.`
              : `We fail to reject the null hypothesis. The difference between means is likely due to random chance.`,
            `Test Statistic (${statName}) = ${statistic.toFixed(3)} vs Critical Value = ${criticalValue}`
        ];
    }

    // Chi-Square Test of Independence
    else if (params.type === 'chi-square') {
        if (!params.secondColumn) throw new Error("Chi-Square requires two categorical columns");
        
        statName = "Chi²";
        const col1 = getCatData(params.targetColumn);
        const col2 = getCatData(params.secondColumn);
        
        // Contingency Table
        const table: Record<string, Record<string, number>> = {};
        const rowTotals: Record<string, number> = {};
        const colTotals: Record<string, number> = {};
        let grandTotal = 0;

        for(let i=0; i<dataset.totalRows; i++) {
            const rVal = col1[i];
            const cVal = col2[i];
            if(!table[rVal]) table[rVal] = {};
            table[rVal][cVal] = (table[rVal][cVal] || 0) + 1;
            rowTotals[rVal] = (rowTotals[rVal] || 0) + 1;
            colTotals[cVal] = (colTotals[cVal] || 0) + 1;
            grandTotal++;
        }

        statistic = 0;
        Object.keys(table).forEach(rKey => {
            Object.keys(table[rKey]).forEach(cKey => {
                const observed = table[rKey][cKey];
                const expected = (rowTotals[rKey] * colTotals[cKey]) / grandTotal;
                statistic += Math.pow(observed - expected, 2) / expected;
            });
        });

        const rows = Object.keys(rowTotals).length;
        const cols = Object.keys(colTotals).length;
        df = (rows - 1) * (cols - 1);
        
        // Rough approx for critical value at alpha 0.05 for small DF
        // For proper implementation we'd need a lookup table
        const chiCritApprox = df + 1.65 * Math.sqrt(2*df); 
        criticalValue = rows > 1 && cols > 1 ? chiCritApprox : 3.84;

        isSignificant = statistic > criticalValue;
        details = `Contingency Table size: ${rows}x${cols}. Total Observations: ${grandTotal}.`;
        insights = [
             isSignificant 
              ? `Significant relationship detected between ${params.targetColumn} and ${params.secondColumn}.`
              : `No significant relationship detected. The variables appear independent.`,
             `Chi² = ${statistic.toFixed(2)} (df=${df})`
        ];
    }

    // ANOVA (One-Way)
    else if (params.type === 'anova') {
        statName = "F";
        if(!params.groupColumn) throw new Error("ANOVA requires a group column");

        const groups: Record<string, number[]> = {};
        let totalSum = 0;
        let N = 0;

        dataset.rows.forEach(r => {
            const gVal = String(r[params.groupColumn!]);
            const val = Number(r[params.targetColumn]);
            if (!isNaN(val)) {
                if(!groups[gVal]) groups[gVal] = [];
                groups[gVal].push(val);
                totalSum += val;
                N++;
            }
        });

        const k = Object.keys(groups).length; // number of groups
        if (k < 2) throw new Error("Need at least 2 groups for ANOVA");
        
        const grandMean = totalSum / N;
        
        let ssb = 0; // Sum of Squares Between
        let ssw = 0; // Sum of Squares Within

        Object.values(groups).forEach(gData => {
            const gMean = gData.reduce((a,b) => a+b,0) / gData.length;
            ssb += gData.length * Math.pow(gMean - grandMean, 2);
            gData.forEach(val => {
                ssw += Math.pow(val - gMean, 2);
            });
        });

        const dfBetween = k - 1;
        const dfWithin = N - k;
        const msb = ssb / dfBetween;
        const msw = ssw / dfWithin;
        
        statistic = msb / msw;
        df = dfBetween; // Usually report df between
        criticalValue = 3.00; // Extremely rough approx for F-dist around (2, >30)

        isSignificant = statistic > criticalValue;
        details = `Groups: ${k}. Between MS: ${msb.toFixed(2)}, Within MS: ${msw.toFixed(2)}.`;
        insights = [
            isSignificant
             ? `At least one group mean is significantly different from the others.`
             : `No significant difference found between the group means.`,
            `F-Statistic = ${statistic.toFixed(2)}`
        ];
    }

    return {
        testName: params.type.toUpperCase(),
        statistic,
        statisticName: statName,
        degreesOfFreedom: df,
        criticalValue,
        isSignificant,
        details,
        insights,
        pValue: isSignificant ? 0.01 : 0.2 // Placeholder
    };
};

export const generateStatistics = (dataset: DataSet): ColumnStats[] => {
  const numericColumns = dataset.columnProfiles
    .filter(p => p.type === 'Number')
    .map(p => p.name);

  return numericColumns.map(colName => {
    const values = dataset.rows
      .map(r => r[colName])
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];
    
    if (values.length === 0) {
      return {
        column: colName, count: 0, mean: 0, median: 0, mode: null, 
        stdDev: 0, min: 0, max: 0, q1: 0, q3: 0
      };
    }

    values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

    // Mode
    const counts: Record<string, number> = {};
    let maxCount = 0;
    let modeVal = values[0];
    for (const v of values) {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > maxCount) {
        maxCount = counts[v];
        modeVal = v;
      }
    }

    // Std Dev
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];

    return {
      column: colName, count: values.length, mean, median, mode: modeVal, stdDev, min, max, q1, q3
    };
  });
};

export const calculateCorrelations = (dataset: DataSet): CorrelationResult[] => {
  const numericColumns = dataset.columnProfiles
    .filter(p => p.type === 'Number')
    .map(p => p.name);

  const results: CorrelationResult[] = [];
  const colData: Record<string, number[]> = {};
  
  numericColumns.forEach(col => {
    colData[col] = dataset.rows.map(r => {
      const val = r[col];
      return (typeof val === 'number' && !isNaN(val)) ? val : NaN;
    });
  });

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      const data1 = colData[col1];
      const data2 = colData[col2];
      const validPairs: [number, number][] = [];
      
      for (let k = 0; k < dataset.totalRows; k++) {
        if (!isNaN(data1[k]) && !isNaN(data2[k])) validPairs.push([data1[k], data2[k]]);
      }

      if (validPairs.length < 2) {
        results.push({ column1: col1, column2: col2, value: 0 });
        continue;
      }

      const n = validPairs.length;
      const sumX = validPairs.reduce((acc, p) => acc + p[0], 0);
      const sumY = validPairs.reduce((acc, p) => acc + p[1], 0);
      const sumXY = validPairs.reduce((acc, p) => acc + p[0] * p[1], 0);
      const sumX2 = validPairs.reduce((acc, p) => acc + Math.pow(p[0], 2), 0);
      const sumY2 = validPairs.reduce((acc, p) => acc + Math.pow(p[1], 2), 0);

      const numerator = (n * sumXY) - (sumX * sumY);
      const denominator = Math.sqrt(((n * sumX2) - Math.pow(sumX, 2)) * ((n * sumY2) - Math.pow(sumY, 2)));
      results.push({ column1: col1, column2: col2, value: denominator === 0 ? 0 : numerator / denominator });
    }
  }
  return results.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
};

export const getHistogramData = (dataset: DataSet, column: string, bins: number = 10) => {
  const values = dataset.rows
    .map(r => r[column])
    .filter(v => typeof v === 'number' && !isNaN(v)) as number[];
  
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const binSize = range / bins;

  if (range === 0) return [{ name: String(min), count: values.length }];

  const histogram = new Array(bins).fill(0).map((_, i) => ({
    name: `${(min + i * binSize).toFixed(1)}`,
    count: 0
  }));

  values.forEach(v => {
    let bucketIndex = Math.floor((v - min) / binSize);
    if (bucketIndex >= bins) bucketIndex = bins - 1;
    histogram[bucketIndex].count++;
  });
  return histogram;
};

export const getCategoryCounts = (dataset: DataSet, column: string, limit: number = 10) => {
  const counts: Record<string, number> = {};
  dataset.rows.forEach(row => {
    const val = row[column];
    if (val !== null && val !== undefined) {
      const strVal = String(val);
      counts[strVal] = (counts[strVal] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

export const getScatterData = (dataset: DataSet, xCol: string, yCol: string, limit: number = 500) => {
  const data = [];
  const step = Math.max(1, Math.floor(dataset.totalRows / limit));
  for(let i=0; i<dataset.totalRows; i += step) {
      const row = dataset.rows[i];
      const x = row[xCol];
      const y = row[yCol];
      if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
          data.push({ x, y });
      }
  }
  return data;
};

export const getBarAggregateData = (dataset: DataSet, groupCol: string, valCol: string) => {
  const groups: Record<string, { sum: number; count: number }> = {};
  dataset.rows.forEach(row => {
      const group = String(row[groupCol] || 'Unknown');
      const val = Number(row[valCol]);
      if (!isNaN(val)) {
          if (!groups[group]) groups[group] = { sum: 0, count: 0 };
          groups[group].sum += val;
          groups[group].count += 1;
      }
  });
  return Object.entries(groups)
      .map(([name, { sum, count }]) => ({ name, value: sum / count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
};
