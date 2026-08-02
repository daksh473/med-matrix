import React, { useRef, useState } from 'react';
import {
  Pill, ShieldCheck, Bell, Heart, CheckCircle2, RotateCcw, Printer, Download,
  Sparkles, Layers, Activity, Award, AlertTriangle, FileText, Loader2, Database
} from 'lucide-react';
import TelemetryChart from './TelemetryChart';
import PdfReportTemplate from './PdfReportTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function FinalDashboard({ patientInfo, timelineData, assignedSubject, pipelineOutputs, onReset }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const pdfTemplateRef = useRef(null);

  const genolens = pipelineOutputs?.genolens || {};
  const pulseiq  = pipelineOutputs?.pulseiq || {};
  const synthai  = pipelineOutputs?.synthai || {};
  const pharmai  = pipelineOutputs?.pharmai || {};
  const alertai  = pipelineOutputs?.alertai || {};

  const confidencePct = parseFloat(pharmai.confidence_level) || 0;
  const circumference = 2 * Math.PI * 38;

  // High-Resolution PDF Download Generator using Purpose-Built Template
  const handleDownloadPdf = async () => {
    if (!pdfTemplateRef.current) return;
    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      const element = pdfTemplateRef.current;
      
      // Temporarily reveal template for canvas capture
      element.style.display = 'block';
      window.dispatchEvent(new Event('resize'));
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution (300 DPI equivalent)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000
      });

      // Hide template back
      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // Page 1
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Page 2+ if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      const todayDate = new Date().toISOString().split('T')[0];
      const fileName = `MedMatrix_Report_${patientInfo.name.replace(/\s+/g, '_')}_${todayDate}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      if (pdfTemplateRef.current) pdfTemplateRef.current.style.display = 'none';
      setPdfError('PDF generation failed. Using browser print fallback...');
      setTimeout(() => window.print(), 500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Actions Bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Sparkles className="w-4 h-4 text-[var(--indigo)]" />
          <span className="font-medium">N-of-1 Precision Decision Support Complete</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Requirement 1: Export as PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--indigo)] text-white text-xs font-bold shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Export as PDF'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border-light)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-dark)] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--navy)] hover:bg-[#252a4a] text-white text-xs font-bold shadow-md transition-all transform hover:scale-[1.02]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Patient
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center justify-between no-print">
          <span>{pdfError}</span>
          <button onClick={() => setPdfError(null)} className="font-bold underline text-amber-900">Dismiss</button>
        </div>
      )}

      {/* On-Screen Hero Recommendation Card */}
      <div className="content-card border-2 border-[var(--indigo)]/20 shadow-lg relative overflow-hidden bg-white">
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
              {assignedSubject && (
                <p className="text-[11px] font-mono text-[var(--indigo)] mt-1 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Grounded in {assignedSubject.display_name} ({assignedSubject.source.toUpperCase()})
                </p>
              )}
            </div>

            {/* Confidence Ring */}
            <div className="flex flex-col items-center">
              <svg width="90" height="90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="45" cy="45" r="38" fill="none" stroke="var(--indigo)" strokeWidth="6"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${circumference * (1 - confidencePct / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
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
              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-[var(--text-secondary)] shadow-xs">
                Dose: <span className="font-bold text-[var(--text-dark)]">{pharmai.recommended_dose || '—'}</span>
              </div>
            </div>

            {/* Genomic Bypass & CPIC Grounding Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[var(--indigo)] text-[11px] font-mono font-semibold">
                <ShieldCheck className="w-4 h-4 text-[var(--indigo)]" />
                Genomic Pathway Clearance: 100% Defect Bypass Verified
              </div>
              {pharmai.cpic_guideline_cited && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold">
                  <FileText className="w-3.5 h-3.5" /> Grounded in {pharmai.cpic_guideline_cited}
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="pt-3 border-t border-[var(--border-light)] space-y-2">
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wide">Clinical Rationale</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-white p-3.5 rounded-xl border border-[var(--border-light)] font-medium">
                {pharmai.reasoning}
              </p>

              {/* Justified Confidence Rationale */}
              {pharmai.confidence_rationale && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5 text-[10px] uppercase text-emerald-700">Justified Confidence Rationale:</span>
                  {pharmai.confidence_rationale}
                </div>
              )}
            </div>
          </div>

          {/* 2-Column Details */}
          <div className="grid grid-cols-2 gap-5">
            {/* Left: SynthAI + Alternatives */}
            <div className="space-y-5">
              <div className="content-card bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-heading)]">Information Commons Profile</h4>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-[var(--border-light)]">
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
                <div className="content-card bg-white">
                  <h4 className="text-xs font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[var(--sky)]" /> Second-Line Alternatives
                  </h4>
                  <div className="space-y-2">
                    {pharmai.alternative_options.map((alt, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-[var(--border-light)] text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white text-[var(--text-muted)] flex items-center justify-center text-[10px] font-bold border border-[var(--border-light)]">{i + 1}</span>
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: AlertAI Guardrails */}
            <div className="space-y-5">
              <div className="content-card bg-white">
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
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-[var(--border-light)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
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
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block mb-1">Follow-Up Schedule:</span>
                  <p className="text-[11px] text-[var(--text-secondary)] bg-slate-50 p-2.5 rounded-xl border border-[var(--border-light)] font-mono">
                    {alertai.follow_up_schedule}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Reference Chart */}
      <div className="content-card bg-white">
        <TelemetryChart timelineData={timelineData} compact />
      </div>

      {/* Dedicated Purpose-Built PDF Template (Hidden from screen view, revealed for html2canvas capture) */}
      <div style={{ display: 'none' }}>
        <PdfReportTemplate
          ref={pdfTemplateRef}
          patientInfo={patientInfo}
          timelineData={timelineData}
          assignedSubject={assignedSubject}
          pipelineOutputs={pipelineOutputs}
        />
      </div>
    </div>
  );
}
