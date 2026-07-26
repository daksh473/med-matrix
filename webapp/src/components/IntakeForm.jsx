import React, { useState } from 'react';
import {
  User, Dna, Activity, Sparkles, Upload, FileText, ChevronRight, Heart, ShieldAlert
} from 'lucide-react';
import TelemetryChart from './TelemetryChart';

const PRESET_PATIENTS = [
  {
    id: 'patient_a',
    name: 'Marcus Vance',
    age: 54,
    sex: 'Male',
    weight: '82 kg (180.7 lbs)',
    condition: 'Refractory Stage 2 Hypertension, exertional dyspnea, and nocturnal awakening',
    medications: 'Metoprolol Succinate 50mg PO QD, Hydrochlorothiazide 25mg PO QD',
    geneticVariant: 'CYP2D6 Poor Metabolizer (CYP2D6 *4/*4)',
    lifestyle: 'Desk-bound software executive, high occupational stress, 2-3 alcohol units/week, non-smoker.',
    tag: 'Recommended Demo',
    tagColor: 'bg-[var(--indigo)]',
  },
  {
    id: 'patient_b',
    name: 'Elena Rostova',
    age: 62,
    sex: 'Female',
    weight: '68 kg (149.9 lbs)',
    condition: 'Post-PCI Coronary Artery Disease with residual angina & sinus tachycardia',
    medications: 'Clopidogrel 75mg PO QD, Atorvastatin 40mg PO QD',
    geneticVariant: 'CYP2C19 Rapid Metabolizer (CYP2C19 *17/*17)',
    lifestyle: 'Retired educator, moderate walking (5k steps), low sodium Mediterranean diet, non-smoker.',
    tag: 'Antiplatelet Focus',
    tagColor: 'bg-[var(--sky)]',
  },
  {
    id: 'patient_c',
    name: 'Dr. Arthur Pendelton',
    age: 71,
    sex: 'Male',
    weight: '89 kg (196.2 lbs)',
    condition: 'Non-valvular Atrial Fibrillation with mild chronic kidney disease (eGFR 48)',
    medications: 'Warfarin 5mg PO QD (unstable INR), Diltiazem ER 180mg PO QD',
    geneticVariant: 'CYP2C9 Slow Metabolizer (CYP2C9 *3/*3)',
    lifestyle: 'Sedentary, sleep apnea history, low physical activity.',
    tag: 'Narrow TI Warning',
    tagColor: 'bg-[var(--purple)]',
  }
];

