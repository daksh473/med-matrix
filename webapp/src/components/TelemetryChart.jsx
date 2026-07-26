import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Heart, Wind, Moon, Footprints } from 'lucide-react';

/* ─────────────────────────────────────────────
   Custom Tooltip (Light Theme)
   ───────────────────────────────────────────── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[var(--border-light)] p-3 text-xs min-w-[180px]">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-light)]">
        <span className="font-semibold text-[var(--text-heading)]">Day {d.day}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          d.phase === 'baseline'
            ? 'bg-rose-50 text-rose-500 border border-rose-200'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {d.phase === 'baseline' ? 'Baseline' : 'Post-Rx'}
        </span>
      </div>
      <div className="space-y-1.5 font-mono">
        <Row icon={<Heart className="w-3 h-3" />} color="#f43f5e" label="HR" value={`${d.heart_rate} bpm`} />
        <Row icon={<Wind className="w-3 h-3" />} color="#4cc9f0" label="SpO2" value={`${d.spo2}%`} />
        <Row icon={<Moon className="w-3 h-3" />} color="#a78bfa" label="Sleep" value={`${d.sleep_hours} hrs`} />
        <Row icon={<Footprints className="w-3 h-3" />} color="#f59e0b" label="Steps" value={d.steps.toLocaleString()} />
      </div>
    </div>
  );
}

function Row({ icon, color, label, value }) {
  return (
    <div className="flex items-center justify-between" style={{ color }}>
      <span className="flex items-center gap-1.5">{icon} {label}</span>
      <span className="font-bold text-[var(--text-dark)]">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Exported Telemetry Chart
   ───────────────────────────────────────────── */
export default function TelemetryChart({ timelineData, compact = false }) {
  if (!timelineData?.length) {
    return (
      <div className="content-card text-center text-sm text-[var(--text-muted)] py-12">
        No telemetry data loaded.
      </div>
    );
  }

  // Find phase transition day
  const transitionDay = useMemo(() => {
    const idx = timelineData.findIndex((item, i) =>
      i > 0 && timelineData[i - 1].phase === 'baseline' && item.phase === 'post_intervention'
    );
    return idx !== -1 ? timelineData[idx].day : null;
  }, [timelineData]);

  // Compute averages
  const avgHR = (timelineData.reduce((s, d) => s + d.heart_rate, 0) / timelineData.length).toFixed(1);
  const avgSleep = (timelineData.reduce((s, d) => s + d.sleep_hours, 0) / timelineData.length).toFixed(1);
  const avgSpo2 = (timelineData.reduce((s, d) => s + d.spo2, 0) / timelineData.length).toFixed(1);

  const chartHeight = compact ? 200 : 260;

  return (
    <div className="flex gap-5">
      {/* ── Heart Rate Chart Card ── */}
      <div className="content-card flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block leading-none">Heart Rate</span>
              <span className="text-xl font-extrabold text-[var(--text-heading)]">{avgHR} <span className="text-xs font-medium text-[var(--text-muted)]">bpm (avg)</span></span>
            </div>
          </div>
          <PhaseLegend />
        </div>

        <div style={{ height: chartHeight }} className="mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timelineData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `D${v}`} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={<ChartTooltip />} />
              {transitionDay && (
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

      {/* ── Sleep + SpO2 Chart Card ── */}
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
            <ComposedChart data={timelineData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `D${v}`} />
              <YAxis yAxisId="sleep" stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 12]} />
              <YAxis yAxisId="spo2" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} domain={[94, 100]} hide />
              <Tooltip content={<ChartTooltip />} />
              {transitionDay && (
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
