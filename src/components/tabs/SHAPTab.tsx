import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Brain,
  Sparkles,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

export const SHAPTab: React.FC = () => {
  const {
    profile,
    bestModel,
    shapSummary,
    setActiveTab,
  } = useData();

  const [selectedInstanceIdx, setSelectedInstanceIdx] = useState(0);

  if (!bestModel || !shapSummary) {
    return (
      <div className="text-center py-20">
        <Brain className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Trained Model for SHAP Analysis</h3>
        <p className="text-sm text-slate-400 mt-1">Please train AutoML models first to calculate Shapley values.</p>
        <button
          onClick={() => setActiveTab('automl')}
          className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
        >
          Go to AutoML
        </button>
      </div>
    );
  }

  const selectedLocal = shapSummary.sampleLocalExplanations[selectedInstanceIdx] || shapSummary.sampleLocalExplanations[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              SHAP & Model Explainability (XAI)
            </h1>
            <span className="rounded-md bg-purple-950 px-2 py-0.5 text-xs font-mono text-purple-400 border border-purple-800">
              Pipeline Stage 6
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cooperative game theory Shapley values evaluating global feature importances, beeswarm impact directions, and individual sample waterfalls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('playground')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <span>Prediction Playground</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Feature Importance & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Global Feature Importance (Mean |SHAP Value|)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Top predictive drivers for {bestModel.name}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              E[f(x)] = {shapSummary.baseValue}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shapSummary.globalImportance.slice(0, 8)}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}`, 'Mean |SHAP|']}
                />
                <Bar dataKey="meanAbsoluteShap" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Key Takeaways */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              Explainability Takeaways
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {shapSummary.globalImportance.slice(0, 4).map((item, idx) => (
                <div key={item.feature} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-bold text-cyan-300">#{idx + 1} {item.feature}</span>
                    <span className="text-purple-400">{item.meanAbsoluteShap}</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-400 mt-1">
                    Accounts for roughly {(item.meanAbsoluteShap * 100).toFixed(0)}% marginal variance in target predictions.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            💡 SHAP attributes the exact marginal contribution of each variable fairly across all possible feature subsets.
          </div>
        </div>
      </div>

      {/* SHAP Beeswarm Distribution Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">SHAP Beeswarm Summary Plot</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Horizontal position indicates impact on prediction. Color shows feature value (Low = Blue, High = Rose).
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Low Value</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> High Value</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="shapValue" type="number" name="SHAP Value" stroke="#64748b" fontSize={11} label={{ value: 'SHAP value (impact on model output)', position: 'bottom', offset: -5 }} />
              <YAxis dataKey="feature" type="category" name="Feature" stroke="#64748b" fontSize={11} width={110} />
              <ZAxis range={[20, 20]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val: any, name: any, item: any) => [
                  `SHAP: ${item.payload.shapValue} (Raw Value: ${item.payload.featureValue})`,
                  item.payload.feature
                ]}
              />
              <Scatter data={shapSummary.beeswarmData} fill="#06b6d4" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Local Instance Waterfall Explanations */}
      {selectedLocal && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Individual Instance Waterfall Explanation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect why the model arrived at a specific decision for a single observation.
              </p>
            </div>

            {/* Instance Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sample Row:</span>
              <div className="flex items-center gap-1">
                {shapSummary.sampleLocalExplanations.map((loc, idx) => (
                  <button
                    key={loc.rowId}
                    onClick={() => setSelectedInstanceIdx(idx)}
                    className={`rounded px-2.5 py-1 text-xs font-mono font-semibold transition-colors ${
                      selectedInstanceIdx === idx
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    #{loc.rowId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {/* Base Value Line */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 font-bold">Base Expectation $E[f(x)]$</span>
              <span className="text-slate-200 font-bold">{shapSummary.baseValue}</span>
            </div>

            {/* Feature contributions */}
            {selectedLocal.contributions.map((c) => {
              const isPositive = c.contribution > 0;

              return (
                <div
                  key={c.feature}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs font-mono ${
                    isPositive
                      ? 'bg-cyan-950/20 border-cyan-900/40 text-cyan-200'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isPositive ? 'bg-cyan-400' : 'bg-rose-400'}`} />
                    <span className="font-bold text-slate-200">{c.feature}</span>
                    <span className="text-slate-400 font-sans text-[11px]">({c.displayValue})</span>
                  </div>
                  <span className="font-bold">
                    {isPositive ? `+${c.contribution}` : c.contribution}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
