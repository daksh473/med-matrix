import React from 'react';
import {
  CheckCircle2, Clock, Loader2, AlertTriangle, RotateCcw, Eye,
  Dna, Heart, Globe, Pill, Bell
} from 'lucide-react';

const AGENT_CONFIG = {
  genolens: { icon: Dna, color: '#4361ee', bg: 'bg-blue-50', text: 'text-blue-600' },
  pulseiq:  { icon: Heart, color: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-500' },
  synthai:  { icon: Globe, color: '#a78bfa', bg: 'bg-purple-50', text: 'text-purple-500' },
  pharmai:  { icon: Pill, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  alertai:  { icon: Bell, color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-500' },
};

export default function AgentCard({
  agent,
  status,
  output,
  thinkingLog,
  onRetry,
  onInspectPayload,
  isLast
}) {
  const cfg = AGENT_CONFIG[agent.id] || AGENT_CONFIG.genolens;
  const IconComponent = cfg.icon;

  return (
    <div className="relative flex items-start gap-5">
      {/* Timeline Node & Connector */}
      <div className="flex flex-col items-center self-stretch">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
          status === 'complete'
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
            : status === 'thinking'
            ? 'bg-[var(--indigo)] text-white shadow-md shadow-blue-200 animate-pulse'
            : status === 'error'
            ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
            : 'bg-[var(--bg-input)] text-[var(--text-faint)] border border-[var(--border-light)]'
        }`}>
          {status === 'complete' ? <CheckCircle2 className="w-5 h-5" />
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
          status === 'waiting' ? 'opacity-50' : ''
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
                </div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">{agent.title}</h3>
              </div>
            </div>

            {/* Status Badge */}
            {status === 'complete' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </span>
            )}
            {status === 'thinking' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-semibold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
              </span>
            )}
            {status === 'waiting' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-[11px] font-mono">
                <Clock className="w-3.5 h-3.5" /> Waiting
              </span>
            )}
            {status === 'error' && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-500 text-[11px] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Failed
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{agent.description}</p>

          {/* Thinking Ticker */}
          {status === 'thinking' && (
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

          {/* Complete: Summary */}
          {status === 'complete' && output && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] text-xs leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-heading)] block mb-1">Summary:</span>
                {output.summary}
              </div>

              {agent.id === 'genolens' && output.drug_interaction_risks && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-rose-500 uppercase">Interaction Risks:</span>
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] list-disc list-inside">
                    {output.drug_interaction_risks.map((r, i) => <li key={i} className="leading-snug">{r}</li>)}
                  </ul>
                </div>
              )}

              {agent.id === 'pulseiq' && output.anomalies_detected && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Anomalies:</span>
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] list-disc list-inside">
                    {output.anomalies_detected.map((a, i) => <li key={i} className="leading-snug">{a}</li>)}
                  </ul>
                </div>
              )}

              {agent.id === 'pharmai' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold block">Recommended</span>
                    <span className="font-bold text-[var(--text-heading)] text-sm">{output.recommended_drug}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold text-xs">
                    {output.confidence_level}
                  </span>
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
          {status === 'error' && (
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
