import React from 'react';
import { TabType, useData } from '../context/DataContext';
import {
  UploadCloud,
  FileSearch,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  Bot,
  Brain,
  Crosshair,
  Activity,
  FileText,
  MessageSquareCode,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

interface NavItem {
  id: TabType;
  label: string;
  category?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiresData?: boolean;
  requiresModel?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, profile, cleanedRows, models, bestModel } = useData();

  const navItems: NavItem[] = [
    {
      id: 'upload',
      label: 'Ingestion & Upload',
      category: 'DATA WORKFLOW',
      icon: UploadCloud,
    },
    {
      id: 'profiling',
      label: 'Data Profiling',
      icon: FileSearch,
      badge: profile ? `${profile.healthScore.overall}/100` : undefined,
      requiresData: true,
    },
    {
      id: 'cleaning',
      label: 'Automated Cleaning',
      icon: Sparkles,
      badge: cleanedRows ? 'Cleaned' : undefined,
      requiresData: true,
    },
    {
      id: 'eda',
      label: 'Automated EDA',
      icon: BarChart3,
      requiresData: true,
    },
    {
      id: 'engineering',
      label: 'Feature Engineering',
      icon: SlidersHorizontal,
      requiresData: true,
    },
    {
      id: 'automl',
      label: 'AutoML & Leaderboard',
      category: 'MODELING & AI',
      icon: Bot,
      badge: models.length > 0 ? `${models.length} Models` : undefined,
      requiresData: true,
    },
    {
      id: 'shap',
      label: 'SHAP Explainability',
      icon: Brain,
      requiresModel: true,
    },
    {
      id: 'playground',
      label: 'Prediction Playground',
      icon: Crosshair,
      requiresModel: true,
    },
    {
      id: 'drift',
      label: 'Data Drift & Monitor',
      icon: Activity,
      requiresModel: true,
    },
    {
      id: 'executive',
      label: 'Executive Dashboard',
      category: 'INTELLIGENCE & REPORTS',
      icon: FileText,
      badge: bestModel ? 'Ready' : undefined,
      requiresData: true,
    },
    {
      id: 'chat',
      label: 'AI Data Scientist Chat',
      icon: MessageSquareCode,
      badge: 'Gemini 3.7',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-3 hidden md:flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Status Pill Card */}
        {profile && (
          <div className="rounded-xl border border-cyan-900/40 bg-gradient-to-b from-cyan-950/30 to-slate-900/60 p-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                Pipeline Status
              </span>
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Health Score:</span>
                <span className="font-mono font-bold text-cyan-300">{profile.healthScore.overall}/100</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Target Feature:</span>
                <span className="font-mono text-slate-200 truncate max-w-[100px]">{profile.recommendedTarget}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Top Model:</span>
                <span className="font-mono text-emerald-400 truncate max-w-[100px]">{bestModel?.name || 'Not Trained'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const isSelected = activeTab === item.id;
            const isLocked = (item.requiresData && !profile) || (item.requiresModel && !bestModel);

            return (
              <React.Fragment key={item.id}>
                {item.category && (
                  <div className={`px-3 pt-4 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase ${index === 0 ? 'pt-0' : ''}`}>
                    {item.category}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!isLocked) setActiveTab(item.id);
                  }}
                  disabled={isLocked}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : isLocked
                      ? 'text-slate-600 cursor-not-allowed opacity-60'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={`h-4 w-4 ${
                        isSelected ? 'text-cyan-400' : isLocked ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLocked ? (
                      <Lock className="h-3 w-3 text-slate-600" />
                    ) : item.badge ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold ${
                          isSelected
                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-slate-900 px-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Layers className="h-3.5 w-3.5 text-cyan-500" />
          <span>Full Pipeline Active</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Pandas • Scikit-Learn • SHAP • Gemini
        </p>
      </div>
    </aside>
  );
};
