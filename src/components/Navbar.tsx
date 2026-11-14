import React from 'react';
import { useData } from '../context/DataContext';
import { SAMPLE_DATASETS } from '../services/sampleDatasets';
import { 
  Sparkles, 
  BrainCircuit, 
  Sun, 
  Moon, 
  RotateCcw, 
  Printer, 
  Play, 
  Database, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isDarkMode,
    setIsDarkMode,
    datasetName,
    profile,
    bestModel,
    loadSampleDataset,
    executeAutonomousEndToEnd,
    isTraining,
    resetAll,
  } = useData();

  const handlePrint = () => {
    setActiveTab('executive');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                  Autonomous<span className="text-cyan-400">DS</span>
                </span>
                <span className="rounded-full bg-cyan-950/80 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800/50">
                  AutoML v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Data Scientist Platform
              </p>
            </div>
          </button>

          {/* Active Dataset Badge */}
          {datasetName && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200 truncate max-w-[160px]">
                  {datasetName}
                </span>
                <span className="text-[10px] text-slate-400">
                  {profile ? `${profile.totalRows} rows • ${profile.totalColumns} cols` : 'Active'}
                </span>
              </div>
              {profile && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  profile.healthScore.overall >= 80 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' 
                    : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                }`}>
                  Health {profile.healthScore.overall}/100
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center/Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Dataset Selector */}
          <div className="relative hidden lg:block">
            <select
              value={SAMPLE_DATASETS.some(s => s.name === datasetName) ? SAMPLE_DATASETS.find(s => s.name === datasetName)?.id : ''}
              onChange={(e) => {
                if (e.target.value) loadSampleDataset(e.target.value);
              }}
              className="appearance-none rounded-lg bg-slate-900 px-3 py-1.5 pr-8 text-xs font-medium text-slate-300 border border-slate-800 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="" disabled>Select Benchmark Dataset...</option>
              {SAMPLE_DATASETS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.badge})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Database className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* 1-Click Autonomous End-to-End Button */}
          {profile && (
            <button
              onClick={executeAutonomousEndToEnd}
              disabled={isTraining}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isTraining ? (
                <>
                  <Cpu className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Training Models...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Autonomous Run</span>
                </>
              )}
            </button>
          )}

          {/* Print/Export PDF button */}
          {bestModel && (
            <button
              onClick={handlePrint}
              title="Print / Export Executive PDF"
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline">PDF Report</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
          </button>

          {/* Reset Button */}
          {profile && (
            <button
              onClick={resetAll}
              title="Reset workspace"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
