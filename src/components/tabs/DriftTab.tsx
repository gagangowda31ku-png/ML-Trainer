import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Zap,
  TrendingDown,
  Info,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const DriftTab: React.FC = () => {
  const {
    profile,
    bestModel,
    driftReport,
    isDriftSimulated,
    triggerSimulatedDrift,
    resetToBaselineData,
  } = useData();

  const [selectedFeature, setSelectedFeature] = useState<string>('');

  if (!bestModel || !driftReport) {
    return (
      <div className="text-center py-20">
        <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Production Baseline Available</h3>
        <p className="text-sm text-slate-400 mt-1">Train AutoML models first to establish the baseline reference distribution.</p>
      </div>
    );
  }

  const activeFeatureObj = driftReport.features.find(f => f.feature === selectedFeature) || driftReport.features[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Simulation Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Production Data Drift & Distribution Monitoring
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
              driftReport.isDriftDetected 
                ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {driftReport.isDriftDetected ? '⚠️ DRIFT DETECTED' : '✅ BASELINE STABLE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Statistical hypothesis testing (Kolmogorov-Smirnov & Population Stability Index) comparing reference vs production distributions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDriftSimulated ? (
            <button
              onClick={resetToBaselineData}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Baseline</span>
            </button>
          ) : (
            <button
              onClick={triggerSimulatedDrift}
              className="flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Simulate Production Drift</span>
            </button>
          )}
        </div>
      </div>

      {/* Drift Overview Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Drift Score</span>
          <div className="text-3xl font-black font-mono mt-1 text-white flex items-baseline gap-1">
            <span className={driftReport.overallDriftScore > 25 ? 'text-rose-400' : 'text-emerald-400'}>
              {driftReport.overallDriftScore}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {driftReport.driftedFeaturesCount} of {driftReport.totalFeaturesEvaluated} features drifted
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Test Significance</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            α = 0.05
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Two-sample Kolmogorov-Smirnov test
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Reference Set Size</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {driftReport.referenceRows} <span className="text-xs text-slate-500 font-normal">samples</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Current Batch: {driftReport.currentRows} samples
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Model Health Status</span>
          <div className="text-2xl font-bold font-mono mt-1">
            {driftReport.isDriftDetected ? (
              <span className="text-rose-400">Degraded</span>
            ) : (
              <span className="text-emerald-400">Optimal</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {driftReport.isDriftDetected ? 'Retraining Recommended' : 'Zero distribution shift'}
          </span>
        </div>
      </div>

      {/* Feature Drift Evaluation Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-base font-bold text-white mb-4">Feature-Level Statistical Drift Audit</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[10px] text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Test Method</th>
                <th className="py-2.5 px-3">Test Statistic</th>
                <th className="py-2.5 px-3">p-value / PSI</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Drift Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {driftReport.features.map(f => (
                <tr
                  key={f.feature}
                  onClick={() => setSelectedFeature(f.feature)}
                  className={`cursor-pointer transition-colors ${
                    activeFeatureObj?.feature === f.feature ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-200">{f.feature}</td>
                  <td className="py-2.5 px-3 text-slate-400">{f.type}</td>
                  <td className="py-2.5 px-3 text-slate-300">{f.testMethod}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{f.statistic}</td>
                  <td className="py-2.5 px-3 text-slate-300">{f.pValue ?? f.psiScore ?? 'N/A'}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      f.driftSeverity === 'Critical' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      f.driftSeverity === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {f.driftSeverity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {f.isDrifted ? (
                      <span className="text-rose-400 font-bold">DRIFTED</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">STABLE</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFeature(f.feature); }}
                      className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Compare
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Comparison Chart */}
      {activeFeatureObj && activeFeatureObj.distributionComparison && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Distribution Shift: <span className="text-cyan-400">{activeFeatureObj.feature}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Reference Distribution (Blue) vs Production Batch (Amber)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Statistic: {activeFeatureObj.statistic} • Severity: {activeFeatureObj.driftSeverity}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeFeatureObj.distributionComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: 'Frequency %', angle: -90, position: 'left' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend />
                <Bar dataKey="reference" name="Reference Baseline %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="Production Batch %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
