

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export enum ColumnType {
  Number = 'Number',
  String = 'String',
  Date = 'Date',
  Boolean = 'Boolean',
  Mixed = 'Mixed',
  Unknown = 'Unknown',
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  example: string | number | boolean | null;
}

export interface DataSet {
  fileName: string;
  fileSize: number;
  totalRows: number;
  headers: string[];
  rows: DataRow[]; // Stores all rows
  columnProfiles: ColumnProfile[];
}

export interface AIAnalysisResult {
  summary: string;
  dataQualityScore: number;
  issues: string[];
  recommendations: string[];
}

// Cleaning specific types
export type ImputationStrategy = 'mean' | 'median' | 'mode' | 'remove_row' | 'fill_zero' | 'drop_column';
export type TypeCastTarget = 'Number' | 'String' | 'Date' | 'Boolean';

export interface CleaningAction {
  type: 'impute' | 'remove_duplicates' | 'normalize_headers' | 'cast_type' | 'drop_column';
  column?: string;
  parameters?: {
    strategy?: ImputationStrategy;
    targetType?: TypeCastTarget;
  };
  description: string;
}

export interface CleaningPlan {
  actions: CleaningAction[];
  summary: string;
}

// Transformation Types
export type EncodingType = 'label' | 'one_hot';
export type ScalingType = 'min_max' | 'z_score' | 'log';

export type TransformationMethod = EncodingType | ScalingType;

export interface TransformationAction {
  column: string;
  method: TransformationMethod;
}

// Statistics types
export interface ColumnStats {
  column: string;
  count: number;
  mean: number;
  median: number;
  mode: number | string | null;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
}

export interface CorrelationResult {
  column1: string;
  column2: string;
  value: number;
}

// Hypothesis Testing Types
export type TestType = 'z-test' | 't-test' | 'chi-square' | 'anova';

export interface TestParams {
  type: TestType;
  targetColumn: string; // The main variable (e.g., numeric for T-test/ANOVA)
  groupColumn?: string; // The grouping variable (e.g., categorical for ANOVA)
  secondColumn?: string; // The second variable (e.g., numeric for T-test 2-sample)
}

export interface TestResult {
  testName: string;
  statistic: number;
  statisticName: string; // "t", "z", "F", "Chi2"
  degreesOfFreedom: number;
  pValue?: number; // Optional if we can't easily calc exact p-value in JS
  criticalValue: number; // At alpha = 0.05
  isSignificant: boolean;
  details: string;
  insights: string[];
}
