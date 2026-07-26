import React, { useState, useEffect } from 'react';
import IntakeForm from './components/IntakeForm';
import AgentPipeline from './components/AgentPipeline';
import FinalDashboard from './components/FinalDashboard';
import { Activity, ShieldCheck, Heart, Sparkles, RefreshCw } from 'lucide-react';
import defaultTimelineData from './data/patient_timeline.json';

export default function App() {
  const [screen, setScreen] = useState('intake'); // 'intake' | 'pipeline' | 'dashboard'
  const [patientInfo, setPatientInfo] = useState(null);
  const [timelineData, setTimelineData] = useState(defaultTimelineData);
  const [pipelineOutputs, setPipelineOutputs] = useState(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Try fetching timeline data from server API on mount
  useEffect(() => {
    async function loadTimeline() {
      try {
        setIsLoadingTimeline(true);
        const res = await fetch('/api/timeline');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTimelineData(data);
          }
        }
      } catch (err) {
        console.warn('Using embedded patient_timeline.json dataset');
      } finally {
        setIsLoadingTimeline(false);
      }
    }
    loadTimeline();
  }, []);

  const handleIntakeSubmit = (info) => {
    setPatientInfo(info);
    setScreen('pipeline');
  };

  const handleTimelineUpload = (customTimeline) => {
    setTimelineData(customTimeline);
  };

  const handlePipelineComplete = (outputs) => {
    setPipelineOutputs(outputs);
    // Move to dashboard after pipeline completes
    setScreen('dashboard');
  };

  const handleReset = () => {
    setScreen('intake');
    setPatientInfo(null);
    setPipelineOutputs(null);
  };

  return (
    <div className="min-h-screen bg-[#090c15] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#090c15]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Med Matrix AI</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold">
                N-of-1 Decision System
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Chained 5-Agent Precision Medicine Platform</p>
          </div>
        </div>

        {/* Navigation Step Pills */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setScreen('intake')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              screen === 'intake'
                ? 'bg-slate-800 text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Patient Intake
          </button>
          <span className="text-slate-600">→</span>
          <button
            onClick={() => patientInfo && setScreen('pipeline')}
            disabled={!patientInfo}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              screen === 'pipeline'
                ? 'bg-slate-800 text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white disabled:opacity-40'
            }`}
          >
            2. AI Agent Pipeline
          </button>
          <span className="text-slate-600">→</span>
          <button
            onClick={() => pipelineOutputs && setScreen('dashboard')}
            disabled={!pipelineOutputs}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              screen === 'dashboard'
                ? 'bg-slate-800 text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white disabled:opacity-40'
            }`}
          >
            3. Final Recommendation
          </button>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2">
          {screen !== 'intake' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Demo</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Hackathon Pitch Ready
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-8">
        {screen === 'intake' && (
          <IntakeForm
            onSubmit={handleIntakeSubmit}
            timelineData={timelineData}
            onTimelineUpload={handleTimelineUpload}
          />
        )}

        {screen === 'pipeline' && patientInfo && (
          <AgentPipeline
            patientInfo={patientInfo}
            timelineData={timelineData}
            onComplete={handlePipelineComplete}
            onBackToIntake={() => setScreen('intake')}
          />
        )}

        {screen === 'dashboard' && patientInfo && pipelineOutputs && (
          <FinalDashboard
            patientInfo={patientInfo}
            timelineData={timelineData}
            pipelineOutputs={pipelineOutputs}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-8 text-center text-xs text-slate-500 font-mono flex items-center justify-between">
        <span>Med Matrix AI — N-of-1 Precision Decision System Demo</span>
        <span>Grounded in Fitbit & PhysioNet BIDMC Telemetry</span>
      </footer>
    </div>
  );
}
