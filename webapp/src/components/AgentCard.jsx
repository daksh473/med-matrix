import React, { useState } from 'react';
import {
  CheckCircle2, Clock, Loader2, AlertTriangle, RotateCcw, Eye,
  Dna, Heart, Globe, Pill, Bell, Power, MinusCircle, ChevronDown, ChevronUp,
  BrainCircuit, ShieldCheck, Sparkles, AlertCircle, FileCheck
} from 'lucide-react';

const AGENT_CONFIG = {
  genolens: { icon: Dna, color: '#4361ee', bg: 'bg-blue-50', text: 'text-blue-600' },
  pulseiq:  { icon: Heart, color: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-500' },
  synthai:  { icon: Globe, color: '#a78bfa', bg: 'bg-purple-50', text: 'text-purple-500' },
  pharmai:  { icon: Pill, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  alertai:  { icon: Bell, color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-500' },
  critic:   { icon: ShieldCheck, color: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-600' }
};

export default function AgentCard({
  agent,
  status,
  isEnabled = true,
  onToggle,
  output,
  thinkingLog,
  onRetry,
  onInspectPayload,
  isLast
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showCriticReview, setShowCriticReview] = useState(false);

  const cfg = AGENT_CONFIG[agent.id] || AGENT_CONFIG.genolens;
  const IconComponent = cfg.icon;

  const reasoningSteps = output?.reasoning_steps || [];
  const critic = output?.critic_review || (agent.id === 'pharmai' ? output?.critic : null);

  return (
    <div className={`relative flex items-start gap-5 transition-opacity ${!isEnabled ? 'opacity-40' : ''}`}>
      {/* Timeline Node & Connector */}
      <div className="flex flex-col items-center self-stretch">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
          !isEnabled
            ? 'bg-gray-200 text-gray-400 border border-gray-300'
            : status === 'complete'
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
            : status === 'thinking'
            ? 'bg-[var(--indigo)] text-white shadow-md shadow-blue-200 animate-pulse'
            : status === 'error'
            ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
            : 'bg-[var(--bg-input)] text-[var(--text-faint)] border border-[var(--border-light)]'
        }`}>
          {!isEnabled ? <MinusCircle className="w-5 h-5" />
           : status === 'complete' ? <CheckCircle2 className="w-5 h-5" />
           : status === 'thinking' ? <Loader2 className="w-5 h-5 animate-spin" />
           : status === 'error' ? <AlertTriangle className="w-5 h-5" />
           : <Clock className="w-5 h-5" />}
        </div>
        {!isLast && (
          <div className={`flex-1 w-0.5 my-1.5 transition-all duration-700 ${
            status === 'complete' ? 'bg-emerald-300'
            : status === 'thinking' ? 'bg-blue-300 animate-pulse'
            : 'bg-[var(--border-light)]'
          }`} />
        )}
      </div>

      {/* Card Body */}
      <div className="flex-1 pb-6">
        <div className={`content-card transition-all duration-500 ${
          status === 'thinking' ? 'agent-thinking' : ''
        } ${status === 'error' ? 'border-rose-300 bg-rose-50/50' : ''} ${
          status === 'waiting' ? 'opacity-80' : ''
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                <IconComponent className={`w-4.5 h-4.5 ${cfg.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Agent {agent.step}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] font-mono border border-[var(--border-light)]">
                    {agent.badge}
                  </span>
                  {output?.cpic_guideline_cited && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[var(--indigo)] font-mono font-bold border border-blue-200">
                      {output.cpic_guideline_cited}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">{agent.title}</h3>
              </div>
            </div>

            {/* Status Badge & ON/OFF Toggle Switch */}
            <div className="flex items-center gap-3">
              <button
                onClick={onToggle}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${
                  isEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                }`}
                title={isEnabled ? 'Agent Enabled (Click to disable)' : 'Agent Disabled (Click to enable)'}
              >
                <Power className="w-3 h-3" />
                <span>{isEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {isEnabled && status === 'complete' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              )}
              {isEnabled && status === 'thinking' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-semibold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...
                </span>
              )}
              {isEnabled && status === 'waiting' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-[11px] font-mono">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              )}
              {!isEnabled && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-[11px] font-mono">
                  Disabled
                </span>
              )}
              {isEnabled && status === 'error' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-500 text-[11px] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{agent.description}</p>

          {/* Thinking Ticker */}
          {isEnabled && status === 'thinking' && (
            <div className="p-3 rounded-xl bg-[var(--bg-card-alt)] border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--indigo)] font-mono font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="shimmer-text">{thinkingLog || 'Calling Claude API...'}</span>
              </div>
              <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--indigo)] to-[var(--sky)] h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* Complete: Summary & Data Blocks */}
          {isEnabled && status === 'complete' && output && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] text-xs leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-heading)] block mb-1">Summary:</span>
                {output.summary}
              </div>

              {/* Requirement 2: Chain-of-Thought Expandable Section */}
              {reasoningSteps.length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 overflow-hidden">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[var(--indigo)] hover:bg-blue-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-[var(--indigo)]" />
                      <span>Clinical Reasoning Chain (Chain-of-Thought — {reasoningSteps.length} Steps)</span>
                    </div>
                    {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showReasoning && (
                    <div className="p-3 pt-1 space-y-1.5 border-t border-blue-100 bg-white">
                      {reasoningSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 leading-snug">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-[var(--indigo)] font-bold font-mono text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step.replace(/^Step \d+:\s*/i, '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* GenoLens Risks */}
              {agent.id === 'genolens' && output.drug_interaction_risks && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-rose-500 uppercase">Interaction Risks:</span>
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] list-disc list-inside">
                    {output.drug_interaction_risks.map((r, i) => <li key={i} className="leading-snug">{r}</li>)}
                  </ul>
                </div>
              )}

              {/* PulseIQ Anomalies */}
              {agent.id === 'pulseiq' && output.anomalies_detected && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Anomalies:</span>
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] list-disc list-inside">
                    {output.anomalies_detected.map((a, i) => <li key={i} className="leading-snug">{a}</li>)}
                  </ul>
                </div>
              )}

              {/* Requirement 4: PharmAI Recommendation with Justified Confidence */}
              {agent.id === 'pharmai' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold block">Recommended N-of-1 Regimen</span>
                      <span className="font-bold text-[var(--text-heading)] text-sm">{output.recommended_drug}</span>
                      <span className="text-[11px] text-emerald-700 font-mono block">Dose: {output.recommended_dose}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold text-xs inline-block">
                        Match Confidence: {output.confidence_level}
                      </span>
                    </div>
                  </div>

                  {/* Justified Confidence Rationale */}
                  {output.confidence_rationale && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase font-mono text-emerald-700">
                        <FileCheck className="w-3.5 h-3.5" /> Justified Confidence Rationale:
                      </span>
                      <p className="text-slate-600 leading-relaxed font-mono">{output.confidence_rationale}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Requirement 3: Critic Pass (AI Self-Review) Expandable Section */}
              {agent.id === 'pharmai' && critic && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/60 overflow-hidden">
                  <button
                    onClick={() => setShowCriticReview(!showCriticReview)}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>AI Self-Review (Critic Pass Audit — Status: {critic.review_status || 'VERIFIED'})</span>
                    </div>
                    {showCriticReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showCriticReview && (
                    <div className="p-3 space-y-2 text-xs border-t border-sky-200 bg-white">
                      <p className="text-slate-700 font-mono text-[11px] leading-relaxed">{critic.critique_summary}</p>
                      {critic.underweighted_risks?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono font-bold text-sky-700 uppercase">Monitored Risk Audit:</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-600">
                            {critic.underweighted_risks.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => onInspectPayload(agent.title, output)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--border-light)] border border-[var(--border-light)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--indigo)] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[var(--indigo)]" /> Inspect JSON
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {isEnabled && status === 'error' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
                Agent call failed. Click retry to re-trigger the pipeline.
              </div>
              <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
