import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TaskType } from '../../types';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  Filter,
  Eye,
  Hash,
  Type,
  Calendar,
  ToggleLeft
} from 'lucide-react';

export const ProfilingTab: React.FC = () => {
  const {
    profile,
    rawRows,
    rawHeaders,
    targetColumn,
    setTargetColumn,
    taskType,
    setTaskType,
    setActiveTab,
    executeCleaning
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [dataSearch, setDataSearch] = useState('');
  const [dataPage, setDataPage] = useState(1);
  const [selectedColumnModal, setSelectedColumnModal] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="text-center py-20">
        <Database className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Active</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a dataset or choose a sample to view automated profiling.</p>
        <button
          onClick={() => setActiveTab('landing')}
          className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
        >
          Select Dataset
        </button>
      </div>
    );
  }

  const { healthScore } = profile;
  const filteredColumns = profile.columns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRows = rawRows.filter(r => {
    if (!dataSearch) return true;
    return Object.values(r).some(v => String(v).toLowerCase().includes(dataSearch.toLowerCase()));
  });

  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice((dataPage - 1) * rowsPerPage, dataPage * rowsPerPage);

  const handleProceedToCleaning = () => {
    executeCleaning();
    setActiveTab('cleaning');
  };

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (score >= 70) return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numerical': return <Hash className="h-3.5 w-3.5 text-cyan-400" />;
      case 'categorical': return <Type className="h-3.5 w-3.5 text-purple-400" />;
      case 'datetime': return <Calendar className="h-3.5 w-3.5 text-amber-400" />;
      case 'boolean': return <ToggleLeft className="h-3.5 w-3.5 text-emerald-400" />;
      default: return <Layers className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Dataset Profile & Health Audit
            </h1>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400 border border-slate-700">
              {profile.datasetName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated schema inference, missingness assessment, outlier distribution, and candidate target detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProceedToCleaning}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <span>Proceed to Cleaning</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Health Score & Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Health Score Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Data Health Score
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getHealthColor(healthScore.overall)}`}>
                Grade {healthScore.grade} • {healthScore.status}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white font-mono tracking-tight">
                {healthScore.overall}
              </span>
              <span className="text-lg font-bold text-slate-500">/ 100</span>
            </div>

            {/* Score Component Bars */}
            <div className="mt-5 space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Completeness</span>
                  <span className="font-mono text-slate-200">{healthScore.completeness}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${healthScore.completeness}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Validity & Outlier Safety</span>
                  <span className="font-mono text-slate-200">{healthScore.validity}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${healthScore.validity}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Record Uniqueness</span>
                  <span className="font-mono text-slate-200">{healthScore.uniqueness}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${healthScore.uniqueness}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Cardinality Sanity</span>
                  <span className="font-mono text-slate-200">{healthScore.cardinalityBalance}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${healthScore.cardinalityBalance}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {healthScore.suggestions[0] || "Data health is optimal for autonomous machine learning."}
            </p>
          </div>
        </div>

        {/* Dataset Meta Stats (6-item grid) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <span className="text-[11px] font-medium text-slate-400">Total Observations</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {profile.totalRows.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {profile.duplicateRows} duplicate rows ({profile.duplicatePercentage}%)
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <span className="text-[11px] font-medium text-slate-400">Total Features</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {profile.totalColumns}
            </div>
            <span className="text-[10px] text-cyan-400 mt-1 block">
              {profile.numericalCount} numeric • {profile.categoricalCount} categorical
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <span className="text-[11px] font-medium text-slate-400">Missingness</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {profile.totalMissingPercentage}%
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {profile.totalMissingCells} empty cells
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <span className="text-[11px] font-medium text-slate-400">Memory Footprint</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {profile.memoryUsageKb} <span className="text-xs font-normal text-slate-500">KB</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">
              Optimized in-memory buffer
            </span>
          </div>

          {/* Target Column Selector Card */}
          <div className="col-span-2 rounded-xl border border-cyan-900/50 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Target Variable Configuration
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Recommended: {profile.recommendedTarget}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Column</label>
                <select
                  value={targetColumn || profile.recommendedTarget}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {profile.columns.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.type}) {c.isTargetCandidate ? '★ Top Candidate' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Machine Learning Task</label>
                <select
                  value={taskType || profile.recommendedTaskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="binary_classification">Binary Classification (2 Classes)</option>
                  <option value="multiclass_classification">Multi-Class Classification (3+ Classes)</option>
                  <option value="regression">Regression (Continuous Numeric)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column Schema Profile Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Feature Profiling & Distribution Schema</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detailed statistical properties, missingness, and cardinality per column.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-3">Column Name</th>
                <th className="py-3 px-3">Data Type</th>
                <th className="py-3 px-3">Missing</th>
                <th className="py-3 px-3">Distinct</th>
                <th className="py-3 px-3">Outliers (IQR)</th>
                <th className="py-3 px-3">Summary Stats / Top Category</th>
                <th className="py-3 px-3">Target Candidate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredColumns.map(col => {
                const isTarget = col.name === (targetColumn || profile.recommendedTarget);

                return (
                  <tr key={col.name} className={`hover:bg-slate-800/40 transition-colors ${isTarget ? 'bg-cyan-950/20' : ''}`}>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      {isTarget && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                      <span>{col.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                        {getTypeIcon(col.type)}
                        {col.inferredType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={col.missingCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {col.missingCount} ({col.missingPercentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {col.uniqueCount} ({col.uniquePercentage}%)
                    </td>
                    <td className="py-2.5 px-3">
                      {col.outlierCount > 0 ? (
                        <span className="text-rose-400 font-bold">
                          {col.outlierCount} ({col.outlierPercentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                      {col.stats ? (
                        <span className="text-[11px] text-slate-400">
                          μ: {col.stats.mean} • Med: {col.stats.median} • [{col.stats.min} to {col.stats.max}]
                        </span>
                      ) : col.topCategories && col.topCategories[0] ? (
                        <span className="text-[11px] text-slate-400">
                          Mode: <span className="text-purple-300">{col.topCategories[0].label}</span> ({col.topCategories[0].percentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isTarget ? (
                        <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-800">
                          ACTIVE TARGET
                        </span>
                      ) : col.isTargetCandidate ? (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-400 border border-slate-700">
                          Score {col.targetScore}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Feature</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Raw Data Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              Raw Data Preview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing page {dataPage} of {totalPages} ({filteredRows.length} total filtered records)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search rows..."
                value={dataSearch}
                onChange={(e) => { setDataSearch(e.target.value); setDataPage(1); }}
                className="w-full rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDataPage(p => Math.max(1, p - 1))}
                disabled={dataPage <= 1}
                className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-slate-400 font-mono px-1">{dataPage} / {totalPages || 1}</span>
              <button
                onClick={() => setDataPage(p => Math.min(totalPages, p + 1))}
                disabled={dataPage >= totalPages}
                className="rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800/80">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-slate-600">#</th>
                {rawHeaders.map(h => (
                  <th key={h} className={`py-2.5 px-3 ${h === (targetColumn || profile.recommendedTarget) ? 'text-cyan-400 bg-cyan-950/40' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-600">{(dataPage - 1) * rowsPerPage + idx + 1}</td>
                  {rawHeaders.map(h => {
                    const isTarget = h === (targetColumn || profile.recommendedTarget);
                    const val = row[h];
                    return (
                      <td key={h} className={`py-2 px-3 text-slate-300 ${isTarget ? 'bg-cyan-950/20 font-bold text-cyan-200' : ''}`}>
                        {val === null || val === undefined ? (
                          <span className="text-rose-400 italic">null</span>
                        ) : typeof val === 'boolean' ? (
                          <span className={val ? 'text-emerald-400' : 'text-slate-400'}>{String(val)}</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
