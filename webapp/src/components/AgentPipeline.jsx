import React, { useState, useEffect } from 'react';
import AgentCard from './AgentCard';
import PayloadModal from './PayloadModal';
import StatCards from './StatCards';
import TelemetryChart from './TelemetryChart';
import { Search, RotateCcw, CheckCircle2, Sparkles, Clock, Bug, ChevronDown, ChevronUp, Database } from 'lucide-react';

const AGENTS = [
  { id: 'genolens', step: 1, badge: 'Pharmacogenomics', title: 'GenoLens Agent', description: 'Analyzes patient genetic variant markers to evaluate CYP enzyme clearance rates, metabolism phenotypes, and interaction risks.' },
  { id: 'pulseiq', step: 2, badge: 'Continuous Telemetry', title: 'PulseIQ Agent', description: 'Processes 60-day wearable dataset (heart rate, SpO₂, sleep, steps) comparing baseline vs post-intervention phases.' },
  { id: 'synthai', step: 3, badge: 'Information Commons', title: 'SynthAI Agent', description: 'Fuses genomic clearance defects, telemetry trends, clinical symptoms, and exposome data into a multi-layer profile.' },
  { id: 'pharmai', step: 4, badge: 'N-of-1 Dosing', title: 'PharmAI Agent', description: 'Selects optimal drug and dosage regimen that bypasses genomic clearance defects while maximizing therapeutic efficacy.' },
  { id: 'alertai', step: 5, badge: 'Safety Guardrails', title: 'AlertAI Agent', description: 'Establishes continuous telemetry safety thresholds, adverse event triggers, and follow-up schedules.' },
];

const THINKING_LOGS = {
  genolens: ['Parsing pharmacogenomic variant markers...', 'Cross-referencing CPIC & PharmGKB...', 'Evaluating CYP2D6 clearance kinetics...', 'Formulating risk summary...'],
  pulseiq:  ['Ingesting 60-day telemetry dataset...', 'Computing baseline vs post-intervention stats...', 'Modeling exponential HR recovery curve...', 'Detecting sleep anomalies...'],
  synthai:  ['Initiating multi-layer fusion...', 'Overlaying genomics with telemetry...', 'Synthesizing clinical & exposome data...', 'Generating unified profile...'],
  pharmai:  ['Evaluating candidate molecules...', 'Filtering non-CYP2D6 clearance pathways...', 'Calculating N-of-1 dose...', 'Verifying therapeutic index...'],
  alertai:  ['Ingesting recommendation & baseline metrics...', 'Deriving HR & SpO₂ safety bounds...', 'Establishing alert criteria...', 'Finalizing follow-up protocol...'],
};

