export type DataType = 'numerical' | 'categorical' | 'datetime' | 'boolean' | 'id' | 'constant';

export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression' | 'clustering';

export interface ColumnStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  q25: number;
  q75: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface CategoryFreq {
  label: string;
  count: number;
  percentage: number;
}

export interface ColumnProfile {
  name: string;
  type: DataType;
  inferredType: string;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  isTargetCandidate: boolean;
  targetScore: number;
  targetReason?: string;
  isIdColumn: boolean;
  isConstantColumn: boolean;
  stats?: ColumnStats;
  outlierCount: number;
  outlierPercentage: number;
  topCategories?: CategoryFreq[];
  sampleValues: any[];
}

export interface DataHealthScore {
  overall: number; // 0 - 100
  completeness: number; // 0 - 100
  validity: number; // 0 - 100
  uniqueness: number; // 0 - 100
  distributionSanity: number; // 0 - 100
  cardinalityBalance: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'Optimal' | 'Good' | 'Acceptable' | 'Needs Attention' | 'Critical';
  issues: { severity: 'high' | 'medium' | 'low'; message: string; column?: string }[];
  suggestions: string[];
}

export interface DatasetProfile {
  datasetName: string;
  totalRows: number;
  totalColumns: number;
  numericalCount: number;
  categoricalCount: number;
  datetimeCount: number;
  booleanCount: number;
  duplicateRows: number;
  duplicatePercentage: number;
  totalMissingCells: number;
  totalMissingPercentage: number;
  memoryUsageKb: number;
  columns: ColumnProfile[];
  recommendedTarget: string;
  recommendedTaskType: TaskType;
  healthScore: DataHealthScore;
}

export interface CleaningConfig {
  imputeMissingStrategy: 'mean' | 'median' | 'mode' | 'knn_simple' | 'drop_row';
  imputeCategoricalStrategy: 'mode' | 'missing_label' | 'drop_row';
  outlierHandling: 'clip_iqr' | 'zscore_filter' | 'keep';
  removeDuplicates: boolean;
  dropConstantColumns: boolean;
  dropHighCardinalityIds: boolean;
  cardinalityThreshold: number; // default 0.9 (90% unique)
  encodingStrategy: 'auto' | 'one_hot' | 'ordinal' | 'frequency';
  scalingStrategy: 'standard' | 'minmax' | 'robust' | 'none';
}

export interface CleaningStepLog {
  stage: string;
  action: string;
  affectedColumns?: string[];
  impactDescription: string;
  itemsAffected: number;
}

export interface CleaningAudit {
  beforeRows: number;
  afterRows: number;
  beforeColumns: number;
  afterColumns: number;
  missingImputed: number;
  duplicatesRemoved: number;
  outliersClipped: number;
  droppedColumns: { name: string; reason: string }[];
  encodedColumns: { original: string; newColumns: string[] }[];
  scaledColumns: string[];
  executionTimeMs: number;
  logs: CleaningStepLog[];
}

export interface CorrelationItem {
  featureA: string;
  featureB: string;
  correlation: number;
}

export interface DistributionBin {
  binRange: string;
  min: number;
  max: number;
  count: number;
  density: number;
}

export interface BoxPlotItem {
  feature: string;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  outliers: number[];
}

export interface BivariateItem {
  categoryOrBin: string;
  targetMeanOrCount: number;
  count: number;
  proportion?: number;
}

export interface EDAResult {
  correlationMatrix: {
    features: string[];
    matrix: number[][];
    topCorrelations: CorrelationItem[];
  };
  numericalDistributions: Record<string, DistributionBin[]>;
  boxPlots: BoxPlotItem[];
  categoricalDistributions: Record<string, CategoryFreq[]>;
  targetBivariate: Record<string, BivariateItem[]>;
  missingnessSummary: { feature: string; missingCount: number; percentage: number }[];
  targetDistribution: CategoryFreq[] | DistributionBin[];
}

