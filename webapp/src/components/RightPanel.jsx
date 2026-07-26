import React from 'react';
import {
  User, Droplets, Ruler, Weight, Heart, Dna,
  ChevronRight, CheckCircle2, Clock, Loader2, CalendarDays
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Patient Profile Card
   ───────────────────────────────────────────── */
function PatientProfileCard({ patientInfo }) {
  if (!patientInfo) return null;

  const initials = patientInfo.name
    ? patientInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '??';

  return (
    <div className="content-card flex flex-col items-center text-center">
      {/* Avatar Circle */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4361ee] to-[#4cc9f0] flex items-center justify-center text-white font-bold text-lg shadow-md mb-3">
        {initials}
      </div>
      <h4 className="font-bold text-[var(--text-heading)] text-sm">{patientInfo.name}</h4>
      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
        {patientInfo.age}y • {patientInfo.sex}
      </p>

      {/* Stat Chips Row */}
      <div className="flex gap-2 mt-4 w-full">
        <div className="profile-chip">
          <Dna className="w-3.5 h-3.5 text-[var(--purple)] mb-1" />
          <span className="text-[10px] text-[var(--text-muted)] leading-none">Variant</span>
          <span className="text-[10px] font-bold text-[var(--text-dark)] mt-0.5 leading-tight text-center truncate w-full">
            {patientInfo.geneticVariant?.split(' ')[0] || '—'}
          </span>
        </div>
        <div className="profile-chip">
          <Weight className="w-3.5 h-3.5 text-[var(--indigo)] mb-1" />
          <span className="text-[10px] text-[var(--text-muted)] leading-none">Weight</span>
          <span className="text-[10px] font-bold text-[var(--text-dark)] mt-0.5">
            {patientInfo.weight?.split(' ')[0] || '—'}
          </span>
        </div>
        <div className="profile-chip">
          <Heart className="w-3.5 h-3.5 text-[var(--rose)] mb-1" />
          <span className="text-[10px] text-[var(--text-muted)] leading-none">Condition</span>
          <span className="text-[10px] font-bold text-[var(--text-dark)] mt-0.5 truncate w-full text-center">
            HTN
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Day Progress Widget (Calendar-Style)
   ───────────────────────────────────────────── */
function DayProgressWidget({ timelineData, currentDay }) {
  const totalDays = timelineData?.length || 60;
  const startDate = timelineData?.[0]?.date || '2025-01-15';
  const endDate = timelineData?.[totalDays - 1]?.date || '2025-03-15';

  // Show a strip of day numbers around the current position
  const visibleDays = [];
  const center = currentDay || totalDays;
  for (let d = Math.max(1, center - 3); d <= Math.min(totalDays, center + 3); d++) {
    visibleDays.push(d);
  }

  return (
    <div className="content-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[var(--indigo)]" />
          <span className="text-xs font-bold text-[var(--text-heading)]">Timeline Progress</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {startDate} → {endDate}
        </span>
      </div>

      {/* Day Number Strip */}
      <div className="flex items-center justify-center gap-1.5 py-2">
        {visibleDays.map(day => (
          <div
            key={day}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              day === (currentDay || totalDays)
                ? 'bg-[var(--indigo)] text-white shadow-md'
                : day <= (currentDay || totalDays)
                ? 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
                : 'text-[var(--text-faint)]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
          <span>Day {currentDay || totalDays} of {totalDays}</span>
          <span className="font-semibold text-[var(--indigo)]">{Math.round(((currentDay || totalDays) / totalDays) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--indigo)] to-[var(--sky)] rounded-full transition-all duration-700"
            style={{ width: `${((currentDay || totalDays) / totalDays) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Agent Queue Cards (Next Up)
   ───────────────────────────────────────────── */
const AGENTS_META = [
  { id: 'genolens', name: 'GenoLens', desc: 'Pharmacogenomics', color: '#4361ee' },
  { id: 'pulseiq', name: 'PulseIQ', desc: 'Telemetry Analysis', color: '#f43f5e' },
  { id: 'synthai', name: 'SynthAI', desc: 'Information Fusion', color: '#a78bfa' },
  { id: 'pharmai', name: 'PharmAI', desc: 'Precision Dosing', color: '#10b981' },
  { id: 'alertai', name: 'AlertAI', desc: 'Safety Guardrails', color: '#f59e0b' },
];

function AgentQueueCards({ agentStates }) {
  return (
    <div className="content-card">
      <h4 className="text-xs font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
        <GitBranchIcon className="w-4 h-4 text-[var(--purple)]" />
        Pipeline Queue
      </h4>
      <div className="space-y-2">
        {AGENTS_META.map((agent) => {
          const status = agentStates?.[agent.id] || 'waiting';
          return (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] transition-all hover:shadow-sm"
            >
              <div
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ background: agent.color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-[var(--text-dark)] block">{agent.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{agent.desc}</span>
              </div>
              <StatusBadge status={status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GitBranchIcon(props) {
  return <GitBranch {...props} />;
}

function GitBranch(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function StatusBadge({ status }) {
  if (status === 'complete') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
        <CheckCircle2 className="w-3 h-3" /> Done
      </span>
    );
  }
  if (status === 'thinking') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" /> Running
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-medium">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

/* ─────────────────────────────────────────────
   Confidence Ring (Circular Progress)
   ───────────────────────────────────────────── */
function ConfidenceRing({ value, label }) {
  const pct = parseFloat(value) || 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="confidence-ring-card">
      <svg width="110" height="110" className="mb-2">
        <circle cx="55" cy="55" r="45" fill="none" strokeWidth="8" className="ring-svg-track" />
        <circle
          cx="55" cy="55" r="45" fill="none" strokeWidth="8"
          className="ring-svg-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 55 55)"
          style={{ animation: 'progressRing 1.5s ease-out' }}
        />
      </svg>
      <span className="text-2xl font-extrabold">{value || '—'}</span>
      <span className="text-[11px] opacity-80 mt-0.5">{label || 'Recommendation Confidence'}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Exported Composite RightPanel
   ───────────────────────────────────────────── */
export default function RightPanel({
  patientInfo,
  timelineData,
  agentStates,
  confidenceValue,
  screen,
}) {
  return (
    <div className="right-panel">
      {patientInfo && <PatientProfileCard patientInfo={patientInfo} />}

      {timelineData && (
        <DayProgressWidget
          timelineData={timelineData}
          currentDay={timelineData.length}
        />
      )}

      {screen === 'pipeline' && (
        <AgentQueueCards agentStates={agentStates} />
      )}

      {(screen === 'pipeline' || screen === 'dashboard') && confidenceValue && (
        <ConfidenceRing
          value={confidenceValue}
          label="Recommendation Confidence"
        />
      )}
    </div>
  );
}
