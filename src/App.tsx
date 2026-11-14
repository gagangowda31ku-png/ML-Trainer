import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingTab } from './components/tabs/LandingTab';
import { UploadTab } from './components/tabs/UploadTab';
import { ProfilingTab } from './components/tabs/ProfilingTab';
import { CleaningTab } from './components/tabs/CleaningTab';
import { EDATab } from './components/tabs/EDATab';
import { FeatureEngineeringTab } from './components/tabs/FeatureEngineeringTab';
import { AutoMLTab } from './components/tabs/AutoMLTab';
import { SHAPTab } from './components/tabs/SHAPTab';
import { PlaygroundTab } from './components/tabs/PlaygroundTab';
import { DriftTab } from './components/tabs/DriftTab';
import { ExecutiveTab } from './components/tabs/ExecutiveTab';
import { ChatTab } from './components/tabs/ChatTab';
import { Menu, X, MessageSquare, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingTab />;
      case 'upload':
        return <UploadTab />;
      case 'profiling':
        return <ProfilingTab />;
      case 'cleaning':
        return <CleaningTab />;
      case 'eda':
        return <EDATab />;
      case 'engineering':
        return <FeatureEngineeringTab />;
      case 'automl':
        return <AutoMLTab />;
      case 'shap':
        return <SHAPTab />;
      case 'playground':
        return <PlaygroundTab />;
      case 'drift':
        return <DriftTab />;
      case 'executive':
        return <ExecutiveTab />;
      case 'chat':
        return <ChatTab />;
      default:
        return <LandingTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <Navbar />

      {/* Mobile Top Sub-Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>Workflow Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>AI Chat</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md md:hidden p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-white text-base">Pipeline Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div onClick={() => setMobileMenuOpen(false)}>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveTab()}
        </main>
      </div>

      {/* Floating AI Chat Quick Button (on all tabs except chat itself) */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          title="Open AI Data Scientist Co-Pilot"
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-cyan-500/25 hover:scale-105 transition-all print:hidden"
        >
          <Sparkles className="h-4 w-4 text-cyan-200 animate-pulse" />
          <span className="hidden sm:inline">Ask AI Co-Pilot</span>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
}