export default function AgentPipeline({ patientInfo, timelineData, assignedSubject, onComplete, onStateChange }) {
  const [agentStates, setAgentStates] = useState({
    genolens: 'waiting', pulseiq: 'waiting', synthai: 'waiting', pharmai: 'waiting', alertai: 'waiting',
  });
  const [agentOutputs, setAgentOutputs] = useState({});
  const [agentDebug, setAgentDebug] = useState({});
  const [thinkingLogs, setThinkingLogs] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => { onStateChange?.(agentStates, agentOutputs); }, [agentStates, agentOutputs]);
  useEffect(() => { runPipeline(); }, []);

  const runPipeline = async () => {
    setIsPipelineRunning(true);
    setAgentStates({ genolens: 'waiting', pulseiq: 'waiting', synthai: 'waiting', pharmai: 'waiting', alertai: 'waiting' });
    setAgentOutputs({});
    setAgentDebug({});
    const outputs = {};

    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i];
      setAgentStates(prev => ({ ...prev, [agent.id]: 'thinking' }));

      const logs = THINKING_LOGS[agent.id];
      for (const log of logs) {
        setThinkingLogs(prev => ({ ...prev, [agent.id]: log }));
        await new Promise(r => setTimeout(r, 600));
      }

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: agent.id, patientInfo, timelineData, previousOutputs: outputs }),
        });
        const data = await res.json();
        if (data?.success) {
          outputs[agent.id] = data.data;
          setAgentOutputs(prev => ({ ...prev, [agent.id]: data.data }));
          setAgentStates(prev => ({ ...prev, [agent.id]: 'complete' }));
          if (data.debug) {
            setAgentDebug(prev => ({ ...prev, [agent.id]: { ...data.debug, mode: data.mode, assignedSubject: data.assignedSubject } }));
          }
        } else {
          setAgentStates(prev => ({ ...prev, [agent.id]: 'error' }));
          setIsPipelineRunning(false);
          return;
        }
      } catch {
        setAgentStates(prev => ({ ...prev, [agent.id]: 'error' }));
        setIsPipelineRunning(false);
        return;
      }
    }

    setIsPipelineRunning(false);
    onComplete(outputs);
  };

  const completedCount = Object.values(agentStates).filter(s => s === 'complete').length;
  const isAllComplete = completedCount === 5;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search agents, metrics, or patient data..." className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-light)] text-sm text-[var(--text-dark)] focus:outline-none focus:border-[var(--indigo)] focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border-light)] text-xs font-medium text-[var(--text-secondary)]">
          <Clock className="w-3.5 h-3.5 text-[var(--indigo)]" />
          <span>{timeStr}</span>
          <span className="text-[var(--text-faint)]">|</span>
          <span>{dateStr}</span>
        </div>
        <button onClick={() => setShowDebug(d => !d)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition-colors ${showDebug ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-[var(--bg-input)] border-[var(--border-light)] text-[var(--text-muted)] hover:text-amber-600'}`}>
          <Bug className="w-3.5 h-3.5" /> Debug
        </button>
        <button onClick={runPipeline} disabled={isPipelineRunning} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border-light)] hover:border-[var(--border-medium)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--indigo)] disabled:opacity-50 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Re-run
        </button>
      </div>

      {/* Stat Cards */}
      <StatCards pipelineOutputs={agentOutputs} />

      {/* Chart Cards */}
      <TelemetryChart timelineData={timelineData} />

      {/* Debug Panel (collapsible) */}
      {showDebug && Object.keys(agentDebug).length > 0 && (
        <DebugPanel agentDebug={agentDebug} assignedSubject={assignedSubject} />
      )}

      {/* Pipeline Title */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--indigo)]" />
          <h3 className="text-sm font-bold text-[var(--text-heading)]">Sequential Agent Chain</h3>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {patientInfo.name} • {patientInfo.geneticVariant.split(' ')[0]}
          </span>
          {assignedSubject && (
            <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[var(--indigo)] text-[10px] font-mono font-bold">
              <Database className="w-3 h-3" /> Grounded in {assignedSubject.display_name}
            </span>
          )}
        </div>
        {isAllComplete && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> All 5 Agents Complete
          </span>
        )}
      </div>

      {/* Vertical Pipeline */}
      <div className="pt-1">
        {AGENTS.map((agent, idx) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStates[agent.id]}
            output={agentOutputs[agent.id]}
            thinkingLog={thinkingLogs[agent.id]}
            onRetry={runPipeline}
            onInspectPayload={(title, payload) => setActiveModal({ title, payload })}
            isLast={idx === AGENTS.length - 1}
          />
        ))}
      </div>

      {activeModal && (
        <PayloadModal agentName={activeModal.title} payload={activeModal.payload} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Collapsible Debug Panel (Step 6 Enriched)
   ───────────────────────────────────────────── */
function DebugPanel({ agentDebug, assignedSubject }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const agentNames = { genolens: 'GenoLens', pulseiq: 'PulseIQ', synthai: 'SynthAI', pharmai: 'PharmAI', alertai: 'AlertAI' };

  const subj = assignedSubject || agentDebug.genolens?.assignedSubject;

  return (
    <div className="content-card border-2 border-amber-300 bg-amber-50/50 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-amber-900">Debug: Prompt & Data Provenance Inspector</h3>
        </div>
        <span className="text-[10px] font-mono text-amber-600">Step 6 Active Verification</span>
      </div>

      {/* Real Subject Grounding Line */}
      {subj && (
        <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--indigo)]" />
            <span className="font-bold text-slate-800">Assigned Real Subject:</span>
            <span className="text-[var(--indigo)] font-bold">{subj.display_name}</span>
            <span className="text-slate-500">({subj.source === 'ppg_dalia' ? 'PPG-DaLiA Dataset' : 'Fitbit Tracker Dataset'})</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Baseline HR: <strong className="text-rose-500">{subj.heart_rate_mean} bpm</strong> | Steps: <strong className="text-amber-600">{subj.steps_mean}</strong>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {Object.entries(agentDebug).map(([agentId, dbg]) => (
          <div key={agentId} className="rounded-xl border border-amber-200 bg-white overflow-hidden">
            <button onClick={() => toggle(agentId)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors">
              <span>{agentNames[agentId] || agentId} — <span className="font-mono text-[10px] text-amber-600">mode: {dbg.mode}</span></span>
              {expanded[agentId] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded[agentId] && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-1">System Prompt:</span>
                  <pre className="text-[11px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap overflow-x-auto max-h-[150px] overflow-y-auto">{dbg.systemPrompt}</pre>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 uppercase block mb-1">User Prompt (Interpolated with Real Subject Seed):</span>
                  <pre className="text-[11px] text-gray-700 bg-amber-50 p-3 rounded-lg border border-amber-200 whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto">{dbg.userPrompt}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
