import React, { useState } from 'react';
import {
  User, Dna, Activity, Sparkles, Upload, FileText, ChevronRight, Heart, ShieldAlert,
  CheckCircle2, Circle, ArrowRightLeft, X, Pill, Weight, Scale
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

  // Patient Comparison State
  const [showComparison, setShowComparison] = useState(false);
  const [compareIdA, setCompareIdA] = useState('patient_a');
  const [compareIdB, setCompareIdB] = useState('patient_b');

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

  const patA = PRESET_PATIENTS.find(p => p.id === compareIdA) || PRESET_PATIENTS[0];
  const patB = PRESET_PATIENTS.find(p => p.id === compareIdB) || PRESET_PATIENTS[1];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
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

        {/* Compare Profiles Button */}
        <button
          onClick={() => setShowComparison(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[var(--indigo)] text-xs font-semibold hover:bg-blue-100 transition-colors shadow-sm"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Compare Patient Profiles</span>
        </button>
      </div>

      {/* Preset Quick-Fill Cards with Explicit Radio Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {PRESET_PATIENTS.map(preset => {
          const isSelected = formData.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`content-card cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-2 border-[var(--indigo)] bg-blue-50/20 shadow-md ring-2 ring-blue-100'
                  : 'hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Explicit Radio Button */}
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[var(--indigo)] bg-[var(--indigo)] text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="font-bold text-sm text-[var(--text-heading)]">{preset.name}</span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">{preset.age}y / {preset.sex}</span>
              </div>
              <div className="text-[11px] text-[var(--indigo)] font-mono font-semibold mb-1 truncate ml-6">
                {preset.geneticVariant.split('(')[0].trim()}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed ml-6">
                {preset.condition}
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--border-light)] flex items-center justify-between ml-6">
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${preset.tagColor}`}>
                  {preset.tag}
                </span>
                {isSelected ? (
                  <span className="text-[10px] font-bold text-[var(--indigo)] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Profile
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] hover:text-[var(--indigo)]">Select</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Form & Chart Split */}
      <div className="flex gap-6">
        {/* Form Column organized into 4 Clear Sections */}
        <form onSubmit={handleSubmit} className="content-card flex-1 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
            <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--indigo)]" /> Clinical Intake Details
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Step 1 of 3</span>
          </div>

          {/* Section 1: General Info */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
              <span className="w-5 h-5 rounded-full bg-[var(--indigo)] text-white text-[10px] font-bold flex items-center justify-center">1</span>
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">General Information</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">Age & Sex</label>
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
                <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">Body Weight</label>
                <input type="text" name="weight" value={formData.weight} onChange={handleChange} required className="input-field" />
              </div>
            </div>
          </div>

          {/* Section 2: Pharmacogenomics */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
              <span className="w-5 h-5 rounded-full bg-[var(--purple)] text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-[var(--purple)]" /> Pharmacogenomics (Genotype)
              </h4>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">CYP Enzyme Variant</label>
              <select name="geneticVariant" value={formData.geneticVariant} onChange={handleChange} className="input-field font-mono text-[var(--indigo)] font-semibold">
                <option value="CYP2D6 Poor Metabolizer (CYP2D6 *4/*4)">CYP2D6 Poor Metabolizer (*4/*4) — CYP2D6_poor_metabolizer</option>
                <option value="CYP2C19 Rapid Metabolizer (CYP2C19 *17/*17)">CYP2C19 Rapid Metabolizer (*17/*17) — CYP2C19_rapid_metabolizer</option>
                <option value="HLA-B*57:01 Positive (Abacavir Risk)">HLA-B*57:01 Positive — HLA-B_5701_positive</option>
                <option value="CYP2C9 Slow Metabolizer (CYP2C9 *3/*3)">CYP2C9 Slow Metabolizer (*3/*3) — CYP2C9_slow_metabolizer</option>
                <option value="CYP2D6 Ultrarapid Metabolizer (CYP2D6 *1xN)">CYP2D6 Ultrarapid Metabolizer (*1xN) — CYP2D6_ultrarapid_metabolizer</option>
                <option value="TPMT Poor Metabolizer (Azathioprine Risk)">TPMT Poor Metabolizer — TPMT_poor_metabolizer</option>
                <option value="SLCO1B1 Decreased Function (Statin Risk)">SLCO1B1 Decreased Function — SLCO1B1_decreased_function</option>
                <option value="Unmapped Marker (No CPIC Match Fallback)">Unmapped Marker (Fallback Test Case)</option>
                <option value="Normal Metabolizer (Wildtype / Extensive)">Normal Metabolizer (Wildtype)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Diagnosis & Meds */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">3</span>
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">Diagnosis & Active Medications</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">Primary Symptoms & Diagnosis</label>
                <textarea name="condition" rows={2} value={formData.condition} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">Current Prescription Medications</label>
                <input type="text" name="medications" value={formData.medications} onChange={handleChange} required className="input-field font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* Section 4: Lifestyle */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card-alt)] border border-[var(--border-light)] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">4</span>
              <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">Lifestyle & Exposome</h4>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-heading)] mb-1">Activity, Occupation & Diet Notes</label>
              <input type="text" name="lifestyle" value={formData.lifestyle} onChange={handleChange} className="input-field" />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border-light)]">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs text-[var(--text-secondary)] cursor-pointer transition-colors border border-gray-200">
              <Upload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
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
              <Activity className="w-3.5 h-3.5 text-[var(--indigo)]" /> Multi-Dataset Grounding
            </h4>
            <ul className="space-y-1 list-disc list-inside text-[11px]">
              <li><span className="font-semibold text-rose-500">Fitbit</span>: 35 subjects (HR, steps, sleep)</li>
              <li><span className="font-semibold text-[var(--sky)]">PPG-DaLiA</span>: 15 subjects (PPG ground truth)</li>
              <li><span className="font-semibold text-[var(--purple)]">WESAD</span>: 15 subjects (ECG stress & HRV RMSSD)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Patient Comparison Modal */}
      {showComparison && (
        <PatientComparisonModal
          patA={patA}
          patB={patB}
          compareIdA={compareIdA}
          compareIdB={compareIdB}
          setCompareIdA={setCompareIdA}
          setCompareIdB={setCompareIdB}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}

/* ── Patient Comparison Modal (Requirement 2) ── */
function PatientComparisonModal({ patA, patB, compareIdA, compareIdB, setCompareIdA, setCompareIdB, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--navy)]/40 backdrop-blur-sm">
      <div className="bg-white border border-[var(--border-light)] rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between bg-[var(--bg-card-alt)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-[var(--indigo)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-heading)] text-base">Side-by-Side Patient Profile Comparison</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Compare genetics, clinical presentation, and medications across presets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--bg-input)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparators Selector Bar */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-[var(--border-light)] grid grid-cols-2 gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--indigo)] uppercase">Patient 1:</span>
            <select value={compareIdA} onChange={(e) => setCompareIdA(e.target.value)} className="input-field text-xs font-bold">
              {PRESET_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.age}y {p.sex})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-600 uppercase">Patient 2:</span>
            <select value={compareIdB} onChange={(e) => setCompareIdB(e.target.value)} className="input-field text-xs font-bold">
              {PRESET_PATIENTS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.age}y {p.sex})</option>)}
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Column A */}
            <div className="content-card border-2 border-[var(--indigo)]/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
                <span className="font-extrabold text-base text-[var(--text-heading)]">{patA.name}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--indigo)] text-white text-[10px] font-bold">{patA.tag}</span>
              </div>
              <Row label="Demographics" val={`${patA.age}y • ${patA.sex} • ${patA.weight}`} />
              <Row label="Pharmacogenomics" val={patA.geneticVariant} color="text-[var(--indigo)] font-bold" />
              <Row label="Symptoms & Diagnosis" val={patA.condition} />
              <Row label="Current Medications" val={patA.medications} fontMono />
              <Row label="Exposome & Lifestyle" val={patA.lifestyle} />
            </div>

            {/* Column B */}
            <div className="content-card border-2 border-purple-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
                <span className="font-extrabold text-base text-[var(--text-heading)]">{patB.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold ${patB.tagColor}`}>{patB.tag}</span>
              </div>
              <Row label="Demographics" val={`${patB.age}y • ${patB.sex} • ${patB.weight}`} />
              <Row label="Pharmacogenomics" val={patB.geneticVariant} color="text-purple-600 font-bold" />
              <Row label="Symptoms & Diagnosis" val={patB.condition} />
              <Row label="Current Medications" val={patB.medications} fontMono />
              <Row label="Exposome & Lifestyle" val={patB.lifestyle} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-light)] bg-[var(--bg-card-alt)] flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-full bg-[var(--navy)] hover:bg-[#252a4a] text-white text-xs font-bold transition-colors">
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, val, color = 'text-[var(--text-secondary)]', fontMono = false }) {
  return (
    <div>
      <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block mb-0.5">{label}</span>
      <p className={`text-xs leading-relaxed ${color} ${fontMono ? 'font-mono' : ''}`}>{val}</p>
    </div>
  );
}

import { ResponsiveContainer as RC, AreaChart, Area as A2, XAxis as X2, ReferenceLine as RL2 } from 'recharts';

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
