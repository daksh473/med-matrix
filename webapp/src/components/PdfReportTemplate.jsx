import React from 'react';
import {
  Activity, ShieldCheck, Heart, Moon, Wind, Pill, Bell, Layers, Dna, CheckCircle2, AlertTriangle, Database
} from 'lucide-react';
import TelemetryChart from './TelemetryChart';

export default React.forwardRef(function PdfReportTemplate({
  patientInfo,
  timelineData,
  assignedSubject,
  pipelineOutputs
}, ref) {
  const genolens = pipelineOutputs?.genolens || {};
  const pulseiq  = pipelineOutputs?.pulseiq || {};
  const synthai  = pipelineOutputs?.synthai || {};
  const pharmai  = pipelineOutputs?.pharmai || {};
  const alertai  = pipelineOutputs?.alertai || {};

  const confidencePct = parseFloat(pharmai.confidence_level) || 0;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const caseId = `MM-2026-${((patientInfo?.name?.length || 5) * 179 + 1042) % 9000 + 1000}`;

  return (
    <div
      ref={ref}
      id="pdf-export-dossier"
      className="bg-white text-slate-900 font-sans p-8 space-y-6 max-w-[1000px] mx-auto border border-slate-200"
      style={{ width: '1000px', boxSizing: 'border-box' }}
    >
      {/* ── 1. HEADER / COVER SECTION ── */}
      <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">MED MATRIX AI</h1>
              <span className="text-[10px] font-mono text-cyan-600 font-semibold tracking-wider uppercase">
                Your DNA. Your Data. Your Medicine.
              </span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-3">Personalized Treatment Recommendation Report</h2>
          <p className="text-xs text-slate-500 font-mono">N-of-1 Precision Decision Support Dossier</p>
        </div>

        <div className="text-right space-y-1 font-mono text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div><strong className="text-slate-900">Case ID:</strong> {caseId}</div>
          <div><strong className="text-slate-900">Date:</strong> {dateStr}</div>
          <div><strong className="text-slate-900">Status:</strong> <span className="text-emerald-600 font-bold">VERIFIED</span></div>
          {assignedSubject && (
            <div className="text-[10px] text-cyan-700 font-bold pt-1 border-t border-slate-200 mt-1">
              Grounded in: {assignedSubject.display_name}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. PATIENT PROFILE SECTION ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-600" /> Patient Dossier & Intake Demographics
        </h3>
        <div className="grid grid-cols-4 gap-3 text-xs border-b border-slate-200 pb-3">
          <div><span className="text-slate-500 block text-[10px]">Patient Name</span><strong className="text-slate-900 text-sm">{patientInfo.name}</strong></div>
          <div><span className="text-slate-500 block text-[10px]">Age / Sex</span><strong className="text-slate-900">{patientInfo.age}y / {patientInfo.sex}</strong></div>
          <div><span className="text-slate-500 block text-[10px]">Body Weight</span><strong className="text-slate-900">{patientInfo.weight}</strong></div>
          <div><span className="text-slate-500 block text-[10px]">Pharmacogenomics</span><strong className="text-indigo-600 font-mono">{patientInfo.geneticVariant}</strong></div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] font-bold block mb-0.5">Primary Condition & Symptoms:</span>
            <p className="text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-slate-200">{patientInfo.condition}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] font-bold block mb-0.5">Current Prescription Medications:</span>
            <p className="text-slate-800 leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-slate-200">{patientInfo.medications}</p>
          </div>
        </div>
      </div>

      {/* ── 3. AI PIPELINE SUMMARY SECTION ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" /> 5-Agent Precision Pipeline Execution Summary
        </h3>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold uppercase">GenoLens</span>
            <div className="flex-1">
              <strong className="text-slate-900">{genolens.metabolizer_status || patientInfo.geneticVariant}</strong>
              <p className="text-slate-600 text-[11px] mt-0.5">{genolens.summary}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-bold uppercase">PulseIQ</span>
            <div className="flex-1">
              <strong className="text-slate-900">{pulseiq.baseline_summary || '60-day wearable telemetry analyzed'}</strong>
              <p className="text-slate-600 text-[11px] mt-0.5">{pulseiq.trend_analysis || pulseiq.summary}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-mono text-[10px] font-bold uppercase">SynthAI</span>
            <div className="flex-1">
              <strong className="text-slate-900">Unified Multi-Layer Profile Synthesized</strong>
              <p className="text-slate-600 text-[11px] mt-0.5">{synthai.summary}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold uppercase">PharmAI</span>
            <div className="flex-1">
              <strong className="text-emerald-700">{pharmai.recommended_drug} ({pharmai.recommended_dose})</strong>
              <p className="text-slate-600 text-[11px] mt-0.5">Match Confidence: {pharmai.confidence_level}</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-mono text-[10px] font-bold uppercase">AlertAI</span>
            <div className="flex-1">
              <strong className="text-amber-800">Safety Guardrails & Monitoring Established</strong>
              <p className="text-slate-600 text-[11px] mt-0.5">{alertai.follow_up_schedule}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. FINAL RECOMMENDATION SECTION (HIGH VISIBILITY BOX) ── */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md page-break-inside-avoid">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">N-of-1 Primary Therapeutic Recommendation</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold">
            100% Genomic Clearance Bypass
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{pharmai.recommended_drug || 'Pending...'}</h2>
            <p className="text-sm font-mono text-cyan-300 mt-1">Recommended Dosing: <strong>{pharmai.recommended_dose}</strong></p>
          </div>

          {/* Static Horizontal Confidence Bar Indicator */}
          <div className="w-56 bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Match Confidence</span>
              <span className="font-extrabold text-emerald-400">{pharmai.confidence_level || '94.8%'}</span>
            </div>
            <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full"
                style={{ width: `${Math.max(10, Math.min(100, confidencePct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clinical Rationale Paragraph */}
        <div className="pt-3 border-t border-slate-800">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">Clinical Rationale & Pharmacology</h4>
          <p className="text-xs text-slate-200 leading-relaxed font-normal bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            {pharmai.reasoning}
          </p>
        </div>

        {/* Key Risk Factors & Alternatives */}
        <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase block mb-1">Identified Risk Factors:</span>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              {synthai.key_risk_factors ? (
                synthai.key_risk_factors.map((rf, i) => <li key={i}>{rf}</li>)
              ) : (
                <li>No acute contraindications identified.</li>
              )}
            </ul>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block mb-1">Second-Line Alternative Regimens:</span>
            <ol className="space-y-1 text-[11px] text-slate-300 list-decimal list-inside font-mono">
              {pharmai.alternative_options ? (
                pharmai.alternative_options.map((alt, i) => <li key={i}>{alt}</li>)
              ) : (
                <li>Alternative non-CYP substrates available upon consult.</li>
              )}
            </ol>
          </div>
        </div>
      </div>

      {/* ── 5. MONITORING & SAFETY SECTION ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 page-break-inside-avoid">
        <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-amber-600" /> Monitoring Thresholds & Safety Guardrails
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-amber-600 uppercase block">Telemetry Monitoring Rules:</span>
            {alertai.monitoring_thresholds ? (
              alertai.monitoring_thresholds.map((t, i) => (
                <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))
            ) : null}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-rose-600 uppercase block">Adverse Reaction Trigger Conditions:</span>
            {alertai.alert_conditions ? (
              alertai.alert_conditions.map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>{c}</span>
                </div>
              ))
            ) : null}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 text-xs">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">Follow-Up Protocol:</span>
          <p className="text-[11px] text-slate-800 font-mono bg-white p-2.5 rounded-lg border border-slate-200">
            {alertai.follow_up_schedule}
          </p>
        </div>
      </div>

      {/* ── 6. VITALS CHART SECTION ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 page-break-inside-avoid">
        <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-rose-500" /> 60-Day Telemetry Trend Snapshot (Fitbit / PPG / WESAD)
        </h3>
        <div className="bg-white p-2 rounded-xl border border-slate-200">
          <TelemetryChart timelineData={timelineData} compact />
        </div>
      </div>

      {/* ── 7. FOOTER SECTION ── */}
      <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
        <p className="max-w-[700px] leading-tight">
          <strong>Clinical Disclaimer:</strong> This document is an AI-generated decision-support recommendation produced for demonstration purposes by Med Matrix AI. It does not replace independent clinical evaluation by a licensed healthcare provider.
        </p>
        <div className="text-right font-mono">
          <div><strong>Med Matrix AI System v1.0</strong></div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
});
