import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area
} from 'recharts';
import { Activity, Heart, Moon, Zap, Layers } from 'lucide-react';

export default function TelemetryChart({ timelineData }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 glass-card rounded-2xl">
        No telemetry timeline data available.
      </div>
    );
  }

  // Find the exact day where phase transitions from baseline to post_intervention
  const transitionIndex = timelineData.findIndex((item, idx) => {
    if (idx === 0) return false;
    return timelineData[idx - 1].phase === 'baseline' && item.phase === 'post_intervention';
  });

  const transitionDay = transitionIndex !== -1 ? timelineData[transitionIndex].day : null;
  const transitionDate = transitionIndex !== -1 ? timelineData[transitionIndex].date : null;

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs text-slate-200 min-w-[200px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-300">Day {data.day} ({data.date})</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold ${
              data.phase === 'baseline'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {data.phase}
            </span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Heart Rate:</span>
              <span className="font-bold">{data.heart_rate} bpm</span>
            </div>
            <div className="flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> SpO2:</span>
              <span className="font-bold">{data.spo2}%</span>
            </div>
            <div className="flex items-center justify-between text-indigo-400">
              <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Sleep:</span>
              <span className="font-bold">{data.sleep_hours} hrs</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Steps:</span>
              <span className="font-bold">{data.steps.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">60-Day Telemetry Vector</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounded continuous signals from Fitbit & BIDMC dataset with phase demarcation
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'hr', label: 'Heart Rate', icon: Heart },
            { id: 'spo2', label: 'SpO2', icon: Activity },
            { id: 'sleep', label: 'Sleep & Steps', icon: Moon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phase Legend Indicator */}
      <div className="flex items-center justify-between px-2 pt-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60 inline-block"></span>
            <span>Baseline Phase (Days 1 to {transitionDay ? transitionDay - 1 : 30})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block"></span>
            <span>Post-Intervention (Days {transitionDay || 30} to 60)</span>
          </div>
        </div>

        {transitionDay && (
          <div className="hidden md:flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
            <span className="font-bold">Intervention Boundary: Day {transitionDay}</span>
            <span className="text-slate-400">({transitionDate})</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => `D${val}`}
            />
            
            {/* Primary Y Axis for HR & SpO2 */}
            <YAxis
              yAxisId="primary"
              stroke="#64748b"
              fontSize={10}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickLine={false}
            />

            {/* Secondary Y Axis for Sleep */}
            <YAxis
              yAxisId="secondary"
              orientation="right"
              stroke="#64748b"
              fontSize={10}
              domain={[0, 12]}
              tickLine={false}
              hide={activeTab !== 'overview' && activeTab !== 'sleep'}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Dynamic Reference Line for Baseline/Post-Intervention Divider */}
            {transitionDay && (
              <ReferenceLine
                x={transitionDay}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                yAxisId="primary"
                label={{
                  value: `Intervention (Day ${transitionDay})`,
                  position: 'insideTopLeft',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Heart Rate Area / Line */}
            {(activeTab === 'overview' || activeTab === 'hr') && (
              <>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  yAxisId="primary"
                  type="monotone"
                  dataKey="heart_rate"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#hrGrad)"
                  name="Heart Rate (bpm)"
                />
              </>
            )}

            {/* SpO2 Line */}
            {(activeTab === 'overview' || activeTab === 'spo2') && (
              <Line
                yAxisId="primary"
                type="monotone"
                dataKey="spo2"
                stroke="#00f2fe"
                strokeWidth={2}
                dot={false}
                name="SpO2 (%)"
              />
            )}

            {/* Sleep Hours Bars / Line */}
            {(activeTab === 'overview' || activeTab === 'sleep') && (
              <Bar
                yAxisId="secondary"
                dataKey="sleep_hours"
                fill="#818cf8"
                opacity={0.4}
                radius={[3, 3, 0, 0]}
                barSize={6}
                name="Sleep (hrs)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
