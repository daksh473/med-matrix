import React from 'react';
import {
  Pill,
  ShieldCheck,
  Award,
  Bell,
  Heart,
  CheckCircle2,
  RotateCcw,
  Printer,
  Sparkles,
  Dna,
  Layers,
  ChevronRight,
  Activity,
  FileText
} from 'lucide-react';
import TelemetryChart from './TelemetryChart';

export default function FinalDashboard({
  patientInfo,
  timelineData,
  pipelineOutputs,
  onReset,
}) {
  const genolens = pipelineOutputs.genolens || {};
  const pulseiq = pipelineOutputs.pulseiq || {};
  const synthai = pipelineOutputs.synthai || {};
  const pharmai = pipelineOutputs.pharmai || {};
  const alertai = pipelineOutputs.alertai || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>N-of-1 Precision Decision Support Completed</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Clinical Report</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset / New Patient Demo</span>
          </button>
        </div>
      </div>

      {/* Screenshot Payoff Hero Dashboard */}
      <div className="relative rounded-3xl p-8 sm:p-10 glass-card border-2 border-cyan-500/40 shadow-2xl overflow-hidden space-y-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Hero Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Precision Recommendation
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                ID: MM-2026-09A
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {patientInfo.name}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {patientInfo.age}y / {patientInfo.sex} | {patientInfo.weight} | <span className="text-cyan-400 font-semibold">{patientInfo.geneticVariant}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 text-center min-w-[140px]">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Match Confidence</span>
              <span className="text-2xl font-black text-white">{pharmai.confidence_level || '94.8%'}</span>
            </div>
          </div>
        </div>

        {/* Highlight Drug Recommendation Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/50 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg">
                <Pill className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Target N-of-1 Therapeutic Regimen
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {pharmai.recommended_drug || "Amlodipine Besylate 5 mg + Lisinopril 5 mg"}
                </h2>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-slate-300">
              Dose: <span className="text-white font-bold">{pharmai.recommended_dose || "5 mg PO QD"}</span>
            </div>
          </div>

          {/* Genomic Clearance Validation Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Genomic Pathway Clearance: 100% CYP2D6 Defect Bypass (Safely cleared via CYP3A4 & Renal excretion)</span>
          </div>

          {/* Reasoning Bullets */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase">Clinical Mechanism Rationale (PharmAI & GenoLens):</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {pharmai.reasoning}
            </p>
          </div>
        </div>

        {/* 2-Column Details Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: SynthAI Multi-Layer Profile & Alternatives */}
          <div className="space-y-6">
            {/* Information Commons Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">SynthAI Information Commons Profile</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                {synthai.unified_patient_profile}
              </p>

              {synthai.key_risk_factors && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-mono font-semibold text-rose-400 uppercase block">Layered Risk Factors:</span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {synthai.key_risk_factors.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Alternative Drug Regimens */}
            {pharmai.alternative_options && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pill className="w-4 h-4 text-cyan-400" /> Second-Line Alternative Regimens
                </h3>
                <div className="space-y-2">
                  {pharmai.alternative_options.map((alt, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-300 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{alt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AlertAI Continuous Guardrails */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">AlertAI Continuous Safety Guardrails</h3>
              </div>

              {/* Thresholds */}
              {alertai.monitoring_thresholds && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase block">Wearable Telemetry Threshold Rules:</span>
                  <div className="space-y-1.5">
                    {alertai.monitoring_thresholds.map((thresh, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                        <Activity className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{thresh}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Schedule */}
              <div className="pt-2 space-y-1 border-t border-slate-800">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase block">Follow-Up Timeline:</span>
                <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono">
                  {alertai.follow_up_schedule}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 60-Day Telemetry Vector Reference Chart */}
      <TelemetryChart timelineData={timelineData} />
    </div>
  );
}
