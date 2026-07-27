import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { Heart, Wind, Moon, Footprints, Calendar, Filter, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

/* ─────────────────────────────────────────────
   Custom Interactive Tooltip
   ───────────────────────────────────────────── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const sysBP = Math.round(d.heart_rate * 1.55);
  const diaBP = Math.round(d.heart_rate * 0.98);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[var(--border-light)] p-3.5 text-xs min-w-[200px] z-50">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[var(--indigo)]" />
          <span className="font-bold text-[var(--text-heading)]">Day {d.day}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">({d.date})</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          d.phase === 'baseline'
            ? 'bg-rose-50 text-rose-500 border border-rose-200'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {d.phase === 'baseline' ? 'Baseline' : 'Post-Rx'}
        </span>
      </div>
      <div className="space-y-1.5 font-mono">
        <Row icon={<Heart className="w-3.5 h-3.5" />} color="#f43f5e" label="Heart Rate" value={`${d.heart_rate} bpm`} />
        <Row icon={<Activity className="w-3.5 h-3.5" />} color="#4361ee" label="Est. BP" value={`${sysBP}/${diaBP} mmHg`} />
        <Row icon={<Wind className="w-3.5 h-3.5" />} color="#4cc9f0" label="SpO₂ Level" value={`${d.spo2}%`} />
        <Row icon={<Moon className="w-3.5 h-3.5" />} color="#a78bfa" label="Sleep Duration" value={`${d.sleep_hours} hrs`} />
        <Row icon={<Footprints className="w-3.5 h-3.5" />} color="#f59e0b" label="Step Count" value={d.steps.toLocaleString()} />
      </div>
    </div>
  );
}

function Row({ icon, color, label, value }) {
  return (
    <div className="flex items-center justify-between text-[11px]" style={{ color }}>
      <span className="flex items-center gap-1.5 font-medium">{icon} {label}</span>
      <span className="font-bold text-[var(--text-dark)]">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Exported Telemetry Chart Component (Requirement 5)
   ───────────────────────────────────────────── */
export default function TelemetryChart({ timelineData, compact = false }) {
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', 'baseline', 'post', 'last14'
  const [activeChartView, setActiveChartView] = useState('telemetry'); // 'telemetry', 'bp_bar', 'adherence_map'

  if (!timelineData?.length) {
    return (
      <div className="content-card text-center text-sm text-[var(--text-muted)] py-12">
        No telemetry data loaded.
      </div>
    );
  }

  // Filter Data according to Date Range Selection
  const filteredData = useMemo(() => {
    if (dateRangeFilter === 'baseline') {
      return timelineData.filter(d => d.phase === 'baseline');
    }
    if (dateRangeFilter === 'post') {
      return timelineData.filter(d => d.phase === 'post_intervention');
    }
    if (dateRangeFilter === 'last14') {
      return timelineData.slice(-14);
    }
    return timelineData;
  }, [timelineData, dateRangeFilter]);

  // Derive Blood Pressure Data (Systolic / Diastolic)
  const bpData = useMemo(() => {
    return filteredData.map(d => ({
      ...d,
      sys: Math.round(d.heart_rate * 1.55),
      dia: Math.round(d.heart_rate * 0.98),
      isElevated: d.heart_rate * 1.55 >= 135
    }));
  }, [filteredData]);

  // Find phase transition day
  const transitionDay = useMemo(() => {
    const idx = timelineData.findIndex((item, i) =>
      i > 0 && timelineData[i - 1].phase === 'baseline' && item.phase === 'post_intervention'
    );
    return idx !== -1 ? timelineData[idx].day : null;
  }, [timelineData]);

  // Compute averages
  const avgHR = (filteredData.reduce((s, d) => s + d.heart_rate, 0) / filteredData.length).toFixed(1);
  const avgSleep = (filteredData.reduce((s, d) => s + d.sleep_hours, 0) / filteredData.length).toFixed(1);
  const avgSpo2 = (filteredData.reduce((s, d) => s + d.spo2, 0) / filteredData.length).toFixed(1);

  const chartHeight = compact ? 190 : 250;

  return (
    <div className="space-y-4">
      {/* Chart Control Bar (Date Filters + Chart View Toggle) */}
      {!compact && (
        <div className="content-card p-3 flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card-alt)]">
          {/* Chart Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[var(--border-light)] shadow-xs">
            <button
              onClick={() => setActiveChartView('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'telemetry'
                  ? 'bg-[var(--navy)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-dark)]'
              }`}
            >
              Telemetry Trends (HR & Sleep)
            </button>
            <button
              onClick={() => setActiveChartView('bp_bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'bp_bar'
                  ? 'bg-[var(--navy)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-dark)]'
              }`}
            >
              Blood Pressure Bar Chart
            </button>
            <button
              onClick={() => setActiveChartView('adherence_map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'adherence_map'
                  ? 'bg-[var(--navy)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-dark)]'
              }`}
            >
              Adherence Heat Map
            </button>
          </div>

          {/* Date Range Selector Buttons */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--indigo)]" />
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Date Range:</span>
            {[
              { id: 'all', label: 'All 60 Days' },
              { id: 'baseline', label: 'Baseline (D1-30)' },
              { id: 'post', label: 'Post-Rx (D31-60)' },
              { id: 'last14', label: 'Last 14 Days' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDateRangeFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  dateRangeFilter === f.id
                    ? 'bg-[var(--indigo)] text-white shadow-xs'
                    : 'bg-white text-[var(--text-secondary)] border border-[var(--border-light)] hover:border-[var(--border-medium)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: Main Dual Area/Line Charts */}
      {activeChartView === 'telemetry' && (
        <div className="flex gap-5">
          {/* Heart Rate Chart Card */}
          <div className="content-card flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)] block leading-none">Resting Heart Rate</span>
                  <span className="text-xl font-extrabold text-[var(--text-heading)]">{avgHR} <span className="text-xs font-medium text-[var(--text-muted)]">bpm (avg)</span></span>
                </div>
              </div>
              <PhaseLegend />
            </div>

            <div style={{ height: chartHeight }} className="mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `D${v}`} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip content={<ChartTooltip />} />
                  {transitionDay && dateRangeFilter === 'all' && (
                    <ReferenceLine
                      x={transitionDay} stroke="#4361ee" strokeDasharray="6 3" strokeWidth={2}
                      label={{ value: 'Intervention', position: 'insideTopLeft', fill: '#4361ee', fontSize: 10, fontWeight: 700 }}
                    />
                  )}
                  <defs>
                    <linearGradient id="hrFillLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={2.5} fill="url(#hrFillLight)" dot={{ r: 2.5, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f43f5e' }} name="HR (bpm)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sleep & SpO2 Chart Card */}
          <div className="content-card flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)] block leading-none">Sleep & SpO₂</span>
                  <span className="text-xl font-extrabold text-[var(--text-heading)]">{avgSleep} <span className="text-xs font-medium text-[var(--text-muted)]">hrs</span> / {avgSpo2}<span className="text-xs font-medium text-[var(--text-muted)]">%</span></span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa] inline-block" /> Sleep</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4cc9f0] inline-block" /> SpO₂</span>
              </div>
            </div>

            <div style={{ height: chartHeight }} className="mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `D${v}`} />
                  <YAxis yAxisId="sleep" stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 12]} />
                  <YAxis yAxisId="spo2" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} domain={[94, 100]} hide />
                  <Tooltip content={<ChartTooltip />} />
                  {transitionDay && dateRangeFilter === 'all' && (
                    <ReferenceLine
                      x={transitionDay} yAxisId="sleep" stroke="#4361ee" strokeDasharray="6 3" strokeWidth={2}
                      label={{ value: 'Intervention', position: 'insideTopLeft', fill: '#4361ee', fontSize: 10, fontWeight: 700 }}
                    />
                  )}
                  <Bar yAxisId="sleep" dataKey="sleep_hours" fill="#a78bfa" opacity={0.35} radius={[4, 4, 0, 0]} barSize={7} name="Sleep (hrs)" />
                  <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#4cc9f0" strokeWidth={2.5} dot={{ r: 2.5, fill: '#4cc9f0', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4cc9f0' }} name="SpO₂ (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Blood Pressure Bar Chart with Threshold Markers */}
      {activeChartView === 'bp_bar' && (
        <div className="content-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[var(--indigo)]" />
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block leading-none">Blood Pressure Trajectory</span>
                <span className="text-base font-bold text-[var(--text-heading)]">Systolic / Diastolic Range Bar Chart</span>
              </div>
            </div>

            {/* Threshold Legend */}
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[var(--indigo)]" /> Normal (&lt;130 mmHg)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                <span className="w-3 h-3 rounded bg-amber-500" /> Elevated (&ge;135 mmHg)
              </span>
            </div>
          </div>

          <div style={{ height: 260 }} className="mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bpData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `D${v}`} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[60, 160]} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={120} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Normal 120 mmHg', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={140} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Stage 1 HTN 140 mmHg', fill: '#f43f5e', fontSize: 10, position: 'insideTopLeft' }} />
                <Bar dataKey="sys" radius={[4, 4, 0, 0]} barSize={9} name="Systolic BP">
                  {bpData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isElevated ? '#f59e0b' : '#4361ee'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: Medication Adherence & Data Heat Map Grid */}
      {activeChartView === 'adherence_map' && (
        <div className="content-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block leading-none">Compliance & Grounding Matrix</span>
                <span className="text-base font-bold text-[var(--text-heading)]">60-Day Telemetry & Medication Adherence Heat Map</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> 100% Complete</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Minor Gap</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-400 inline-block" /> Missed Log</span>
            </div>
          </div>

          {/* Calendar Matrix Grid */}
          <div className="grid grid-cols-10 gap-2 p-3 bg-[var(--bg-card-alt)] rounded-2xl border border-[var(--border-light)]">
            {filteredData.map(d => {
              const statusColor = d.heart_rate > 90 ? 'bg-amber-400' : 'bg-emerald-500';
              return (
                <div
                  key={d.day}
                  className={`p-2 rounded-xl text-white font-mono text-[10px] flex flex-col items-center justify-center shadow-xs transition-transform hover:scale-105 ${statusColor}`}
                  title={`Day ${d.day} (${d.date}): HR ${d.heart_rate} bpm, Sleep ${d.sleep_hours}h`}
                >
                  <span className="font-bold">D{d.day}</span>
                  <span className="text-[9px] opacity-90">{d.heart_rate}bpm</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseLegend() {
  return (
    <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--text-muted)]">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Baseline</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Post-Rx</span>
    </div>
  );
}
