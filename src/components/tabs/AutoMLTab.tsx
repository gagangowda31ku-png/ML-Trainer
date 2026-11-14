import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Bot,
  Sparkles,
  ArrowRight,
  Trophy,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { ModelResult } from '../../types';

export const AutoMLTab: React.FC = () => {
  const {
    profile,
    models,
    bestModel,
    selectedModel,
    setSelectedModel,
    isTraining,
    trainingProgress,
    trainingError,
    executeAutoML,
    setActiveTab,
    taskType,
  } = useData();

  const [activeInspectorTab, setActiveInspectorTab] = useState<'metrics' | 'curves' | 'hyperparameters' | 'residuals'>('metrics');

  if (!profile) {
    return (
      <div className="text-center py-20">
        <Bot className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Active</h3>
        <p className="text-sm text-slate-400 mt-1">Please select or upload a dataset first.</p>
      </div>
    );
  }

  const handleTrain = () => {
    executeAutoML();
  };

  const isClassification = taskType === 'binary_classification' || taskType === 'multiclass_classification' || profile.recommendedTaskType !== 'regression';
  const inspected = selectedModel || bestModel || models[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              AutoML & Multi-Model Leaderboard
            </h1>
            <span className="rounded-md bg-cyan-950 px-2 py-0.5 text-xs font-mono text-cyan-400 border border-cyan-800">
              Pipeline Stage 5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated model training, 5-Fold Stratified Cross-Validation, hyperparameter grid search, and generalization gap scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTrain}
            disabled={isTraining}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isTraining ? (
              <>
                <Cpu className="h-4 w-4 animate-spin" />
                <span>{trainingProgress?.modelName || 'Training Models...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{models.length > 0 ? 'Re-Train AutoML Models' : 'Start AutoML Training'}</span>
              </>
            )}
          </button>

          {bestModel && (
            <button
              onClick={() => setActiveTab('shap')}
              className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <span>Explain with SHAP</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Training Error Notice */}
      {trainingError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">Model Training Alert</span>
              <span>{trainingError}</span>
            </div>
          </div>
          <button
            onClick={handleTrain}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
          >
            Retry AutoML
          </button>
        </div>
      )}

      {/* Live Training Banner if active */}
      {isTraining && (
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 p-6 shadow-xl animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400 animate-spin" />
              AutoML Optimization in Progress
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">{trainingProgress?.progress || 25}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${trainingProgress?.progress || 25}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">{trainingProgress?.modelName}</p>
        </div>
      )}

      {/* Model Leaderboard */}
      {models.length > 0 ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  AutoML Model Leaderboard
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by {models[0]?.primaryMetricName}. Click any candidate to inspect performance curves and metrics.
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {models.length} Candidates Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase">
                  <tr>
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Model Architecture</th>
                    <th className="py-3 px-3">Family</th>
                    <th className="py-3 px-3">{models[0]?.primaryMetricName} (Primary)</th>
                    <th className="py-3 px-3">{isClassification ? 'Accuracy' : 'RMSE'}</th>
                    <th className="py-3 px-3">{isClassification ? 'ROC-AUC' : 'MAE'}</th>
                    <th className="py-3 px-3">5-Fold CV Score (μ ± σ)</th>
                    <th className="py-3 px-3">Reliability</th>
                    <th className="py-3 px-3">Overfitting</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {models.map((model, idx) => {
                    const isWinner = idx === 0;
                    const isSelected = (inspected?.id === model.id);

                    return (
                      <tr
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-950/30 font-semibold' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          {isWinner ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                              1
                            </span>
                          ) : (
                            <span className="text-slate-500">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans font-bold text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            {isWinner && (
                              <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-800/60">
                                TOP MODEL
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                            {model.family}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-cyan-400 font-bold text-sm">
                          {model.primaryMetricValue}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {isClassification ? model.metrics.accuracy : model.metrics.rmse}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {isClassification ? model.metrics.rocAuc : model.metrics.mae}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {model.metrics.cvMean} ± {model.metrics.cvStd}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[11px] font-bold ${
                            model.reliabilityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {model.reliabilityScore}/100
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                            model.reliabilityDetails?.overfittingRisk === 'Low'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {model.reliabilityDetails?.overfittingRisk}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedModel(model); }}
                            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-slate-200"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Inspector Panel */}
          {inspected && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      Model Inspector: <span className="text-cyan-400">{inspected.name}</span>
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      Family: {inspected.family}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Train: {inspected.trainTimeMs}ms • Inference: {inspected.inferenceTimeMs}ms • Reliability: {inspected.reliabilityScore}/100
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveInspectorTab('metrics')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      activeInspectorTab === 'metrics' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Diagnostics & Matrix
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('curves')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      activeInspectorTab === 'curves' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ROC / PR Curves
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('hyperparameters')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      activeInspectorTab === 'hyperparameters' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Hyperparameters
                  </button>
                </div>
              </div>

              {/* INSPECTOR TAB 1: METRICS & CONFUSION MATRIX */}
              {activeInspectorTab === 'metrics' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Confusion Matrix (Classification) or Residuals Summary (Regression) */}
                  {isClassification && inspected.confusionMatrix ? (
                    <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Confusion Matrix (Test Evaluation)
                      </h4>

                      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto font-mono text-center">
                        <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-4">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">True Negative (TN)</span>
                          <span className="text-3xl font-black text-white">{inspected.confusionMatrix.matrix[0][0]}</span>
                        </div>
                        <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-4">
                          <span className="text-[10px] text-rose-400 uppercase font-bold block">False Positive (FP)</span>
                          <span className="text-3xl font-black text-rose-200">{inspected.confusionMatrix.matrix[0][1]}</span>
                        </div>
                        <div className="rounded-xl bg-rose-950/40 border border-rose-900/60 p-4">
                          <span className="text-[10px] text-rose-400 uppercase font-bold block">False Negative (FN)</span>
                          <span className="text-3xl font-black text-rose-200">{inspected.confusionMatrix.matrix[1][0]}</span>
                        </div>
                        <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-4">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">True Positive (TP)</span>
                          <span className="text-3xl font-black text-white">{inspected.confusionMatrix.matrix[1][1]}</span>
                        </div>
                      </div>
                    </div>
                  ) : inspected.residuals ? (
                    <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Residuals Scatter (Actual vs Predicted)
                      </h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="actual" name="Actual" stroke="#64748b" fontSize={10} />
                            <YAxis dataKey="predicted" name="Predicted" stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                            <Scatter data={inspected.residuals} fill="#06b6d4" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : null}

                  {/* Detailed Metric List */}
                  <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 font-mono text-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-sans">
                      Performance Metrics & Generalization
                    </h4>

                    {isClassification ? (
                      <>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">Accuracy:</span>
                          <span className="text-white font-bold">{inspected.metrics.accuracy}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">Precision:</span>
                          <span className="text-cyan-300 font-bold">{inspected.metrics.precision}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">Recall:</span>
                          <span className="text-cyan-300 font-bold">{inspected.metrics.recall}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">F1-Score:</span>
                          <span className="text-emerald-400 font-bold">{inspected.metrics.f1Score}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">ROC-AUC:</span>
                          <span className="text-purple-400 font-bold">{inspected.metrics.rocAuc}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">R² Score:</span>
                          <span className="text-emerald-400 font-bold">{inspected.metrics.r2}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">MAE (Mean Absolute Error):</span>
                          <span className="text-cyan-300 font-bold">{inspected.metrics.mae}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">RMSE:</span>
                          <span className="text-white font-bold">{inspected.metrics.rmse}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">MAPE:</span>
                          <span className="text-slate-200">{inspected.metrics.mape}%</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">Train Score vs Test Score:</span>
                      <span className="text-slate-200">
                        {inspected.reliabilityDetails?.trainScore} (Train) vs {inspected.reliabilityDetails?.testScore} (Test)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* INSPECTOR TAB 2: ROC / PR CURVES */}
              {activeInspectorTab === 'curves' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inspected.rocCurve && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <h4 className="text-xs font-bold text-slate-300 mb-2">ROC Curve (Receiver Operating Characteristic)</h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={inspected.rocCurve}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="x" stroke="#64748b" fontSize={10} label={{ value: 'False Positive Rate', position: 'bottom', offset: -2 }} />
                            <YAxis dataKey="y" stroke="#64748b" fontSize={10} label={{ value: 'True Positive Rate', angle: -90, position: 'left' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                            <Line type="monotone" dataKey="y" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {inspected.prCurve && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <h4 className="text-xs font-bold text-slate-300 mb-2">Precision-Recall Curve</h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={inspected.prCurve}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="x" stroke="#64748b" fontSize={10} label={{ value: 'Recall', position: 'bottom', offset: -2 }} />
                            <YAxis dataKey="y" stroke="#64748b" fontSize={10} label={{ value: 'Precision', angle: -90, position: 'left' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                            <Line type="monotone" dataKey="y" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INSPECTOR TAB 3: HYPERPARAMETERS */}
              {activeInspectorTab === 'hyperparameters' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Configured Hyperparameters & Architectures
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    {Object.entries(inspected.hyperparameters).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">{key}</span>
                        <span className="text-slate-200 font-bold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <Bot className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Models Not Yet Trained</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Start AutoML Training" to run 5-Fold cross-validation across ensemble and boosting algorithms.
          </p>
          <button
            onClick={handleTrain}
            className="mt-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            Start AutoML Training
          </button>
        </div>
      )}
    </div>
  );
};
