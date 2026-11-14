import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Info,
  Maximize2
} from 'lucide-react';

export const EDATab: React.FC = () => {
  const {
    profile,
    cleanedRows,
    rawRows,
    edaResult,
    executeEDA,
    targetColumn,
    setActiveTab,
    executeFeatureEngineering,
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'correlation' | 'distributions' | 'bivariate' | 'boxplots'>('correlation');
  const [selectedNumFeature, setSelectedNumFeature] = useState<string>('');

  useEffect(() => {
    if (!edaResult && profile) {
      executeEDA();
    }
  }, [edaResult, profile]);

  useEffect(() => {
    if (edaResult && Object.keys(edaResult.numericalDistributions).length > 0 && !selectedNumFeature) {
      setSelectedNumFeature(Object.keys(edaResult.numericalDistributions)[0]);
    }
  }, [edaResult, selectedNumFeature]);

  if (!profile) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Available</h3>
        <p className="text-sm text-slate-400 mt-1">Select or upload a dataset to begin exploratory data analysis.</p>
      </div>
    );
  }

  const handleProceedToFE = () => {
    executeFeatureEngineering();
    setActiveTab('engineering');
  };

  const getHeatmapColor = (val: number) => {
    if (val === 1) return 'bg-cyan-600 text-white font-bold';
    if (val > 0.6) return 'bg-cyan-500/80 text-white font-semibold';
    if (val > 0.3) return 'bg-cyan-600/40 text-cyan-200';
    if (val > 0) return 'bg-cyan-900/30 text-slate-300';
    if (val === 0) return 'bg-slate-900 text-slate-500';
    if (val > -0.3) return 'bg-rose-900/30 text-slate-300';
    if (val > -0.6) return 'bg-rose-600/40 text-rose-200';
    return 'bg-rose-600/80 text-white font-semibold';
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Automated Exploratory Data Analysis (EDA)
            </h1>
            <span className="rounded-md bg-blue-950 px-2 py-0.5 text-xs font-mono text-blue-400 border border-blue-800">
              Pipeline Stage 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multivariate Pearson correlation matrix, univariate histograms, boxplot outlier spreads, and bivariate target interactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => executeEDA()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Refresh EDA</span>
          </button>

          <button
            onClick={handleProceedToFE}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <span>Proceed to Feature Engineering</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('correlation')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeSubTab === 'correlation'
              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Correlation Matrix & Heatmap
        </button>
        <button
          onClick={() => setActiveSubTab('distributions')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeSubTab === 'distributions'
              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Distributions & Histograms
        </button>
        <button
          onClick={() => setActiveSubTab('bivariate')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeSubTab === 'bivariate'
              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Target Bivariate Analysis
        </button>
        <button
          onClick={() => setActiveSubTab('boxplots')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeSubTab === 'boxplots'
              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Boxplots & Outlier Bounds
        </button>
      </div>

      {/* SUBTAB 1: CORRELATION MATRIX */}
      {activeSubTab === 'correlation' && edaResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Heatmap Grid */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                Feature Correlation Heatmap (Pearson r)
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-rose-500" /> Negative (-1.0)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-slate-700" /> 0.0</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-cyan-500" /> Positive (+1.0)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="text-center text-[10px] font-mono border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-left text-slate-500 font-medium">Feature</th>
                      {edaResult.correlationMatrix.features.map(f => (
                        <th key={f} className="p-1.5 text-slate-400 truncate max-w-[70px] font-semibold" title={f}>
                          {f.length > 7 ? `${f.slice(0, 6)}…` : f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {edaResult.correlationMatrix.features.map((rowFeat, rIdx) => (
                      <tr key={rowFeat}>
                        <td className="p-1.5 text-left text-slate-300 font-semibold truncate max-w-[90px]" title={rowFeat}>
                          {rowFeat.length > 10 ? `${rowFeat.slice(0, 9)}…` : rowFeat}
                        </td>
                        {edaResult.correlationMatrix.matrix[rIdx]?.map((val, cIdx) => (
                          <td key={cIdx} className="p-1">
                            <div
                              className={`h-8 w-12 flex items-center justify-center rounded transition-transform hover:scale-110 cursor-pointer ${getHeatmapColor(val)}`}
                              title={`${rowFeat} ⟷ ${edaResult.correlationMatrix.features[cIdx]}: r = ${val}`}
                            >
                              {val.toFixed(2)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Feature Correlations List */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Strongest Feature Pairs
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Identifies collinear pairs and potential feature interaction candidates.
              </p>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {edaResult.correlationMatrix.topCorrelations.slice(0, 10).map((corr, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 flex items-center justify-between">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 truncate">
                        <span>{corr.featureA}</span>
                        <span className="text-slate-500">×</span>
                        <span>{corr.featureB}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {Math.abs(corr.correlation) > 0.7 ? 'High Collinearity' : 'Moderate Relationship'}
                      </span>
                    </div>

                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      corr.correlation > 0 
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' 
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {corr.correlation > 0 ? `+${corr.correlation}` : corr.correlation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              💡 Features with $|r| &gt; 0.8$ are prime candidates for interaction terms or dimensionality reduction.
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DISTRIBUTIONS & HISTOGRAMS */}
      {activeSubTab === 'distributions' && edaResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Select Feature:</label>
              <select
                value={selectedNumFeature}
                onChange={(e) => setSelectedNumFeature(e.target.value)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-cyan-300 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {Object.keys(edaResult.numericalDistributions).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-400">10-Bin Discretized Frequency Density</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-sm font-bold text-white mb-4">
                Frequency Histogram for <span className="text-cyan-400">[{selectedNumFeature}]</span>
              </h3>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaResult.numericalDistributions[selectedNumFeature] || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="binRange" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} samples`, 'Count']}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-sm font-bold text-white mb-4">Feature Summary Statistics</h3>
              {profile.columns.find(c => c.name === selectedNumFeature)?.stats ? (
                (() => {
                  const s = profile.columns.find(c => c.name === selectedNumFeature)!.stats!;
                  return (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Mean (μ):</span>
                        <span className="text-white font-bold">{s.mean}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Median:</span>
                        <span className="text-cyan-300 font-bold">{s.median}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Std Dev (σ):</span>
                        <span className="text-slate-200">{s.std}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Range [Min, Max]:</span>
                        <span className="text-slate-200">[{s.min}, {s.max}]</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Skewness:</span>
                        <span className={Math.abs(s.skewness) > 0.8 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {s.skewness} {Math.abs(s.skewness) > 0.8 ? '(Skewed)' : '(Symmetric)'}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Kurtosis:</span>
                        <span className="text-slate-200">{s.kurtosis}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-slate-500">No statistics available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BIVARIATE TARGET ANALYSIS */}
      {activeSubTab === 'bivariate' && edaResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(edaResult.targetBivariate).map(([featureName, data]) => (
            <div key={featureName} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h4 className="text-sm font-bold text-white mb-2">
                Target Association: <span className="text-cyan-400">{featureName}</span>
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Average target rate / value across categories.
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="categoryOrBin" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="targetMeanOrCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: BOXPLOTS & OUTLIERS */}
      {activeSubTab === 'boxplots' && edaResult && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-bold text-white mb-4">
            Five-Number Summary & IQR Spread
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {edaResult.boxPlots.map(bp => (
              <div key={bp.feature} className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-cyan-400 truncate">{bp.feature}</span>
                  <span className="text-[10px] text-slate-500">IQR Analysis</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Max:</span>
                    <span>{bp.max}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Q3 (75%):</span>
                    <span>{bp.q75}</span>
                  </div>
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span className="text-slate-400">Median (50%):</span>
                    <span>{bp.median}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Q1 (25%):</span>
                    <span>{bp.q25}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Min:</span>
                    <span>{bp.min}</span>
                  </div>
                </div>

                {bp.outliers.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-rose-400">
                    Outlier samples: {bp.outliers.slice(0, 4).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
