import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Sliders,
  FileCheck,
  Download,
  Eye,
  Trash2,
  ShieldAlert,
  Layers,
  Search
} from 'lucide-react';
import { CleaningConfig } from '../../types';

export const CleaningTab: React.FC = () => {
  const {
    profile,
    rawRows,
    cleanedRows,
    cleaningAudit,
    cleaningConfig,
    setCleaningConfig,
    executeCleaning,
    executeEDA,
    setActiveTab,
  } = useData();

  const [dataSearch, setDataSearch] = useState('');
  const [dataPage, setDataPage] = useState(1);

  if (!profile) {
    return (
      <div className="text-center py-20">
        <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Active Dataset</h3>
        <p className="text-sm text-slate-400 mt-1">Please select or upload a dataset first.</p>
      </div>
    );
  }

  const handleRunCleaning = () => {
    executeCleaning();
  };

  const handleProceedToEDA = () => {
    if (!cleanedRows) {
      executeCleaning();
    }
    executeEDA();
    setActiveTab('eda');
  };

  const exportCleanedCSV = () => {
    if (!cleanedRows || cleanedRows.length === 0) return;
    const headers = Object.keys(cleanedRows[0]);
    const csvContent = [
      headers.join(','),
      ...cleanedRows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${profile.datasetName}_cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rowsToDisplay = cleanedRows || rawRows;
  const headersToDisplay = rowsToDisplay.length > 0 ? Object.keys(rowsToDisplay[0]) : [];
  
  const filteredRows = rowsToDisplay.filter(r => {
    if (!dataSearch) return true;
    return Object.values(r).some(v => String(v).toLowerCase().includes(dataSearch.toLowerCase()));
  });

  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice((dataPage - 1) * rowsPerPage, dataPage * rowsPerPage);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Automated Data Cleaning & Transformation
            </h1>
            <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-xs font-mono text-emerald-400 border border-emerald-800">
              Pipeline Stage 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure imputation policies, outlier winsorization, duplicate deduplication, and scaling strategies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunCleaning}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{cleanedRows ? 'Re-Run Cleaning' : 'Execute Cleaning'}</span>
          </button>

          <button
            onClick={handleProceedToEDA}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <span>Proceed to EDA</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cleaning Config Controls & Audit Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cleaning Options Panel */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Automated Cleaning Configuration
            </h3>
            <span className="text-[10px] text-slate-400">Presets: Optimal ML Ready</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Missing numerical */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block font-medium mb-1">Numerical Imputation</label>
                <select
                  value={cleaningConfig.imputeMissingStrategy}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, imputeMissingStrategy: e.target.value as any })}
                  className="w-full rounded-lg bg-slate-950 px-3 py-1.5 text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="median">Median (Robust to Outliers)</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="zero">Zero Fill (0)</option>
                  <option value="drop_row">Drop Rows with Missing</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block font-medium mb-1">Categorical Imputation</label>
                <select
                  value={cleaningConfig.imputeCategoricalStrategy}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, imputeCategoricalStrategy: e.target.value as any })}
                  className="w-full rounded-lg bg-slate-950 px-3 py-1.5 text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="mode">Mode (Most Frequent)</option>
                  <option value="unknown">Explicit 'Unknown' Token</option>
                  <option value="drop_row">Drop Rows</option>
                </select>
              </div>
            </div>

            {/* Outlier Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block font-medium mb-1">Outlier Treatment (IQR)</label>
                <select
                  value={cleaningConfig.outlierHandling}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, outlierHandling: e.target.value as any })}
                  className="w-full rounded-lg bg-slate-950 px-3 py-1.5 text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="clip_iqr">Winsorize / Clip to 1.5x IQR</option>
                  <option value="drop">Drop Outlier Rows</option>
                  <option value="none">Preserve Raw Outliers</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block font-medium mb-1">Scaling Transformation</label>
                <select
                  value={cleaningConfig.scalingStrategy}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, scalingStrategy: e.target.value as any })}
                  className="w-full rounded-lg bg-slate-950 px-3 py-1.5 text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="standard">StandardScaler (μ=0, σ=1)</option>
                  <option value="minmax">MinMaxScaler [0, 1]</option>
                  <option value="none">None (Raw Scales)</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleaningConfig.removeDuplicates}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, removeDuplicates: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
                />
                <span className="text-slate-300">Remove duplicate observations ({profile.duplicateRows} found)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleaningConfig.dropConstantColumns}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, dropConstantColumns: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
                />
                <span className="text-slate-300">Drop zero-variance constant columns</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleaningConfig.dropHighCardinalityIds}
                  onChange={(e) => setCleaningConfig({ ...cleaningConfig, dropHighCardinalityIds: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
                />
                <span className="text-slate-300">Prune non-informative ID / Unique key columns</span>
              </label>
            </div>
          </div>
        </div>

        {/* Cleaning Audit Results & Impact */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                Transformation & Impact Audit
              </h3>
              {cleaningAudit && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Audit Completed
                </span>
              )}
            </div>

            {cleaningAudit ? (
              <div className="space-y-4">
                {/* 4 Impact Stat boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Imputed Cells</span>
                    <span className="text-lg font-bold font-mono text-cyan-400">{cleaningAudit.missingImputed}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Outliers Clipped</span>
                    <span className="text-lg font-bold font-mono text-amber-400">{cleaningAudit.outliersClipped}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Deduplicated</span>
                    <span className="text-lg font-bold font-mono text-purple-400">{cleaningAudit.duplicatesRemoved}</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Final Matrix</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{cleaningAudit.afterRows}×{cleaningAudit.afterColumns}</span>
                  </div>
                </div>

                {/* Audit Steps Log */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Execution Trace Log
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                    {cleaningAudit.logs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span>{log.stage}: {log.impactDescription}</span>
                      </div>
                    ))}
                    {cleaningAudit.droppedColumns.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-amber-300">
                        <Trash2 className="h-3 w-3 text-amber-400 shrink-0" />
                        <span>Pruned column [{d.name}] ({d.reason})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Click "Execute Cleaning" to run automated imputation, deduplication, and transformation.</p>
              </div>
            )}
          </div>

          {cleanedRows && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={exportCleanedCSV}
                className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Cleaned CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cleaned Dataset Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-400" />
              {cleanedRows ? 'Transformed & Cleaned Dataset Preview' : 'Raw Dataset Preview'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing page {dataPage} of {totalPages} ({filteredRows.length} total rows)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search cleaned records..."
                value={dataSearch}
                onChange={(e) => { setDataSearch(e.target.value); setDataPage(1); }}
                className="w-full rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

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
                {headersToDisplay.map(h => (
                  <th key={h} className="py-2.5 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-600">{(dataPage - 1) * rowsPerPage + idx + 1}</td>
                  {headersToDisplay.map(h => (
                    <td key={h} className="py-2 px-3 text-slate-300">
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
