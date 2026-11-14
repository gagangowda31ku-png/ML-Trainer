import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  AIExecutiveInsights,
  ChatMessage,
  CleaningAudit,
  CleaningConfig,
  DataDriftReport,
  DatasetProfile,
  EDAResult,
  ExperimentRun,
  FeatureEngineeringAudit,
  FeatureEngineeringConfig,
  ModelResult,
  SHAPSummary,
  TaskType,
} from '../types';
import { parseCSVToRows, profileDataset } from '../services/dataProfiler';
import { runDataCleaning } from '../services/dataCleaner';
import { generateEDA } from '../services/edaEngine';
import { runFeatureEngineering } from '../services/featureEngineer';
import { MLDataset, prepareMLData, runAutoML } from '../services/mlEngine';
import { evaluateDataDrift, generateSimulatedDrift } from '../services/driftEngine';
import { SAMPLE_DATASETS } from '../services/sampleDatasets';
import * as XLSX from 'xlsx';

export type TabType = 
  | 'landing'
  | 'upload'
  | 'profiling'
  | 'cleaning'
  | 'eda'
  | 'engineering'
  | 'automl'
  | 'shap'
  | 'playground'
  | 'drift'
  | 'executive'
  | 'chat';

interface DataContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  
  // Data state
  datasetName: string;
  rawHeaders: string[];
  rawRows: Record<string, any>[];
  profile: DatasetProfile | null;
  targetColumn: string;
  taskType: TaskType;
  setTargetColumn: (col: string) => void;
  setTaskType: (type: TaskType) => void;

  // Pipeline states
  cleaningConfig: CleaningConfig;
  setCleaningConfig: React.Dispatch<React.SetStateAction<CleaningConfig>>;
  cleanedRows: Record<string, any>[] | null;
  cleaningAudit: CleaningAudit | null;

  edaResult: EDAResult | null;

  feConfig: FeatureEngineeringConfig;
  setFeConfig: React.Dispatch<React.SetStateAction<FeatureEngineeringConfig>>;
  feAudit: FeatureEngineeringAudit | null;
  engineeredRows: Record<string, any>[] | null;

  mlDataset: MLDataset | null;
  isTraining: boolean;
  trainingProgress: { modelName: string; progress: number } | null;
  trainingError: string | null;
  setTrainingError: (err: string | null) => void;
  models: ModelResult[];
  selectedModel: ModelResult | null;
  setSelectedModel: (m: ModelResult | null) => void;
  bestModel: ModelResult | null;
  shapSummary: SHAPSummary | null;

  driftReport: DataDriftReport | null;
  isDriftSimulated: boolean;

  executiveInsights: AIExecutiveInsights | null;
  isGeneratingInsights: boolean;

  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  experimentHistory: ExperimentRun[];

  // Actions
  loadSampleDataset: (id: string) => Promise<void>;
  uploadCustomFile: (file: File) => Promise<void>;
  executeCleaning: () => void;
  executeEDA: () => void;
  executeFeatureEngineering: () => void;
  executeAutoML: () => Promise<void>;
  executeAutonomousEndToEnd: () => Promise<void>;
  fetchAIExecutiveInsights: () => Promise<void>;
  sendChatMessage: (msg: string) => Promise<void>;
  triggerSimulatedDrift: () => void;
  resetToBaselineData: () => void;
  resetAll: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultCleaningConfig: CleaningConfig = {
  imputeMissingStrategy: 'median',
  imputeCategoricalStrategy: 'mode',
  outlierHandling: 'clip_iqr',
  removeDuplicates: true,
  dropConstantColumns: true,
  dropHighCardinalityIds: true,
  cardinalityThreshold: 0.9,
  encodingStrategy: 'auto',
  scalingStrategy: 'standard',
};

