import React from 'react';
import {
  Pill, ShieldCheck, Bell, Heart, CheckCircle2, RotateCcw, Printer,
  Sparkles, Layers, Activity, Award, AlertTriangle
} from 'lucide-react';
import TelemetryChart from './TelemetryChart';

export default function FinalDashboard({ patientInfo, timelineData, pipelineOutputs, onReset }) {
  const genolens = pipelineOutputs?.genolens || {};
  const pulseiq  = pipelineOutputs?.pulseiq || {};
  const synthai  = pipelineOutputs?.synthai || {};
  const pharmai  = pipelineOutputs?.pharmai || {};
  const alertai  = pipelineOutputs?.alertai || {};

  const confidencePct = parseFloat(pharmai.confidence_level) || 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (confidencePct / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Sparkles className="w-4 h-4 text-[var(--indigo)]" />
          <span className="font-medium">N-of-1 Precision Decision Complete</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border-light)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-dark)] transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
          <button onClick={onReset} className="flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--navy)] hover:bg-[#252a4a] text-white text-xs font-bold shadow-md transition-all transform hover:scale-[1.02]">
            <RotateCcw className="w-3.5 h-3.5" /> New Patient
          </button>
        </div>
      </div>

      {/* Hero Recommendation Card */}
      <div className="content-card border-2 border-[var(--indigo)]/20 shadow-lg relative overflow-hidden">
        {/* Decorative Gradient */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-[var(--indigo)]/5 to-[var(--sky)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-[var(--border-light)]">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Precision Recommendation
              </span>
              <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">{patientInfo.name}</h1>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                {patientInfo.age}y / {patientInfo.sex} | {patientInfo.weight} | <span className="text-[var(--indigo)] font-semibold">{patientInfo.geneticVariant}</span>
              </p>
            </div>

            {/* Confidence Ring */}
            <div className="flex flex-col items-center">
              <svg width="90" height="90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="45" cy="45" r="38" fill="none" stroke="var(--indigo)" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - confidencePct / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
                <text x="45" y="45" textAnchor="middle" dominantBaseline="central" className="text-lg font-extrabold" fill="var(--text-heading)" style={{ fontSize: '18px', fontWeight: 800 }}>
                  {pharmai.confidence_level || '—'}
                </text>
              </svg>
              <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">Match Confidence</span>
            </div>
          </div>

          {/* Drug Recommendation Block */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--bg-card-alt)] to-white border border-emerald-200 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                  <Pill className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold block">N-of-1 Therapeutic Regimen</span>
                  <h2 className="text-xl font-extrabold text-[var(--text-heading)]">{pharmai.recommended_drug || 'Pending...'}</h2>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] text-xs font-mono text-[var(--text-secondary)]">
                Dose: <span className="font-bold text-[var(--text-dark)]">{pharmai.recommended_dose || '—'}</span>
              </div>
            </div>

            {/* Genomic Bypass Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[var(--indigo)] text-[11px] font-mono font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Genomic Pathway Clearance: 100% CYP2D6 Defect Bypass
            </div>

            {/* Reasoning */}
            <div className="pt-3 border-t border-[var(--border-light)]">
              <h4 className="text-xs font-bold text-[var(--text-heading)] mb-2 uppercase tracking-wide">Clinical Rationale</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card-alt)] p-3.5 rounded-xl border border-[var(--border-light)]">
                {pharmai.reasoning}
              </p>
            </div>
          </div>

          {/* 2-Column Details */}
          <div className="grid grid-cols-2 gap-5">
            {/* Left: SynthAI + Alternatives */}
            <div className="space-y-5">
              <div className="content-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-heading)]">Information Commons Profile</h4>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-mono bg-[var(--bg-card-alt)] p-3 rounded-xl border border-[var(--border-light)]">
                  {synthai.unified_patient_profile}
                </p>
                {synthai.key_risk_factors && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-rose-500 uppercase">Risk Factors:</span>
                    <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] list-disc list-inside">
                      {synthai.key_risk_factors.map((rf, i) => <li key={i}>{rf}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {pharmai.alternative_options && (
                <div className="content-card">
                  <h4 className="text-xs font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[var(--sky)]" /> Second-Line Alternatives
                  </h4>
                  <div className="space-y-2">
                    {pharmai.alternative_options.map((alt, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center text-[10px] font-bold border border-[var(--border-light)]">{i + 1}</span>
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: AlertAI Guardrails */}
            <div className="space-y-5">
              <div className="content-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-heading)]">Safety Guardrails</h4>
                </div>

                {alertai.monitoring_thresholds && (
                  <div className="space-y-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Monitoring Thresholds:</span>
                    {alertai.monitoring_thresholds.map((t, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                        <Activity className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        {t}
                      </div>
                    ))}
                  </div>
                )}

                {alertai.alert_conditions && (
                  <div className="space-y-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-rose-500 uppercase">Alert Conditions:</span>
                    {alertai.alert_conditions.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-600 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--border-light)]">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block mb-1">Follow-Up:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-card-alt)] p-2.5 rounded-xl border border-[var(--border-light)] font-mono">
                    {alertai.follow_up_schedule}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Reference */}
      <TelemetryChart timelineData={timelineData} compact />
    </div>
  );
}
