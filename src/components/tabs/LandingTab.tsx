import React, { useRef } from 'react';
import { useData } from '../../context/DataContext';
import { SAMPLE_DATASETS } from '../../services/sampleDatasets';
import {
  UploadCloud,
  Sparkles,
  ArrowRight,
  Database,
  BrainCircuit,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  BarChart4,
  Zap,
  TrendingUp
} from 'lucide-react';

export const LandingTab: React.FC = () => {
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

  const pipelineSteps = [
    { title: 'Dataset', icon: Database, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { title: 'EDA', icon: BarChart4, color: 'text-blue-400', border: 'border-blue-500/30' },
    { title: 'Cleaning', icon: Sparkles, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'AutoML', icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/30' },
    { title: 'Evaluation', icon: Activity, color: 'text-amber-400', border: 'border-amber-500/30' },
    { title: 'Insights', icon: BrainCircuit, color: 'text-rose-400', border: 'border-rose-500/30' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-slate-950 p-8 sm:p-12 text-center shadow-2xl">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md mb-6">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          Autonomous AI Data Scientist & AutoML Platform
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Your Autonomous <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">AI Data Scientist</span>
        </h1>

        <p className="mt-4 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Upload your dataset. Let AI discover insights, clean anomalies, engineer features, build optimal models, and explain predictions.
        </p>

        {/* Animated Pipeline Breadcrumb */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Autonomous End-to-End Execution Pipeline
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 max-w-4xl mx-auto">
            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={step.title}>
                <div className={`flex items-center gap-2 rounded-xl bg-slate-900/90 border ${step.border} px-3 py-2 shadow-sm`}>
                  <step.icon className={`h-4 w-4 ${step.color}`} />
                  <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600 hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Zone & Quick Benchmark Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-cyan-400" />
              Upload Custom Dataset
            </h2>
            <span className="text-xs text-slate-400">CSV, TSV, XLSX supported</span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/40 hover:bg-cyan-950/20 p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center group min-h-[260px]"
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
              Drag & Drop your dataset here
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs">
              Drop any CSV or Excel file to automatically trigger schema profiling, outlier audit, and health scoring.
            </p>
            <button className="mt-4 rounded-lg bg-slate-800 group-hover:bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors">
              Browse Local Files
            </button>
          </div>
        </div>

        {/* 1-Click Benchmark Datasets */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Or Test with Benchmark Datasets
            </h2>
            <span className="text-xs text-slate-400">1-Click Instant Ingestion</span>
          </div>

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
                      {sample.rowCount} rows • {sample.colCount} cols
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
                  <span>Launch Pipeline</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="pt-6">
        <h2 className="text-xl font-bold text-white text-center mb-8">
          Enterprise-Grade Autonomous Data Science Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="h-10 w-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800/60 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Data Health Score /100</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Automated multi-factor audit evaluating completeness, duplicate penalty, cardinality balance, and IQR outlier density.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60 mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Ensemble AutoML Engine</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Trains Random Forests, Gradient Boosted Trees, XGBoost surrogates, and Regularized Regressors with 5-Fold cross-validation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="h-10 w-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center border border-purple-800/60 mb-4">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">SHAP & Gemini Intelligence</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Full mathematical SHAP importance, beeswarm summary, local instance waterfalls, and Gemini 3.7 Flash strategic narrative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
