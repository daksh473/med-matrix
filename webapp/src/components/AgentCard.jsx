import React from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Dna,
  Heart,
  Globe,
  Pill,
  Bell
} from 'lucide-react';

const AGENT_ICONS = {
  genolens: Dna,
  pulseiq: Heart,
  synthai: Globe,
  pharmai: Pill,
  alertai: Bell,
};

const AGENT_COLORS = {
  genolens: { border: 'border-cyan-500/40', bg: 'from-cyan-500/10 to-blue-500/5', text: 'text-cyan-400' },
  pulseiq: { border: 'border-rose-500/40', bg: 'from-rose-500/10 to-pink-500/5', text: 'text-rose-400' },
  synthai: { border: 'border-purple-500/40', bg: 'from-purple-500/10 to-indigo-500/5', text: 'text-purple-400' },
  pharmai: { border: 'border-emerald-500/40', bg: 'from-emerald-500/10 to-teal-500/5', text: 'text-emerald-400' },
  alertai: { border: 'border-amber-500/40', bg: 'from-amber-500/10 to-orange-500/5', text: 'text-amber-400' },
};

export default function AgentCard({
  agent,
  status, // 'waiting' | 'thinking' | 'complete' | 'error'
  output,
  thinkingLog,
  onRetry,
  onInspectPayload,
  isLast
}) {
  const IconComponent = AGENT_ICONS[agent.id] || Dna;
  const colorTheme = AGENT_COLORS[agent.id] || AGENT_COLORS.genolens;

  return (
    <div className="relative flex items-start gap-4 sm:gap-6">
      {/* Timeline Node & Connector */}
      <div className="flex flex-col items-center self-stretch">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
            status === 'complete'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10'
              : status === 'thinking'
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 animate-pulse ring-4 ring-cyan-500/20'
              : status === 'error'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}
        >
          {status === 'complete' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : status === 'thinking' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : status === 'error' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        {!isLast && (
          <div
            className={`flex-1 w-0.5 my-2 transition-all duration-700 ${
              status === 'complete'
                ? 'bg-gradient-to-b from-emerald-500 to-teal-500'
                : status === 'thinking'
                ? 'bg-gradient-to-b from-cyan-500 to-slate-800 animate-pulse'
                : 'bg-slate-800'
            }`}
          />
        )}
      </div>

      {/* Main Agent Card Container */}
      <div className="flex-1 pb-8">
        <div
          className={`rounded-2xl p-6 transition-all duration-500 glass-card border ${
            status === 'thinking'
              ? 'agent-thinking border-cyan-500/60 shadow-xl shadow-cyan-500/10'
              : status === 'complete'
              ? `bg-gradient-to-br ${colorTheme.bg} ${colorTheme.border} shadow-lg`
              : status === 'error'
              ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/40 border-slate-800/80 opacity-60'
          }`}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 ${colorTheme.text}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Agent {agent.step}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {agent.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{agent.title}</h3>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {status === 'complete' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              )}

              {status === 'thinking' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold font-mono animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                </span>
              )}

              {status === 'waiting' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" /> Waiting...
                </span>
              )}

              {status === 'error' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">{agent.description}</p>

          {/* Thinking Animation Ticker */}
          {status === 'thinking' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="shimmer-text">{thinkingLog || 'Chaining context & calling Claude API...'}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 h-full w-2/3 animate-pulse rounded-full"></div>
              </div>
            </div>
          )}

          {/* Complete Summary View */}
          {status === 'complete' && output && (
            <div className="space-y-4">
              {/* Primary Summary Box */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs leading-relaxed text-slate-200">
                <div className="font-semibold text-white mb-1">Executive Summary:</div>
                <p>{output.summary}</p>
              </div>

              {/* Specific Field Highlights per Agent */}
              {agent.id === 'genolens' && output.drug_interaction_risks && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-semibold text-rose-400 uppercase">Drug Interaction Risks Identified:</div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {output.drug_interaction_risks.map((risk, idx) => (
                      <li key={idx} className="leading-snug">{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {agent.id === 'pulseiq' && output.anomalies_detected && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-semibold text-amber-400 uppercase">Telemetry Trends & Anomalies:</div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {output.anomalies_detected.map((anomaly, idx) => (
                      <li key={idx} className="leading-snug">{anomaly}</li>
                    ))}
                  </ul>
                </div>
              )}

              {agent.id === 'pharmai' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">Recommended Drug & Dose</span>
                    <span className="font-bold text-white text-sm">{output.recommended_drug} — {output.recommended_dose}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                    {output.confidence_level || '94.5%'} Confidence
                  </span>
                </div>
              )}

              {/* Inspect JSON Payload Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onInspectPayload(agent.title, output)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect JSON Payload</span>
                </button>
              </div>
            </div>
          )}

          {/* Error View */}
          {status === 'error' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                Agent call encountered an error. Click retry to re-trigger.
              </div>
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Agent Call</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
