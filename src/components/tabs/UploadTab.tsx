import React, { useRef } from 'react';
import { useData } from '../../context/DataContext';
import { SAMPLE_DATASETS } from '../../services/sampleDatasets';
import {
  UploadCloud,
  FileCheck,
  Zap,
  ArrowRight,
  Database,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const UploadTab: React.FC = () => {
  const { loadSampleDataset, uploadCustomFile, setActiveTab } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadCustomFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadCustomFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Dataset Ingestion & Benchmarking
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload custom CSV, TSV, or XLSX datasets, or load built-in industrial benchmark datasets for immediate testing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-6 flex flex-col">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-cyan-400" />
            Upload Local Dataset
          </h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/40 hover:bg-cyan-950/20 p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center group min-h-[300px]"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv,.tsv,.xlsx,.xls"
              className="hidden"
            />
            <div className="h-16 w-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all shadow-lg shadow-cyan-950/50 mb-4">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Drop your CSV or Excel file here
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs">
              Supports CSV, TSV, and XLSX formats with automatic header detection and schema inference.
            </p>
            <button className="mt-5 rounded-lg bg-slate-800 group-hover:bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition-colors">
              Browse Local Files
            </button>
          </div>
        </div>

        {/* Built-in Benchmark Datasets */}
        <div className="lg:col-span-6 flex flex-col">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Industrial Benchmark Datasets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => loadSampleDataset(sample.id)}
                className="flex flex-col text-left justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/90 hover:border-cyan-500/50 p-4 transition-all group focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                      {sample.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {sample.rowCount} rows
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 mt-2 transition-colors">
                    {sample.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>Load Dataset</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
