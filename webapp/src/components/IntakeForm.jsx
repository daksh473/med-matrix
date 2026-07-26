import React, { useState } from 'react';
import { User, Dna, Activity, Heart, ShieldAlert, Sparkles, Upload, FileText, ChevronRight } from 'lucide-react';
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
    tag: 'Recommended Hackathon Pitch Demo',
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
    tag: 'Antiplatelet Activation Focus',
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
    tag: 'Narrow Therapeutic Index Warning',
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
          setUploadError("Uploaded file must be a JSON array of daily timeline records.");
        }
      } catch (err) {
        setUploadError("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden glass-card border border-cyan-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> N-of-1 Decision Support Platform
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Med Matrix <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
              Precision clinical decision engine chaining 5 specialized AI agents across genomics, continuous telemetry, multi-layer information fusion, and pharmacogenomic dosing.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <div className="font-bold text-white">60-Day Telemetry Loaded</div>
              <div className="text-[10px] text-slate-400">Fitbit & BIDMC Real Data Grounded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick Fill Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" /> Quick-Fill Demo Patient Profiles
          </h2>
          <span className="text-[11px] text-slate-400">Select a preset profile for a 1-click pitch demo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_PATIENTS.map(preset => {
            const isSelected = formData.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-4 rounded-2xl cursor-pointer transition-all glass-card-hover border ${
                  isSelected
                    ? 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-cyan-400/80 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">{preset.name}</span>
                  <span className="text-xs text-slate-400">{preset.age}y / {preset.sex}</span>
                </div>
                <div className="text-xs text-cyan-400 font-mono font-medium mb-1 line-clamp-1">
                  {preset.geneticVariant}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.condition}
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                  <span className="text-amber-400 font-semibold">{preset.tag}</span>
                  {isSelected && <span className="text-emerald-400 font-bold">Selected</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Intake Form & Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Patient Intake Dossier
              </h3>
              <span className="text-xs font-mono text-slate-400">Step 1 of 3</span>
            </div>

            {/* Demographics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Age & Sex</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Body Weight</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Pharmacogenomic Variant Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400"><Dna className="w-3.5 h-3.5" /> Mock Pharmacogenomic Variant</span>
                <span className="text-[10px] text-slate-500 font-mono">CPIC / FDA Marker</span>
              </label>
              <select
                name="geneticVariant"
                value={formData.geneticVariant}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
              >
                <option value="CYP2D6 Poor Metabolizer (CYP2D6 *4/*4)">CYP2D6 Poor Metabolizer (CYP2D6 *4/*4) - Impaired beta-blocker/opioid clearance</option>
                <option value="CYP2C19 Rapid Metabolizer (CYP2C19 *17/*17)">CYP2C19 Rapid Metabolizer (CYP2C19 *17/*17) - Accelerated clopidogrel activation</option>
                <option value="CYP2C9 Slow Metabolizer (CYP2C9 *3/*3)">CYP2C9 Slow Metabolizer (CYP2C9 *3/*3) - Warfarin hypersensitivity risk</option>
                <option value="CYP2D6 Ultrarapid Metabolizer (CYP2D6 *1xN)">CYP2D6 Ultrarapid Metabolizer (CYP2D6 *1xN) - Rapid drug clearance</option>
                <option value="Normal Metabolizer (Wildtype / Extensive)">Normal Metabolizer (Extensive / Wildtype Standard)</option>
              </select>
            </div>

            {/* Current Condition & Symptoms */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Symptoms & Primary Diagnosis</label>
              <textarea
                name="condition"
                rows={2}
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
              ></textarea>
            </div>

            {/* Current Medications */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Medications & Dosing Schedule</label>
              <input
                type="text"
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Lifestyle & Exposome */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Exposome & Lifestyle Notes</label>
              <input
                type="text"
                name="lifestyle"
                value={formData.lifestyle}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              {/* Optional Custom File Upload */}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Custom JSON</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Execute 5-Agent AI Pipeline</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Telemetry Chart Column */}
        <div className="lg:col-span-5 space-y-6">
          <TelemetryChart timelineData={timelineData} />

          <div className="glass-card rounded-2xl p-5 border border-slate-800 text-xs space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" /> 60-Day Telemetry Foundation
            </h4>
            <p className="text-slate-400 leading-relaxed">
              This patient's timeline integrates 60 continuous days of wearable metrics derived from real Fitbit & BIDMC PhysioNet datasets:
            </p>
            <ul className="space-y-1.5 text-slate-300 font-mono text-[11px] list-disc list-inside">
              <li><strong className="text-rose-400">Baseline Phase (Days 1-30)</strong>: Mean HR ~84.6 bpm, Sleep ~6.1 hrs</li>
              <li><strong className="text-emerald-400">Post-Intervention (Days 31-60)</strong>: Mean HR ~78.4 bpm, Sleep ~7.2 hrs</li>
              <li><strong className="text-cyan-400">SpO2 Grounding</strong>: BIDMC oximetry baseline ~96.7%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