export default function IntakeForm({ onSubmit, timelineData, onTimelineUpload }) {
  const [formData, setFormData] = useState(PRESET_PATIENTS[0]);
  const [uploadError, setUploadError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyPreset = (preset) => {
    setFormData(preset);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json) && json.length > 0 && json[0].day !== undefined) {
          onTimelineUpload(json);
          setUploadError(null);
        } else {
          setUploadError("Must be a JSON array of daily timeline records.");
        }
      } catch { setUploadError("Invalid JSON file."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--indigo)] to-[var(--sky)] flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-heading)]">Patient Intake Dossier</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] ml-10">
          Select a preset profile or enter custom patient data to initiate the 5-agent precision pipeline.
        </p>
      </div>

      {/* Preset Quick-Fill Cards */}
      <div className="grid grid-cols-3 gap-4">
        {PRESET_PATIENTS.map(preset => {
          const isSelected = formData.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`content-card cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-[var(--indigo)] ring-offset-2 shadow-md'
                  : 'hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[var(--text-heading)]">{preset.name}</span>
                <span className="text-[11px] text-[var(--text-muted)]">{preset.age}y / {preset.sex}</span>
              </div>
              <div className="text-[11px] text-[var(--indigo)] font-mono font-semibold mb-1 truncate">
                {preset.geneticVariant.split('(')[0].trim()}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {preset.condition}
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--border-light)] flex items-center justify-between">
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${preset.tagColor}`}>
                  {preset.tag}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-[var(--indigo)]">✓ Selected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Form & Chart Split */}
      <div className="flex gap-6">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="content-card flex-1 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
            <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--indigo)]" /> Clinical Details
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Step 1 of 3</span>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Age & Sex</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" name="age" value={formData.age} onChange={handleChange} required className="input-field" />
                <select name="sex" value={formData.sex} onChange={handleChange} className="input-field">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Body Weight</label>
              <input type="text" name="weight" value={formData.weight} onChange={handleChange} required className="input-field" />
            </div>
          </div>

          {/* Genetic Variant */}
          <div>
            <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
              <Dna className="w-3 h-3 text-[var(--purple)]" /> Pharmacogenomic Variant
            </label>
            <select name="geneticVariant" value={formData.geneticVariant} onChange={handleChange} className="input-field font-mono text-[var(--indigo)]">
              <option value="CYP2D6 Poor Metabolizer (CYP2D6 *4/*4)">CYP2D6 Poor Metabolizer (*4/*4)</option>
              <option value="CYP2C19 Rapid Metabolizer (CYP2C19 *17/*17)">CYP2C19 Rapid Metabolizer (*17/*17)</option>
              <option value="CYP2C9 Slow Metabolizer (CYP2C9 *3/*3)">CYP2C9 Slow Metabolizer (*3/*3)</option>
              <option value="CYP2D6 Ultrarapid Metabolizer (CYP2D6 *1xN)">CYP2D6 Ultrarapid Metabolizer (*1xN)</option>
              <option value="Normal Metabolizer (Wildtype / Extensive)">Normal Metabolizer (Wildtype)</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Symptoms & Primary Diagnosis</label>
            <textarea name="condition" rows={2} value={formData.condition} onChange={handleChange} required className="input-field" />
          </div>

          {/* Medications */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Current Medications</label>
            <input type="text" name="medications" value={formData.medications} onChange={handleChange} required className="input-field font-mono text-xs" />
          </div>

          {/* Lifestyle */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Lifestyle & Exposome</label>
            <input type="text" name="lifestyle" value={formData.lifestyle} onChange={handleChange} className="input-field" />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border-light)]">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] hover:border-[var(--border-medium)] text-xs text-[var(--text-muted)] cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[var(--indigo)]" />
              <span>Upload Custom JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--navy)] hover:bg-[#252a4a] text-white font-bold text-sm shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Execute 5-Agent Pipeline</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </form>

        {/* Chart Preview Column */}
        <div className="w-[360px] flex-shrink-0 space-y-4">
          {/* Compact single-chart preview */}
          <div className="content-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block leading-none">60-Day Telemetry Preview</span>
                <span className="text-sm font-bold text-[var(--text-heading)]">
                  {timelineData ? `${timelineData.length} Days Loaded` : 'No Data'}
                </span>
              </div>
            </div>
            {timelineData && (
              <div className="h-[160px]">
                <TelemetryChartMini data={timelineData} />
              </div>
            )}
          </div>

          <div className="content-card text-xs text-[var(--text-secondary)] space-y-2">
            <h4 className="font-bold text-[var(--text-heading)] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[var(--indigo)]" /> Data Foundation
            </h4>
            <ul className="space-y-1 list-disc list-inside text-[11px]">
              <li><span className="font-semibold text-rose-500">Heart Rate</span>: Fitbit Fitness Tracker (31-day continuous)</li>
              <li><span className="font-semibold text-[var(--sky)]">SpO₂</span>: PhysioNet BIDMC (25k readings)</li>
              <li><span className="font-semibold text-[var(--purple)]">Sleep</span>: Fitbit sleep analysis (7.47h avg)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mini Chart for Preview ── */
import {
  ResponsiveContainer as RC, AreaChart, Area as A2, XAxis as X2, ReferenceLine as RL2
} from 'recharts';

function TelemetryChartMini({ data }) {
  const transIdx = data.findIndex((d, i) => i > 0 && data[i-1].phase === 'baseline' && d.phase === 'post_intervention');
  const tDay = transIdx !== -1 ? data[transIdx].day : null;

  return (
    <RC width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="miniHrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <X2 dataKey="day" stroke="#cbd5e1" fontSize={9} tickLine={false} tickFormatter={v => `D${v}`} />
        {tDay && <RL2 x={tDay} stroke="#4361ee" strokeDasharray="4 3" strokeWidth={1.5} />}
        <A2 type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={1.5} fill="url(#miniHrGrad)" dot={false} />
      </AreaChart>
    </RC>
  );
}
