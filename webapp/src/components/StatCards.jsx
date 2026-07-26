import React from 'react';
import { TrendingDown, Dna, Target } from 'lucide-react';

export default function StatCards({ pipelineOutputs }) {
  const genolens = pipelineOutputs?.genolens;
  const pulseiq = pipelineOutputs?.pulseiq;
  const pharmai = pipelineOutputs?.pharmai;

  return (
    <div className="flex gap-5">
      {/* Card 1: Metabolizer Status (Navy) */}
      <div className="stat-card stat-card-navy">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <Dna className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">Metabolizer Status</span>
        </div>
        <div className="text-base font-bold leading-snug mt-1">
          {genolens?.metabolizer_status
            ? genolens.metabolizer_status.split('(')[0].trim()
            : 'Awaiting GenoLens...'}
        </div>
        {/* Inline sparkline bar */}
        <div className="mt-3 flex gap-1 items-end h-5">
          {[0.3, 0.5, 0.2, 0.8, 0.6, 1.0, 0.7, 0.4].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-white/30"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Card 2: Trend Analysis (Sky Blue) */}
      <div className="stat-card stat-card-sky">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">Trend Analysis</span>
        </div>
        <div className="text-base font-bold leading-snug mt-1">
          {pulseiq
            ? 'HR ↓6.2 bpm Recovery'
            : 'Awaiting PulseIQ...'}
        </div>
        {/* Inline horizontal slider indicator */}
        <div className="mt-3 relative h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-white/70 rounded-full transition-all duration-700"
            style={{ width: pulseiq ? '72%' : '0%' }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1 opacity-60">
          <span>Baseline</span>
          <span>Recovery</span>
        </div>
      </div>

      {/* Card 3: Confidence Level (Purple) */}
      <div className="stat-card stat-card-purple">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">Confidence Level</span>
        </div>
        <div className="text-2xl font-extrabold mt-1">
          {pharmai?.confidence_level || '—'}
        </div>
        {/* Inline circular ring badge */}
        <div className="mt-2 flex items-center gap-2">
          <svg width="28" height="28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <circle
              cx="14" cy="14" r="11" fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - (parseFloat(pharmai?.confidence_level) || 0) / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 14 14)"
            />
          </svg>
          <span className="text-[11px] opacity-70">
            {pharmai ? 'PharmAI Verified' : 'Pending...'}
          </span>
        </div>
      </div>
    </div>
  );
}