export interface FeatureEngineeringConfig {
  generateInteractions: boolean;
  applyLogTransforms: boolean;
  binContinuousFeatures: boolean;
  generateDateFeatures: boolean;
  selectTopFeatures: boolean;
  topKFeatures: number;
}

export interface FeatureEngineeringAudit {
  initialFeatureCount: number;
  engineeredFeatureCount: number;
  newFeatures: { name: string; type: 'interaction' | 'log_transform' | 'binned' | 'datetime'; formula: string }[];
  droppedBySelection: string[];
  finalFeatureNames: string[];
}

export interface ModelMetrics {
  // Classification
  accuracy?: number;
  balancedAccuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rocAuc?: number;
  logLoss?: number;
  
  // Regression
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  adjustedR2?: number;
  mape?: number;

  // Cross-Validation
  cvScores: number[];
  cvMean: number;
  cvStd: number;
}

export interface ConfusionMatrixData {
  matrix: number[][]; // [actual][predicted]
  labels: string[];
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface ModelResult {
  id: string;
  name: string;
  family: 'Linear' | 'Tree' | 'Ensemble' | 'Boosting' | 'Kernel' | 'Neighbor' | 'Bayes';
  taskType: TaskType;
  hyperparameters: Record<string, any>;
  metrics: ModelMetrics;
  primaryMetricName: string;
  primaryMetricValue: number;
  trainTimeMs: number;
  inferenceTimeMs: number;
  confusionMatrix?: ConfusionMatrixData;
  rocCurve?: CurvePoint[];
  prCurve?: CurvePoint[];
  residuals?: { actual: number; predicted: number; residual: number }[];
  featureImportances: { feature: string; importance: number; normalized: number }[];
  reliabilityScore: number; // 0 - 100
  reliabilityDetails: {
    overfittingRisk: 'Low' | 'Moderate' | 'High';
    trainScore: number;
    testScore: number;
    cvStability: 'High' | 'Moderate' | 'Low';
    generalizationGap: number;
  };
}

export interface LocalSHAPContribution {
  feature: string;
  value: any;
  contribution: number; // positive pushes toward prediction, negative away
  displayValue: string;
}

export interface SHAPSummary {
  baseValue: number;
  targetName: string;
  globalImportance: { feature: string; meanAbsoluteShap: number; rank: number }[];
  beeswarmData: {
    feature: string;
    featureValue: number;
    normalizedFeatureValue: number; // 0 to 1 (blue to red)
    shapValue: number;
  }[];
  sampleLocalExplanations: {
    rowId: number;
    actualTarget: any;
    predictedTarget: any;
    contributions: LocalSHAPContribution[];
  }[];
}

export interface DriftFeatureResult {
  feature: string;
  type: DataType;
  testMethod: 'Kolmogorov-Smirnov' | 'Population Stability Index (PSI)' | 'Chi-Square';
  statistic: number;
  pValue?: number;
  psiScore?: number;
  isDrifted: boolean;
  driftSeverity: 'None' | 'Low' | 'Medium' | 'Critical';
  referenceMean?: number;
  currentMean?: number;
  distributionComparison: {
    label: string;
    reference: number;
    current: number;
  }[];
}

export interface DataDriftReport {
  overallDriftScore: number; // 0 - 100
  isDriftDetected: boolean;
  driftedFeaturesCount: number;
  totalFeaturesEvaluated: number;
  referenceRows: number;
  currentRows: number;
  features: DriftFeatureResult[];
  detectedAt: string;
}

export interface AIExecutiveInsights {
  executiveSummary: string;
  keyFindings: string[];
  businessRecommendations: string[];
  risksAndCaveats: string[];
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  contextSnippet?: string;
  suggestedQuestions?: string[];
}

export interface ExperimentRun {
  id: string;
  datasetName: string;
  targetColumn: string;
  taskType: TaskType;
  totalRows: number;
  totalCols: number;
  healthScore: number;
  bestModelName: string;
  bestMetricName: string;
  bestMetricValue: number;
  modelsCount: number;
  createdAt: string;
}
