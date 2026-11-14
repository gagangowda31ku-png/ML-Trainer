import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  Crosshair,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Download,
  HelpCircle,
  TrendingUp,
  Cpu,
  CheckCircle2,
  FileCheck,
  Zap,
  Bot
} from 'lucide-react';
import { predictPlaygroundInstance } from '../../services/mlEngine';
import { LocalSHAPContribution } from '../../types';
import { parseCSVToRows } from '../../services/dataProfiler';

export const PlaygroundTab: React.FC = () => {
  const {
    profile,
    bestModel,
    mlDataset,
    targetColumn,
    taskType,
  } = useData();

  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [predictionResult, setPredictionResult] = useState<{
    prediction: any;
    confidence: number;
    contributions: LocalSHAPContribution[];
  } | null>(null);

  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  // Batch scoring state
  const [batchRows, setBatchRows] = useState<Record<string, any>[] | null>(null);
  const [scoredRows, setScoredRows] = useState<Record<string, any>[] | null>(null);
  const [isScoringBatch, setIsScoringBatch] = useState<boolean>(false);

  // Initialize input values from dataset means
  useEffect(() => {
    if (profile && bestModel) {
      const initial: Record<string, number> = {};
      profile.columns.forEach(col => {
        if (col.type === 'numerical' && col.stats) {
          initial[col.name] = Number(col.stats.median) || Number(col.stats.mean) || 0;
        }
      });
      setInputValues(initial);
    }
  }, [profile, bestModel]);

  // Re-run single inference whenever inputs change
  useEffect(() => {
    if (mlDataset && bestModel && Object.keys(inputValues).length > 0) {
      const result = predictPlaygroundInstance(inputValues, mlDataset, bestModel);
      setPredictionResult(result);
    }
  }, [inputValues, mlDataset, bestModel]);

  if (!bestModel || !mlDataset) {
    return (
      <div className="text-center py-20">
        <Crosshair className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Model Available for Simulation</h3>
        <p className="text-sm text-slate-400 mt-1">Please train AutoML models before using the Prediction Playground.</p>
      </div>
    );
  }

  const handleInputChange = (feature: string, val: number) => {
    setInputValues(prev => ({ ...prev, [feature]: val }));
  };

  const handleExplainPrediction = async () => {
    if (!predictionResult) return;
    setIsExplaining(true);

    try {
      const response = await fetch('/api/gemini/explain-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: inputValues,
          prediction: predictionResult.prediction,
          confidence: predictionResult.confidence,
          targetName: targetColumn || profile?.recommendedTarget,
          shapContributions: predictionResult.contributions.slice(0, 5),
          modelName: bestModel.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Batch CSV file upload and scoring
  const handleBatchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const text = await e.target.files[0].text();
      const { headers, rows } = parseCSVToRows(text);
      setBatchRows(rows);
      setIsScoringBatch(true);

      // Score rows
      setTimeout(() => {
        const scored = rows.map((r, idx) => {
          const numInputs: Record<string, number> = {};
          Object.keys(r).forEach(k => {
            numInputs[k] = Number(r[k]) || 0;
          });
          const res = predictPlaygroundInstance(numInputs, mlDataset, bestModel);
          return {
            ...r,
            [`PREDICTED_${targetColumn || 'TARGET'}`]: res.prediction,
            CONFIDENCE_SCORE: `${(res.confidence * 100).toFixed(1)}%`,
          };
        });
        setScoredRows(scored);
        setIsScoringBatch(false);
      }, 300);
    }
  };

  const exportScoredCSV = () => {
    if (!scoredRows || scoredRows.length === 0) return;
    const headers = Object.keys(scoredRows[0]);
    const csvContent = [
      headers.join(','),
      ...scoredRows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `batch_predictions_${bestModel.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topFeatures = bestModel.featureImportances.slice(0, 10);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Interactive Prediction Playground & Batch Scoring
            </h1>
            <span className="rounded-md bg-cyan-950 px-2 py-0.5 text-xs font-mono text-cyan-400 border border-cyan-800">
              Active: {bestModel.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate what-if feature adjustments with real-time inference, factor attributions, and bulk CSV scoring.
          </p>
        </div>
      </div>

      {/* Single Instance Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Sliders & Controls */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-cyan-400" />
              What-If Feature Sliders
            </h3>
            <span className="text-[10px] text-slate-400">Adjust sliders to trigger instant inference</span>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {topFeatures.map(featObj => {
              const colProfile = profile?.columns.find(c => c.name === featObj.feature);
              const minVal = colProfile?.stats?.min ?? 0;
              const maxVal = colProfile?.stats?.max ?? 100;
              const step = (maxVal - minVal) / 100 || 1;
              const currentVal = inputValues[featObj.feature] ?? colProfile?.stats?.median ?? 0;

              return (
                <div key={featObj.feature} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="font-bold text-slate-200">{featObj.feature}</span>
                    <span className="text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {currentVal}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={minVal}
                    max={maxVal}
                    step={step}
                    value={currentVal}
                    onChange={(e) => handleInputChange(featObj.feature, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>Min: {minVal}</span>
                    <span>Max: {maxVal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Prediction Gauge & SHAP Breakdown */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Live Prediction Outcome
            </h3>

            {predictionResult && (
              <div className="space-y-4">
                {/* Result Hero Card */}
                <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-950 p-5 text-center shadow-lg">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Predicted Outcome for {targetColumn || 'Target'}
                  </span>
                  <div className="text-3xl font-black font-mono text-white mt-1">
                    {String(predictionResult.prediction)}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-400">Model Confidence:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {(predictionResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Top Factor Contributions */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                    Top Contributing Factors
                  </span>
                  <div className="space-y-1.5 font-mono text-xs max-h-32 overflow-y-auto">
                    {predictionResult.contributions.slice(0, 4).map(c => (
                      <div key={c.feature} className="flex justify-between items-center text-slate-300">
                        <span className="truncate max-w-[130px]">{c.feature}:</span>
                        <span className={`font-bold ${c.contribution >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                          {c.contribution >= 0 ? `+${c.contribution}` : c.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gemini AI Natural Language Decision Explanation */}
                {aiExplanation ? (
                  <div className="rounded-xl bg-purple-950/30 border border-purple-800/60 p-3.5 text-xs text-purple-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
                      <Bot className="h-3.5 w-3.5" />
                      <span>Gemini Decision Rationale:</span>
                    </div>
                    {aiExplanation}
                  </div>
                ) : (
                  <button
                    onClick={handleExplainPrediction}
                    disabled={isExplaining}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-purple-900/50 hover:text-purple-200 px-3 py-2 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
                  >
                    <Bot className="h-4 w-4 text-purple-400" />
                    <span>{isExplaining ? 'Analyzing with Gemini...' : 'Explain This Prediction with AI'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch CSV Scoring Tool */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-cyan-400" />
              Batch CSV Inference & Scoring
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload a bulk CSV file to score all observations simultaneously and download the enriched output dataset.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer transition-colors">
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload CSV for Scoring</span>
              <input type="file" accept=".csv" onChange={handleBatchFileUpload} className="hidden" />
            </label>

            {scoredRows && (
              <button
                onClick={exportScoredCSV}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Scored CSV</span>
              </button>
            )}
          </div>
        </div>

        {scoredRows && (
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-slate-600">#</th>
                  {Object.keys(scoredRows[0]).map(h => (
                    <th key={h} className={`py-2.5 px-3 ${h.includes('PREDICTED') ? 'text-cyan-400 bg-cyan-950/40' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scoredRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                    {Object.keys(scoredRows[0]).map(h => {
                      const isPred = h.includes('PREDICTED');
                      return (
                        <td key={h} className={`py-2 px-3 text-slate-300 ${isPred ? 'font-bold text-cyan-200 bg-cyan-950/20' : ''}`}>
                          {String(row[h])}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
