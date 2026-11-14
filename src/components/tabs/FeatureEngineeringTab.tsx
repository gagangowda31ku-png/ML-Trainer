import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  Trash2,
  Layers,
  HelpCircle,
  Hash,
  Activity,
  Cpu
} from 'lucide-react';

export const FeatureEngineeringTab: React.FC = () => {
  const {
    profile,
    feConfig,
    setFeConfig,
    feAudit,
    engineeredRows,
    executeFeatureEngineering,
    executeAutoML,
    setActiveTab,
    isTraining
  } = useData();

  if (!profile) {
    return (
      <div className="text-center py-20">
        <SlidersHorizontal className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Active Dataset</h3>
        <p className="text-sm text-slate-400 mt-1">Please select or upload a dataset first.</p>
      </div>
    );
  }

  const handleRunFE = () => {
    executeFeatureEngineering();
  };

  const handleProceedToAutoML = async () => {
    if (!engineeredRows) {
      executeFeatureEngineering();
    }
    setActiveTab('automl');
    executeAutoML();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Automated Feature Engineering
            </h1>
            <span className="rounded-md bg-purple-950 px-2 py-0.5 text-xs font-mono text-purple-400 border border-purple-800">
              Pipeline Stage 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Construct interaction terms, apply logarithmic transformations on skewed variables, bin continuous features, and filter top signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFE}
            className="flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{feAudit ? 'Re-Engineer Features' : 'Run Feature Engineering'}</span>
          </button>

          <button
            onClick={handleProceedToAutoML}
            disabled={isTraining}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <span>Proceed to AutoML</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Configuration & Audit Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config Options */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-purple-400" />
            Engineering Policies
          </h3>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-colors">
              <input
                type="checkbox"
                checked={feConfig.applyLogTransforms}
                onChange={(e) => setFeConfig({ ...feConfig, applyLogTransforms: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Log-Transformations (log1p)</span>
                <span className="text-[11px] text-slate-400">
                  Normalizes heavy-tailed and right-skewed numerical variables ($|skew| &gt; 0.75$).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-colors">
              <input
                type="checkbox"
                checked={feConfig.generateInteractions}
                onChange={(e) => setFeConfig({ ...feConfig, generateInteractions: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Interaction Terms ($X_i \times X_j$)</span>
                <span className="text-[11px] text-slate-400">
                  Calculates cross-product feature interactions between top correlated pairs.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-colors">
              <input
                type="checkbox"
                checked={feConfig.binContinuousFeatures}
                onChange={(e) => setFeConfig({ ...feConfig, binContinuousFeatures: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Tertile Continuous Binning</span>
                <span className="text-[11px] text-slate-400">
                  Discretizes leading continuous variables into ordinal quantile bands (Low, Mid, High).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-purple-500/40 transition-colors">
              <input
                type="checkbox"
                checked={feConfig.selectTopFeatures}
                onChange={(e) => setFeConfig({ ...feConfig, selectTopFeatures: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
              />
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Variance & Signal Pruning (Top K)</span>
                  {feConfig.selectTopFeatures && (
                    <span className="font-mono text-purple-400 font-bold">{feConfig.topKFeatures}</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block mb-2">
                  Retains highest-variance informative features, dropping low-signal noise.
                </span>
                {feConfig.selectTopFeatures && (
                  <input
                    type="range"
                    min={5}
                    max={Math.max(10, profile.totalColumns)}
                    value={feConfig.topKFeatures}
                    onChange={(e) => setFeConfig({ ...feConfig, topKFeatures: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Feature Audit Results */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Generated Synthetic Features Audit
              </h3>
              {feAudit && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  +{feAudit.engineeredFeatureCount} New Features
                </span>
              )}
            </div>

            {feAudit ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Initial Features</span>
                    <span className="text-xl font-bold font-mono text-slate-200">{feAudit.initialFeatureCount}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Engineered</span>
                    <span className="text-xl font-bold font-mono text-purple-400">+{feAudit.engineeredFeatureCount}</span>
                  </div>
                  <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Final Dimension</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{feAudit.finalFeatureNames.length}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Engineered Column Definitions & Math Formulas
                  </span>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {feAudit.newFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                          <span className="font-bold text-purple-300">{feat.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{feat.formula}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Cpu className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Click "Run Feature Engineering" to generate non-linear interaction terms and log transformations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