const defaultFeConfig: FeatureEngineeringConfig = {
  generateInteractions: true,
  applyLogTransforms: true,
  binContinuousFeatures: true,
  generateDateFeatures: true,
  selectTopFeatures: false,
  topKFeatures: 12,
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [datasetName, setDatasetName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [taskType, setTaskType] = useState<TaskType>('binary_classification');

  const [cleaningConfig, setCleaningConfig] = useState<CleaningConfig>(defaultCleaningConfig);
  const [cleanedRows, setCleanedRows] = useState<Record<string, any>[] | null>(null);
  const [cleaningAudit, setCleaningAudit] = useState<CleaningAudit | null>(null);

  const [edaResult, setEdaResult] = useState<EDAResult | null>(null);

  const [feConfig, setFeConfig] = useState<FeatureEngineeringConfig>(defaultFeConfig);
  const [feAudit, setFeAudit] = useState<FeatureEngineeringAudit | null>(null);
  const [engineeredRows, setEngineeredRows] = useState<Record<string, any>[] | null>(null);

  const [mlDataset, setMlDataset] = useState<MLDataset | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<{ modelName: string; progress: number } | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelResult | null>(null);
  const [bestModel, setBestModel] = useState<ModelResult | null>(null);
  const [shapSummary, setShapSummary] = useState<SHAPSummary | null>(null);

  const [driftReport, setDriftReport] = useState<DataDriftReport | null>(null);
  const [isDriftSimulated, setIsDriftSimulated] = useState<boolean>(false);

  const [executiveInsights, setExecutiveInsights] = useState<AIExecutiveInsights | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "👋 Welcome to **Autonomous Data Scientist**! I am your AI Co-Pilot. Upload a dataset or load one of our pre-built benchmark datasets to begin automated profiling, cleaning, EDA, AutoML training, and SHAP explainability.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        "What are the top predictive features?",
        "Why did the top model achieve best accuracy?",
        "What business interventions do you recommend?",
        "Explain the data health and missingness risks."
      ]
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [experimentHistory, setExperimentHistory] = useState<ExperimentRun[]>([]);

  // Apply dark class to documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load a built-in sample dataset
  const loadSampleDataset = async (id: string) => {
    const sample = SAMPLE_DATASETS.find(s => s.id === id) || SAMPLE_DATASETS[0];
    const { headers, rows } = parseCSVToRows(sample.csvData);
    
    setDatasetName(sample.name);
    setRawHeaders(headers);
    setRawRows(rows);

    const initialProfile = profileDataset(sample.name, headers, rows);
    setProfile(initialProfile);
    setTargetColumn(sample.targetColumn || initialProfile.recommendedTarget);
    setTaskType(sample.taskType || initialProfile.recommendedTaskType);

    // Reset downstream
    setCleanedRows(null);
    setCleaningAudit(null);
    setEdaResult(null);
    setEngineeredRows(null);
    setFeAudit(null);
    setMlDataset(null);
    setModels([]);
    setBestModel(null);
    setSelectedModel(null);
    setShapSummary(null);
    setDriftReport(null);
    setExecutiveInsights(null);
    setTrainingError(null);

    setActiveTab('profiling');
  };

  // Upload custom file (CSV, TSV, XLSX)
  const uploadCustomFile = async (file: File) => {
    let headers: string[] = [];
    let rows: Record<string, any>[] = [];

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (json.length > 0) {
        headers = Object.keys(json[0]);
        rows = json;
      }
    } else {
      const text = await file.text();
      const parsed = parseCSVToRows(text);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (rows.length === 0) {
      throw new Error("Unable to parse rows from uploaded file. Please check file format.");
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setDatasetName(cleanName);
    setRawHeaders(headers);
    setRawRows(rows);

    const initialProfile = profileDataset(cleanName, headers, rows);
    setProfile(initialProfile);
    setTargetColumn(initialProfile.recommendedTarget);
    setTaskType(initialProfile.recommendedTaskType);

    // Reset downstream
    setCleanedRows(null);
    setCleaningAudit(null);
    setEdaResult(null);
    setEngineeredRows(null);
    setFeAudit(null);
    setMlDataset(null);
    setModels([]);
    setBestModel(null);
    setSelectedModel(null);
    setShapSummary(null);
    setDriftReport(null);
    setExecutiveInsights(null);
    setTrainingError(null);

    setActiveTab('profiling');
  };

  // 1. Data Cleaning
  const executeCleaning = () => {
    if (!profile || rawRows.length === 0) return;
    const target = targetColumn || profile.recommendedTarget;
    const { cleanedRows: cleaned, audit } = runDataCleaning(rawRows, profile, cleaningConfig, target);
    setCleanedRows(cleaned);
    setCleaningAudit(audit);
    
    // Reset downstream states that depend on old rows
    setEngineeredRows(null);
    setFeAudit(null);
    setModels([]);
    setBestModel(null);
    setSelectedModel(null);
    setShapSummary(null);
    setDriftReport(null);
    setTrainingError(null);
  };

  // 2. EDA
  const executeEDA = () => {
    if (!profile || rawRows.length === 0) return;
    const rowsToUse = cleanedRows || rawRows;
    const target = targetColumn || profile.recommendedTarget;
    const eda = generateEDA(rowsToUse, profile, target);
    setEdaResult(eda);
  };

  // 3. Feature Engineering
  const executeFeatureEngineering = () => {
    const rowsToUse = cleanedRows || rawRows;
    if (!profile || rowsToUse.length === 0) return;
    const target = targetColumn || profile?.recommendedTarget || '';
    const { engineeredRows: engRows, audit } = runFeatureEngineering(rowsToUse, target, feConfig);
    setEngineeredRows(engRows);
    setFeAudit(audit);

    // Reset models downstream
    setModels([]);
    setBestModel(null);
    setSelectedModel(null);
    setShapSummary(null);
    setDriftReport(null);
    setTrainingError(null);
  };

  // 4. AutoML Training
  const executeAutoML = async () => {
    if (!profile) return;
    const rowsToUse = engineeredRows || cleanedRows || rawRows;
    if (!rowsToUse || rowsToUse.length === 0) return;

    const target = targetColumn || profile.recommendedTarget;
    const task = taskType || profile.recommendedTaskType;

    setIsTraining(true);
    setTrainingError(null);
    setTrainingProgress({ modelName: "Preparing feature vectors & splits...", progress: 10 });

    try {
      // Yield to UI thread so progress indicator renders
      await new Promise(r => setTimeout(r, 60));

      const prepared = prepareMLData(rowsToUse, target, task);
      setMlDataset(prepared);

      const { results, shapSummary: shap, bestModel: best } = runAutoML(prepared, (name, prog) => {
        setTrainingProgress({ modelName: `Training ${name}...`, progress: prog });
      });

      if (!results || results.length === 0 || !best) {
        throw new Error("Model training yielded no valid candidate models.");
      }

      setModels(results);
      setBestModel(best);
      setSelectedModel(best);
      setShapSummary(shap);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {}

      // Record experiment history
      const newExperiment: ExperimentRun = {
        id: `exp_${Date.now()}`,
        datasetName: datasetName || "Dataset",
        targetColumn: target,
        taskType: task,
        totalRows: rowsToUse.length,
        totalCols: Object.keys(rowsToUse[0] || {}).length,
        healthScore: profile.healthScore.overall,
        bestModelName: best.name,
        bestMetricName: best.primaryMetricName,
        bestMetricValue: best.primaryMetricValue,
        modelsCount: results.length,
        createdAt: new Date().toLocaleTimeString(),
      };
      setExperimentHistory(prev => [newExperiment, ...prev]);

      // Baseline drift
      const drift = evaluateDataDrift(prepared.rawTestRows, prepared.rawTestRows, profile, target);
      setDriftReport(drift);

      // Trigger background insights
      fetchAIExecutiveInsights();
    } catch (err: any) {
      console.error("AutoML execution error:", err);
      setTrainingError(err?.message || "An error occurred during model training.");
    } finally {
      setIsTraining(false);
      setTrainingProgress(null);
    }
  };

  // 5. Autonomous 1-Click Pipeline (Ingest -> Profile -> Clean -> EDA -> Feature Engineer -> AutoML -> Insights)
  const executeAutonomousEndToEnd = async () => {
    if (!profile) return;
    const target = targetColumn || profile.recommendedTarget;
    const task = taskType || profile.recommendedTaskType;

    setIsTraining(true);
    setTrainingError(null);
    setTrainingProgress({ modelName: "Autonomous Cleaning & Imputation...", progress: 20 });

    try {
      // Step 1: Clean
      const { cleanedRows: cleaned, audit } = runDataCleaning(rawRows, profile, cleaningConfig, target);
      setCleanedRows(cleaned);
      setCleaningAudit(audit);

      // Step 2: EDA
      setTrainingProgress({ modelName: "Generating Exploratory Visuals...", progress: 40 });
      const eda = generateEDA(cleaned, profile, target);
      setEdaResult(eda);

      // Step 3: Feature Engineering
      setTrainingProgress({ modelName: "Synthesizing High-Order Features...", progress: 60 });
      const { engineeredRows: engRows, audit: feAud } = runFeatureEngineering(cleaned, target, feConfig);
      setEngineeredRows(engRows);
      setFeAudit(feAud);

      // Step 4: AutoML
      setTrainingProgress({ modelName: "Cross-validating Ensemble & Boosting Models...", progress: 75 });
      await new Promise(r => setTimeout(r, 80));

      const prepared = prepareMLData(engRows, target, task);
      setMlDataset(prepared);

      const { results, shapSummary: shap, bestModel: best } = runAutoML(prepared, (name, prog) => {
        setTrainingProgress({ modelName: `Optimizing ${name}...`, progress: prog });
      });

      setModels(results);
      setBestModel(best);
      setSelectedModel(best);
      setShapSummary(shap);

      try {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.6 },
        });
      } catch {}

      const drift = evaluateDataDrift(prepared.rawTestRows, prepared.rawTestRows, profile, target);
      setDriftReport(drift);

      setActiveTab('executive');
      fetchAIExecutiveInsights();
    } catch (err: any) {
      console.error("Autonomous Pipeline error:", err);
      setTrainingError(err?.message || "Autonomous pipeline encountered an issue.");
    } finally {
      setIsTraining(false);
      setTrainingProgress(null);
    }
  };

  // 6. AI Executive Insights from Gemini
  const fetchAIExecutiveInsights = async () => {
    if (!profile) return;
    setIsGeneratingInsights(true);

    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetSummary: {
            totalRows: profile.totalRows,
            totalColumns: profile.totalColumns,
          },
          healthScore: profile.healthScore,
          targetColumn: targetColumn || profile.recommendedTarget,
          taskType: taskType || profile.recommendedTaskType,
          topModels: models.slice(0, 3).map(m => ({
            name: m.name,
            metric: m.primaryMetricName,
            value: m.primaryMetricValue,
            reliability: m.reliabilityScore,
          })),
          shapDrivers: shapSummary?.globalImportance?.slice(0, 5) || [],
          cleaningAudit: cleaningAudit ? {
            imputed: cleaningAudit.missingImputed,
            outliers: cleaningAudit.outliersClipped,
            duplicates: cleaningAudit.duplicatesRemoved,
            droppedCols: cleaningAudit.droppedColumns.map(d => d.name),
          } : {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExecutiveInsights({
          ...data,
          generatedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // 7. AI Assistant Chat
  const sendChatMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: chatMessages.slice(-6),
          datasetContext: {
            datasetName,
            totalRows: profile?.totalRows,
            totalColumns: profile?.totalColumns,
            targetColumn: targetColumn || profile?.recommendedTarget,
            taskType: taskType || profile?.recommendedTaskType,
            healthScore: profile?.healthScore.overall,
            cleaningSummary: cleaningAudit ? `${cleaningAudit.missingImputed} missing cells imputed, ${cleaningAudit.outliersClipped} outliers clipped, ${cleaningAudit.duplicatesRemoved} duplicates dropped` : "Raw dataset",
            bestModel: bestModel ? {
              name: bestModel.name,
              metricName: bestModel.primaryMetricName,
              metricValue: bestModel.primaryMetricValue,
            } : null,
            topFeatures: shapSummary?.globalImportance?.slice(0, 5).map(f => f.feature) || [],
            leaderboardSummary: models.map(m => `${m.name} (${m.primaryMetricName}: ${m.primaryMetricValue})`),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "I encountered a network difficulty processing your query. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 8. Inject Simulated Drift
  const triggerSimulatedDrift = () => {
    if (!profile || !mlDataset) return;
    const driftedBatch = generateSimulatedDrift(mlDataset.rawTestRows, 1.6);
    const target = targetColumn || profile.recommendedTarget;
    const report = evaluateDataDrift(mlDataset.rawTestRows, driftedBatch, profile, target);
    setDriftReport(report);
    setIsDriftSimulated(true);
  };

  const resetToBaselineData = () => {
    if (!profile || !mlDataset) return;
    const target = targetColumn || profile.recommendedTarget;
    const report = evaluateDataDrift(mlDataset.rawTestRows, mlDataset.rawTestRows, profile, target);
    setDriftReport(report);
    setIsDriftSimulated(false);
  };

  const resetAll = () => {
    setDatasetName('');
    setRawHeaders([]);
    setRawRows([]);
    setProfile(null);
    setCleanedRows(null);
    setCleaningAudit(null);
    setEdaResult(null);
    setEngineeredRows(null);
    setFeAudit(null);
    setMlDataset(null);
    setModels([]);
    setBestModel(null);
    setSelectedModel(null);
    setShapSummary(null);
    setDriftReport(null);
    setExecutiveInsights(null);
    setTrainingError(null);
    setActiveTab('landing');
  };

  return (
    <DataContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isDarkMode,
        setIsDarkMode,
        datasetName,
        rawHeaders,
        rawRows,
        profile,
        targetColumn,
        taskType,
        setTargetColumn,
        setTaskType,
        cleaningConfig,
        setCleaningConfig,
        cleanedRows,
        cleaningAudit,
        edaResult,
        feConfig,
        setFeConfig,
        feAudit,
        engineeredRows,
        mlDataset,
        isTraining,
        trainingProgress,
        trainingError,
        setTrainingError,
        models,
        selectedModel,
        setSelectedModel,
        bestModel,
        shapSummary,
        driftReport,
        isDriftSimulated,
        executiveInsights,
        isGeneratingInsights,
        chatMessages,
        isChatLoading,
        experimentHistory,
        loadSampleDataset,
        uploadCustomFile,
        executeCleaning,
        executeEDA,
        executeFeatureEngineering,
        executeAutoML,
        executeAutonomousEndToEnd,
        fetchAIExecutiveInsights,
        sendChatMessage,
        triggerSimulatedDrift,
        resetToBaselineData,
        resetAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
