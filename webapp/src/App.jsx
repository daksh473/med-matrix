import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import IntakeForm from './components/IntakeForm';
import AgentPipeline from './components/AgentPipeline';
import FinalDashboard from './components/FinalDashboard';
import { Activity, RefreshCw } from 'lucide-react';
import defaultTimelineData from './data/patient_timeline.json';

export default function App() {
  const [screen, setScreen] = useState('intake');
  const [patientInfo, setPatientInfo] = useState(null);
  const [timelineData, setTimelineData] = useState(defaultTimelineData);
  const [pipelineOutputs, setPipelineOutputs] = useState(null);
  const [agentStates, setAgentStates] = useState({});

  // Try loading timeline from server
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/timeline');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) setTimelineData(data);
        }
      } catch { /* use embedded data */ }
    })();
  }, []);

  const handleIntakeSubmit = (info) => {
    setPatientInfo(info);
    setScreen('pipeline');
  };

  const handleTimelineUpload = (custom) => setTimelineData(custom);

  const handlePipelineComplete = (outputs) => {
    setPipelineOutputs(outputs);
    setScreen('dashboard');
  };

  const handleStateChange = (states, outputs) => {
    setAgentStates(states);
    if (outputs) setPipelineOutputs(prev => ({ ...prev, ...outputs }));
  };

  const handleReset = () => {
    setScreen('intake');
    setPatientInfo(null);
    setPipelineOutputs(null);
    setAgentStates({});
  };

  const confidenceValue = pipelineOutputs?.pharmai?.confidence_level || null;

  return (
    <div className="min-h-screen relative">
      {/* Background Pattern */}
      <div className="bg-pattern" />

      {/* Main Floating Frame */}
      <div className="main-frame">
        {/* Top Navigation */}
        <header className="flex items-center justify-between px-7 py-4 border-b border-[var(--border-light)]">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--indigo)] to-[var(--sky)] flex items-center justify-center text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-[var(--text-heading)] tracking-tight">Med Matrix AI</span>
            </div>
          </div>

          {/* Center: Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide uppercase">
            <button
              onClick={() => setScreen('intake')}
              className={`transition-colors ${screen === 'intake' ? 'text-[var(--indigo)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
            >
              Patient Intake
            </button>
            <button
              onClick={() => patientInfo && setScreen('pipeline')}
              disabled={!patientInfo}
              className={`transition-colors ${screen === 'pipeline' ? 'text-[var(--indigo)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'} disabled:opacity-30`}
            >
              AI Pipeline
            </button>
            <button
              onClick={() => pipelineOutputs && setScreen('dashboard')}
              disabled={!pipelineOutputs}
              className={`transition-colors ${screen === 'dashboard' ? 'text-[var(--indigo)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'} disabled:opacity-30`}
            >
              Recommendation
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {screen !== 'intake' && (
              <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-dark)] font-medium transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
            <button className="px-5 py-2 rounded-full bg-[var(--navy)] hover:bg-[#252a4a] text-white text-xs font-bold shadow-md transition-all">
              N-of-1 Demo
            </button>
          </div>
        </header>

        {/* Content Layout: Sidebar + Main + Right Panel */}
        <div className="flex min-h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <Sidebar
            activeScreen={screen}
            onNavigate={setScreen}
            pipelineReady={!!patientInfo}
            dashboardReady={!!pipelineOutputs}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-y-auto">
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
                onStateChange={handleStateChange}
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

          {/* Right Panel */}
          {patientInfo && (
            <RightPanel
              patientInfo={patientInfo}
              timelineData={timelineData}
              agentStates={agentStates}
              confidenceValue={confidenceValue}
              screen={screen}
            />
          )}
        </div>
      </div>

      {/* Floating Callout: Pipeline Completion (overlaps frame edge) */}
      {screen === 'pipeline' && patientInfo && (
        <div className="floating-callout" style={{ position: 'fixed', bottom: 32, right: 32 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--indigo)] to-[var(--sky)] flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[var(--text-heading)]">
                {Object.values(agentStates).filter(s => s === 'complete').length}/5
              </span>
              <span className="block text-[11px] text-[var(--text-muted)]">Agents Complete</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
