import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------------
// Load Datasets: Subject Pool, Timeline, and CPIC Reference File
// -------------------------------------------------------------------
const poolPath = path.join(__dirname, 'public', 'subject_pool.json');
const timelinePath = path.join(__dirname, 'public', 'patient_timeline.json');

// CPIC Reference Path: Primary at pharm_ai/data/cpic_reference.json
const cpicPharmPath = path.join(__dirname, '..', 'pharm_ai', 'data', 'cpic_reference.json');
const cpicSrcPath = path.join(__dirname, 'src', 'data', 'cpic_reference.json');

let subjectPool = [];
let cpicReferenceData = {};

try {
  if (fs.existsSync(poolPath)) subjectPool = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
} catch (err) {
  console.warn('Could not load subject_pool.json', err.message);
}

try {
  if (fs.existsSync(cpicPharmPath)) {
    cpicReferenceData = JSON.parse(fs.readFileSync(cpicPharmPath, 'utf8'));
  } else if (fs.existsSync(cpicSrcPath)) {
    cpicReferenceData = JSON.parse(fs.readFileSync(cpicSrcPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not load cpic_reference.json', err.message);
}

// -------------------------------------------------------------------
// STEP 2 — CPIC Guidance Lookup Function
// -------------------------------------------------------------------
function lookupCPICGuidance(metabolizerInput) {
  let inputs = [];
  if (Array.isArray(metabolizerInput)) {
    inputs = metabolizerInput;
  } else if (typeof metabolizerInput === 'string') {
    inputs = [metabolizerInput];
  }

  const matches = [];
  const matchedKeys = new Set();

  for (const rawInput of inputs) {
    if (!rawInput) continue;
    const str = String(rawInput).trim();
    const strLower = str.toLowerCase();

    // 1. Exact key match
    if (cpicReferenceData[str] && !matchedKeys.has(str)) {
      matchedKeys.add(str);
      matches.push({ key: str, ...cpicReferenceData[str] });
      continue;
    }

    // 2. Case-insensitive key match
    for (const key of Object.keys(cpicReferenceData)) {
      if (key.toLowerCase() === strLower && !matchedKeys.has(key)) {
        matchedKeys.add(key);
        matches.push({ key, ...cpicReferenceData[key] });
      }
    }

    // 3. Robust substring / phenotype lookup fallback
    if (matches.length === 0) {
      if (strLower.includes('cyp2d6') && strLower.includes('poor')) {
        matchedKeys.add('CYP2D6_poor_metabolizer');
        matches.push({ key: 'CYP2D6_poor_metabolizer', ...cpicReferenceData['CYP2D6_poor_metabolizer'] });
      } else if (strLower.includes('cyp2c19') && strLower.includes('rapid')) {
        matchedKeys.add('CYP2C19_rapid_metabolizer');
        matches.push({ key: 'CYP2C19_rapid_metabolizer', ...cpicReferenceData['CYP2C19_rapid_metabolizer'] });
      } else if (strLower.includes('cyp2c19') && strLower.includes('poor')) {
        matchedKeys.add('CYP2C19_poor_metabolizer');
        matches.push({ key: 'CYP2C19_poor_metabolizer', ...cpicReferenceData['CYP2C19_poor_metabolizer'] });
      } else if (strLower.includes('cyp2c9') && strLower.includes('slow')) {
        matchedKeys.add('CYP2C9_slow_metabolizer');
        matches.push({ key: 'CYP2C9_slow_metabolizer', ...cpicReferenceData['CYP2C9_slow_metabolizer'] });
      } else if (strLower.includes('cyp2d6') && strLower.includes('ultrarapid')) {
        matchedKeys.add('CYP2D6_ultrarapid_metabolizer');
        matches.push({ key: 'CYP2D6_ultrarapid_metabolizer', ...cpicReferenceData['CYP2D6_ultrarapid_metabolizer'] });
      } else if (strLower.includes('tpmt') && strLower.includes('poor')) {
        matchedKeys.add('TPMT_poor_metabolizer');
        matches.push({ key: 'TPMT_poor_metabolizer', ...cpicReferenceData['TPMT_poor_metabolizer'] });
      } else if (strLower.includes('slco1b1') || strLower.includes('decreased')) {
        matchedKeys.add('SLCO1B1_decreased_function');
        matches.push({ key: 'SLCO1B1_decreased_function', ...cpicReferenceData['SLCO1B1_decreased_function'] });
      } else if (strLower.includes('hla-b') || strLower.includes('5701')) {
        matchedKeys.add('HLA-B_5701_positive');
        matches.push({ key: 'HLA-B_5701_positive', ...cpicReferenceData['HLA-B_5701_positive'] });
      }
    }
  }

  const validMatches = matches.filter(m => m && m.source);

  if (validMatches.length > 0) {
    return {
      has_match: true,
      matches: validMatches,
      primary_source: validMatches[0].source,
      guidance_text: validMatches.map(m => `[Source: ${m.source}]: ${m.guidance}`).join(' | ')
    };
  }

  // STEP 2 Fallback: If no match found for a given status
  return {
    has_match: false,
    matches: [],
    fallback_message: "no CPIC reference available for this marker — reasoning will proceed without grounding for this specific marker"
  };
}

app.get('/api/timeline', (req, res) => {
  try {
    if (fs.existsSync(timelinePath)) {
      const data = fs.readFileSync(timelinePath, 'utf8');
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: 'patient_timeline.json not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read timeline file', details: err.message });
  }
});

app.get('/api/subject-pool', (req, res) => res.json(subjectPool));
app.get('/api/cpic-reference', (req, res) => res.json(cpicReferenceData));

// -------------------------------------------------------------------
// Deterministic Hash & Subject Assignment
// -------------------------------------------------------------------
function assignSubject(patientInfo) {
  if (!subjectPool || subjectPool.length === 0) {
    return {
      source: 'fitbit',
      subject_id: 'fitbit_6962181067',
      display_name: 'Fitbit User #1067',
      heart_rate_mean: 77.55,
      steps_mean: 9795.0,
      sleep_hours_mean: 7.47,
      spo2_mean: 96.8,
    };
  }

  const str = ((patientInfo?.name || '') + (patientInfo?.geneticVariant || '') + (patientInfo?.age || '')).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  const index = Math.abs(hash) % subjectPool.length;
  return subjectPool[index];
}

// Generate 60-day synthetic telemetry timeline from a subject seed
function generatePatientTimeline(assignedSubject, patientInfo) {
  const seed = assignedSubject;
  const days = 60;
  const startDate = new Date(2025, 0, 15);
  const timeline = [];

  const hrMean = seed.heart_rate_mean || 76.0;
  const hrStd = (seed.heart_rate_std || 10.0) * 0.25;
  const stepsMean = seed.steps_mean || 9800;
  const stepsStd = (seed.steps_std || 1500) * 0.3;
  const sleepMean = seed.sleep_hours_mean || 7.4;
  const spo2Mean = seed.spo2_mean || 96.8;

  const isSevere = (patientInfo?.condition || '').toLowerCase().includes('stage 2') || (patientInfo?.condition || '').toLowerCase().includes('refractory');
  
  let baselineHR = 0;
  if (seed.source === 'wesad' && seed.hr_stress_delta !== undefined) {
    const stressAddon = isSevere ? seed.hr_stress_delta * 1.25 : seed.hr_stress_delta;
    baselineHR = seed.baseline_hr_mean + stressAddon;
  } else {
    const hrElevationFactor = isSevere ? 1.12 : 1.08;
    baselineHR = hrMean * hrElevationFactor;
  }
  const targetHR = hrMean;

  const seedNum = (assignedSubject.subject_id.length * 17) + (patientInfo?.name?.length || 5);
  const pseudoRand = (day, salt) => {
    const x = Math.sin(day * 999 + salt * 13 + seedNum) * 10000;
    return x - Math.floor(x);
  };

  for (let day = 1; day <= days; day++) {
    const currentDate = new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];
    const isPost = day > 30;
    const phase = isPost ? 'post_intervention' : 'baseline';

    let dayHR = 0;
    let daySleep = 0;

    if (!isPost) {
      const noise = (pseudoRand(day, 1) - 0.5) * 2 * hrStd;
      dayHR = +(baselineHR + noise).toFixed(1);
      daySleep = +(Math.max(4.5, sleepMean - 1.2 + (pseudoRand(day, 2) - 0.5) * 1.0)).toFixed(1);
    } else {
      const t = day - 30;
      const decay = Math.exp(-t / 6.0);
      const currentMeanHR = targetHR + (baselineHR - targetHR) * decay;
      const noise = (pseudoRand(day, 1) - 0.5) * 2 * hrStd;
      dayHR = +(currentMeanHR + noise).toFixed(1);
      const currentMeanSleep = sleepMean - 1.2 * decay;
      daySleep = +(Math.min(9.0, currentMeanSleep + (pseudoRand(day, 2) - 0.5) * 0.8)).toFixed(1);
    }

    const daySteps = Math.max(2000, Math.round(stepsMean + (pseudoRand(day, 3) - 0.5) * 2 * stepsStd));
    const daySpo2 = +(spo2Mean + (pseudoRand(day, 4) - 0.5) * 0.6).toFixed(1);

    timeline.push({ day, date: dateStr, phase, heart_rate: dayHR, spo2: daySpo2, steps: daySteps, sleep_hours: daySleep });
  }

  return timeline;
}

app.post('/api/generate-timeline', (req, res) => {
  const { patientInfo } = req.body;
  const assignedSubject = assignSubject(patientInfo);
  const timeline = generatePatientTimeline(assignedSubject, patientInfo);
  return res.json({ success: true, assignedSubject, timeline });
});

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

// -------------------------------------------------------------------
// Deterministic Fallback Output Generator (Standardized to CPIC Keys)
// -------------------------------------------------------------------
function deriveStandardizedKey(geneticVariant) {
  const vLower = (geneticVariant || '').toLowerCase();
  if (vLower.includes('cyp2d6') && vLower.includes('poor')) return 'CYP2D6_poor_metabolizer';
  if (vLower.includes('cyp2c19') && vLower.includes('rapid')) return 'CYP2C19_rapid_metabolizer';
  if (vLower.includes('hla-b') || vLower.includes('5701')) return 'HLA-B_5701_positive';
  if (vLower.includes('cyp2c9') && vLower.includes('slow')) return 'CYP2C9_slow_metabolizer';
  if (vLower.includes('cyp2d6') && vLower.includes('ultrarapid')) return 'CYP2D6_ultrarapid_metabolizer';
  if (vLower.includes('tpmt') && vLower.includes('poor')) return 'TPMT_poor_metabolizer';
  if (vLower.includes('slco1b1') || vLower.includes('decreased')) return 'SLCO1B1_decreased_function';
  if (vLower.includes('unmapped') || vLower.includes('unknown')) return 'UNMAPPED_MARKER_FALLBACK';
  return 'CYP2D6_normal_metabolizer';
}

function generateMockOutput(agentId, patientInfo, timelineData, previousOutputs, assignedSubject) {
  const name = patientInfo?.name || 'Unknown Patient';
  const age = patientInfo?.age || '?';
  const sex = patientInfo?.sex || '?';
  const weight = patientInfo?.weight || '?';
  const condition = patientInfo?.condition || 'No condition specified';
  const medications = patientInfo?.medications || 'None reported';
  const genVariant = patientInfo?.geneticVariant || 'CYP2D6_poor_metabolizer';
  
  // STEP 1: Standardized Enum Key for GenoLens
  const stdKey = deriveStandardizedKey(genVariant);
  const cpicResult = lookupCPICGuidance(previousOutputs?.genolens?.metabolizer_status || stdKey);
  const subjectLabel = assignedSubject ? assignedSubject.display_name : 'Fitbit User #1067';

  if (agentId === 'genolens') {
    let risks = [];
    if (stdKey === 'CYP2D6_poor_metabolizer') {
      risks = ["Metoprolol: 500% AUC accumulation risk.", "Codeine/Tramadol: lack of active metabolite conversion."];
    } else if (stdKey === 'CYP2C19_rapid_metabolizer') {
      risks = ["Clopidogrel: ultra-rapid prodrug conversion causing excessive bleeding risk."];
    } else if (stdKey === 'HLA-B_5701_positive') {
      risks = ["Abacavir: severe life-threatening immunologically-mediated hypersensitivity reaction."];
    } else if (stdKey === 'TPMT_poor_metabolizer') {
      risks = ["Azathioprine: severe bone marrow toxicity risk."];
    } else if (stdKey === 'SLCO1B1_decreased_function') {
      risks = ["Simvastatin: 4-5x elevated risk of severe myopathy and rhabdomyolysis."];
    } else {
      risks = ["No CPIC-flagged drug interactions identified for this genotype."];
    }

    return {
      reasoning_steps: [
        `Step 1: Analyzed patient genetic variant marker "${genVariant}".`,
        `Step 2: Standardized metabolizer status to CPIC reference key "${stdKey}".`,
        `Step 3: Cross-referenced active prescriptions (${medications}) against CPIC risk profiles.`,
        `Step 4: Formulated pathway bypass guidance for downstream PharmAI grounding.`
      ],
      metabolizer_status: stdKey, // STEP 1 Standardized Enum Key
      drug_interaction_risks: risks,
      summary: `Patient ${name} carries standardized marker ${stdKey}. Pharmacogenomic screening complete.`
    };
  }

  if (agentId === 'pulseiq') {
    return {
      reasoning_steps: [
        `Step 1: Ingested 60-day telemetry seeded from ${subjectLabel}.`,
        `Step 2: Computed baseline HR vs post-intervention recovery trajectory.`,
        `Step 3: Confirmed sleep restoration pattern.`
      ],
      baseline_summary: `Baseline Phase (30 days, seeded from ${subjectLabel}): Mean Resting HR = 78.0 bpm, SpO₂ = 96.5%, Sleep = 6.5h.`,
      post_intervention_summary: `Post-Intervention Phase (30 days): Mean Resting HR = 72.0 bpm (Δ-6.0 bpm), Sleep = 7.4h.`,
      trend_analysis: `Continuous telemetry from ${subjectLabel} demonstrates a 6.0 bpm reduction in resting heart rate following intervention.`,
      anomalies_detected: [`Seeded Ground Truth: Baseline HR derived from ${subjectLabel}.`],
      summary: `60-day longitudinal telemetry for ${name} shows favorable recovery reduction in resting heart rate.`
    };
  }

  if (agentId === 'synthai') {
    const geno = previousOutputs?.genolens || {};
    return {
      reasoning_steps: [
        `Step 1: Layered standardized genomic marker ${geno.metabolizer_status || stdKey}.`,
        `Step 2: Layered 60-day telemetry trends seeded from ${subjectLabel}.`,
        `Step 3: Synthesized clinical symptoms (${condition}) and medications (${medications}).`
      ],
      unified_patient_profile: `[Genomics]: ${geno.metabolizer_status || stdKey}. [Telemetry]: Seeded from ${subjectLabel}. [Clinical]: ${name}, ${age}y ${sex}, presenting with ${condition}.`,
      key_risk_factors: [`Genomic marker: ${geno.metabolizer_status || stdKey}`, `Condition: ${condition}`],
      summary: `Multi-layer Information Commons synthesis for ${name} (${age}y ${sex}) confirms ${geno.metabolizer_status || stdKey} profile.`
    };
  }

  if (agentId === 'pharmai') {
    if (stdKey === 'HLA-B_5701_positive') {
      const match = cpicResult.matches[0] || {};
      return {
        reasoning_steps: [
          `Step 1: Retreived CPIC reference guidance for HLA-B_5701_positive (${match.source || 'CPIC-HLAB-ABACAVIR-2014'}).`,
          `Step 2: Identified Abacavir as strictly contraindicated due to severe hypersensitivity risk.`,
          `Step 3: Selected Tenofovir Disoproxil 300mg + Emtricitabine 200mg (non-HLA-B*57:01 dependent).`,
          `Step 4: Verified CPIC alignment for antiretroviral therapy.`
        ],
        cpic_guideline_cited: match.source || "CPIC Guideline for HLA-B and Abacavir Hypersensitivity (CPIC-HLAB-ABACAVIR-2014)",
        cpic_grounding: cpicResult,
        recommended_drug: "Tenofovir Disoproxil 300 mg + Emtricitabine 200 mg",
        recommended_dose: "1 tablet PO QD with or without food",
        reasoning: `Grounded in ${match.source || 'CPIC-HLAB-ABACAVIR-2014'}: Patient ${name} is HLA-B*57:01 positive. Abacavir is STRICTLY CONTRAINDICATED due to high risk of life-threatening hypersensitivity reaction. Tenofovir disoproxil + Emtricitabine provides full antiviral efficacy without HLA-B liability.`,
        confidence_level: "98%",
        confidence_rationale: "High confidence (98%) due to 100% CPIC guideline alignment (CPIC-HLAB-ABACAVIR-2014) and absolute contraindication avoidance.",
        alternative_options: ["Bictegravir / Emtricitabine / Tenofovir alafenamide (Biktarvy 1 tab PO QD)"]
      };
    }

    if (stdKey === 'CYP2C19_rapid_metabolizer') {
      const match = cpicResult.matches[0] || {};
      return {
        reasoning_steps: [
          `Step 1: Retrieved CPIC guidance for CYP2C19_rapid_metabolizer (${match.source || 'CPIC-CYP2C19-CLOPIDOGREL-2022'}).`,
          `Step 2: Identified Clopidogrel over-activation risk due to rapid CYP2C19 prodrug bioactivation.`,
          `Step 3: Selected direct-acting P2Y12 inhibitor Ticagrelor 90mg BID + Aspirin 81mg QD.`,
          `Step 4: Verified non-CYP2C19 antiplatelet pathway.`
        ],
        cpic_guideline_cited: match.source || "CPIC Guideline for CYP2C19 and Clopidogrel Therapy (CPIC-CYP2C19-CLOPIDOGREL-2022)",
        cpic_grounding: cpicResult,
        recommended_drug: "Ticagrelor 90 mg + Aspirin 81 mg",
        recommended_dose: "Ticagrelor 90 mg PO BID + Aspirin 81 mg PO QD",
        reasoning: `Grounded in ${match.source || 'CPIC-CYP2C19-CLOPIDOGREL-2022'}: For ${name} (CYP2C19 Rapid Metabolizer), Clopidogrel undergoes ultra-rapid prodrug activation, increasing bleeding risk. Ticagrelor is a direct-acting P2Y12 inhibitor that does not require CYP2C19 bioactivation.`,
        confidence_level: "93%",
        confidence_rationale: "High confidence (93%) due to direct CPIC guideline match (CPIC-CYP2C19-CLOPIDOGREL-2022) eliminating Clopidogrel bioactivation risk.",
        alternative_options: ["Prasugrel 10 mg PO QD"]
      };
    }

    // Default: CYP2D6 Poor Metabolizer or Fallback
    const match = cpicResult.matches[0];
    return {
      reasoning_steps: [
        `Step 1: Checked CPIC reference lookup for ${stdKey}.`,
        cpicResult.has_match
          ? `Step 2: Retrieved guidance from ${match.source}.`
          : `Step 2: ${cpicResult.fallback_message}.`,
        `Step 3: Selected Amlodipine (CYP3A4) + Lisinopril (renal) to bypass metabolic defect.`,
        `Step 4: Formulated N-of-1 precision regimen.`
      ],
      cpic_guideline_cited: cpicResult.has_match ? match.source : "General Clinical Pharmacotherapy (No CPIC Match)",
      cpic_grounding: cpicResult,
      recommended_drug: "Amlodipine Besylate 5 mg + Lisinopril 5 mg",
      recommended_dose: "Amlodipine 5 mg PO QD (Morning) + Lisinopril 5 mg PO QD (Morning)",
      reasoning: cpicResult.has_match
        ? `Grounded in ${match.source}: For ${name} (${stdKey}), metoprolol carries severe drug accumulation risk. Amlodipine (CYP3A4 clearance) + Lisinopril (renal clearance) bypasses the ${stdKey} pathway.`
        : `For ${name} (${stdKey}): ${cpicResult.fallback_message}. Selecting Amlodipine (CYP3A4) + Lisinopril (renal clearance) based on general clinical pharmacotherapy principles.`,
      confidence_level: cpicResult.has_match ? "94%" : "85%",
      confidence_rationale: cpicResult.has_match
        ? `High confidence (94%) grounded in CPIC guidance (${match.source}).`
        : `Moderate confidence (85%) due to absence of specific CPIC guideline entry for marker ${stdKey}.`,
      alternative_options: ["Valsartan 80 mg PO QD", "Diltiazem ER 180 mg PO QD"]
    };
  }

  if (agentId === 'alertai') {
    return {
      reasoning_steps: [
        `Step 1: Ingested PharmAI recommendation and CPIC safety parameters.`,
        `Step 2: Derived physiological bounds from ${subjectLabel} telemetry baseline.`,
        `Step 3: Established follow-up protocol.`
      ],
      monitoring_thresholds: [
        `Resting Heart Rate: Alert if sustained >88 bpm or <50 bpm over 2 consecutive days.`,
        `SpO₂: Alert if daily average drops below 94.0%.`
      ],
      alert_conditions: ["Dihydropyridine CCB pedal edema.", "ACE inhibitor dry cough or creatinine elevation."],
      follow_up_schedule: `Bi-weekly telemetry review at Day 14 and 30 post-initiation; metabolic panel at 4 weeks.`
    };
  }

  if (agentId === 'critic') {
    return {
      reasoning_steps: [
        `Step 1: Audited PharmAI output against CPIC grounding lookup.`,
        `Step 2: Verified drug interaction safety.`,
        `Step 3: Senior Clinical Audit complete.`
      ],
      review_status: 'PASSED_VERIFIED',
      critique_summary: `Senior Clinical Audit Verified: PharmAI's recommendation aligns with CPIC reference grounding.`,
      missed_contraindications: [],
      underweighted_risks: ["Monitor for pedal edema during initial titration."],
      revision_needed: false,
      revised_recommendation: null
    };
  }

  return { summary: 'Processing complete.' };
}

// -------------------------------------------------------------------
// Agent System Prompts with Standardized Enum Constraints & CPIC Grounding
// -------------------------------------------------------------------
function getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs, assignedSubject) {
  const metabolizerKey = previousOutputs?.genolens?.metabolizer_status || deriveStandardizedKey(patientInfo?.geneticVariant);
  const cpicResult = lookupCPICGuidance(metabolizerKey);
  const subjectLabel = assignedSubject ? `${assignedSubject.display_name} (${assignedSubject.source === 'ppg_dalia' ? 'PPG Ground Truth' : 'Fitbit Continuous Wearable'})` : 'Real Wearable Telemetry Subject';

  let systemPrompt = '';
  let userPrompt = '';

  if (agentId === 'genolens') {
    systemPrompt = `You are GenoLens, a specialized pharmacogenomics AI agent in Med Matrix AI.
Respond ONLY with raw, parseable JSON with NO markdown formatting.

CRITICAL INSTRUCTION (STEP 1):
Your "metabolizer_status" field MUST be constrained to EXACTLY ONE of the following standardized snake_case identifier keys:
- "CYP2D6_poor_metabolizer"
- "CYP2D6_ultrarapid_metabolizer"
- "CYP2C19_rapid_metabolizer"
- "CYP2C19_poor_metabolizer"
- "CYP2C9_slow_metabolizer"
- "TPMT_poor_metabolizer"
- "SLCO1B1_decreased_function"
- "HLA-B_5701_positive"
- "CYP2D6_normal_metabolizer"
- "UNMAPPED_MARKER_FALLBACK"

Do NOT output free text in "metabolizer_status" — output ONLY one of the exact identifier keys above!

FEW-SHOT EXAMPLE OUTPUT:
{
  "reasoning_steps": [
    "Step 1: Identified CYP2D6 Poor Metabolizer (*4/*4 loss-of-function) variant.",
    "Step 2: Standardized metabolizer status to exact key CYP2D6_poor_metabolizer.",
    "Step 3: Screened current prescription Metoprolol for 500% AUC toxicity accumulation.",
    "Step 4: Formulated non-CYP2D6 pathway bypass recommendation."
  ],
  "metabolizer_status": "CYP2D6_poor_metabolizer",
  "drug_interaction_risks": [
    "Metoprolol succinate: 5-fold AUC accumulation and risk of symptomatic bradycardia.",
    "Avoid codeine and tramadol due to lack of active metabolite bioactivation."
  ],
  "summary": "Patient Marcus Vance carries CYP2D6_poor_metabolizer marker. Pharmacogenomic screening complete."
}`;

    userPrompt = `Analyze patient genetic profile for ${patientInfo.name}:
CONDITION: ${patientInfo.condition}
CURRENT MEDS: ${patientInfo.medications}
GENETIC VARIANT: ${patientInfo.geneticVariant}

Return JSON with "metabolizer_status" set to one of the exact allowed keys:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "metabolizer_status": "EXACT_ALLOWED_SNAKE_CASE_KEY",
  "drug_interaction_risks": ["3-4 specific risks"],
  "summary": "concise summary for ${patientInfo.name}"
}`;
  } else if (agentId === 'pulseiq') {
    const baseline = timelineData.filter(d => d.phase === 'baseline');
    const post = timelineData.filter(d => d.phase === 'post_intervention');
    const avg = (arr, key) => arr.length ? (arr.reduce((s, d) => s + d[key], 0) / arr.length).toFixed(1) : 'N/A';

    systemPrompt = `You are PulseIQ, a continuous wearable telemetry AI agent. Respond ONLY with valid JSON with "reasoning_steps".`;
    userPrompt = `Analyze 60-day telemetry for ${patientInfo.name}, grounded in ${subjectLabel}.
BASELINE (${baseline.length} days): HR ${avg(baseline, 'heart_rate')} bpm, SpO₂ ${avg(baseline, 'spo2')}%, Sleep ${avg(baseline, 'sleep_hours')}h
POST-INTERVENTION (${post.length} days): HR ${avg(post, 'heart_rate')} bpm, SpO₂ ${avg(post, 'spo2')}%, Sleep ${avg(post, 'sleep_hours')}h

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3..."],
  "baseline_summary": "baseline text referencing ${subjectLabel}",
  "post_intervention_summary": "post intervention text",
  "trend_analysis": "trend analysis",
  "anomalies_detected": ["findings"],
  "summary": "summary for ${patientInfo.name}"
}`;
  } else if (agentId === 'synthai') {
    systemPrompt = `You are SynthAI, an Information Commons fusion AI agent. Respond ONLY with valid JSON with "reasoning_steps".`;
    userPrompt = `Synthesize multi-layer profile for ${patientInfo.name}:
GENOLENS OUTPUT: ${JSON.stringify(previousOutputs.genolens)}
PULSEIQ OUTPUT: ${JSON.stringify(previousOutputs.pulseiq)}

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3..."],
  "unified_patient_profile": "profile string",
  "key_risk_factors": ["risk factors"],
  "summary": "summary"
}`;
  } else if (agentId === 'pharmai') {
    systemPrompt = `You are PharmAI, an N-of-1 precision pharmacotherapy AI agent in Med Matrix AI.
Respond ONLY with raw JSON with NO markdown.

SYSTEM INSTRUCTIONS FOR CPIC GROUNDING (STEP 3):
(a) Prioritize and align your recommendation with the REFERENCE CLINICAL GUIDANCE when the patient's situation involves one of the affected drug classes.
(b) Explicitly cite the "source" field in your reasoning and cpic_guideline_cited field when using this grounding.
(c) Clearly state if your recommendation goes beyond or differs from the reference guidance and why.
(d) If NO CPIC reference match is available, state clearly in your reasoning that reasoning proceeds on general pharmacotherapy principles without CPIC grounding.`;

    let groundingPromptBlock = '';
    if (cpicResult.has_match) {
      groundingPromptBlock = cpicResult.matches.map(m => `
REFERENCE CLINICAL GUIDANCE (source: ${m.source}):
- Marker Identifier Key: ${m.key}
- Gene: ${m.gene}
- Phenotype: ${m.phenotype}
- Source Citation: ${m.source}
- Affected Drug Classes: ${JSON.stringify(m.affected_drug_classes)}
- Clinical Guidance Text: "${m.guidance}"
`).join('\n');
    } else {
      groundingPromptBlock = `
REFERENCE CLINICAL GUIDANCE (source: CPIC):
${cpicResult.fallback_message}
`;
    }

    userPrompt = `Generate N-of-1 drug recommendation for ${patientInfo.name}:
CONDITION: ${patientInfo.condition}
GENETIC VARIANT / MARKER: ${metabolizerKey}
CURRENT MEDS: ${patientInfo.medications}
SEED SUBJECT: ${subjectLabel}

${groundingPromptBlock}

Return JSON strictly matching this format:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5..."],
  "cpic_guideline_cited": "${cpicResult.has_match ? cpicResult.primary_source : 'General Clinical Principles'}",
  "recommended_drug": "drug name(s)",
  "recommended_dose": "dose and schedule",
  "reasoning": "detailed clinical rationale explicitly citing ${cpicResult.has_match ? cpicResult.primary_source : 'general pharmacotherapy'}",
  "confidence_level": "percentage 70-99%",
  "confidence_rationale": "explanation of high confidence vs uncertainty factors",
  "alternative_options": ["2 alternative options"]
}`;
  } else if (agentId === 'alertai') {
    systemPrompt = `You are AlertAI. Respond ONLY with valid JSON with "reasoning_steps".`;
    userPrompt = `Establish safety guardrails for ${patientInfo.name}:
PHARMAI RECOMMENDATION: ${JSON.stringify(previousOutputs.pharmai)}

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3..."],
  "monitoring_thresholds": ["rules"],
  "alert_conditions": ["triggers"],
  "follow_up_schedule": "follow-up text"
}`;
  } else if (agentId === 'critic') {
    systemPrompt = `You are Senior Clinical Critic Agent. Respond ONLY with valid JSON with "reasoning_steps".`;
    userPrompt = `Perform senior clinical audit for ${patientInfo.name}:
PHARMAI OUTPUT: ${JSON.stringify(previousOutputs.pharmai)}

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3..."],
  "review_status": "PASSED_VERIFIED" or "REVISION_REQUIRED",
  "critique_summary": "critique text",
  "missed_contraindications": [],
  "underweighted_risks": ["risks"],
  "revision_needed": false,
  "revised_recommendation": null
}`;
  }

  return { systemPrompt, userPrompt };
}

// -------------------------------------------------------------------
// API Endpoint: /api/agent
// -------------------------------------------------------------------
app.post('/api/agent', async (req, res) => {
  const { agentId, patientInfo, timelineData, previousOutputs, apiKey } = req.body;
  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;

  const assignedSubject = assignSubject(patientInfo);
  const { systemPrompt, userPrompt } = getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs, assignedSubject);

  if (!anthropicKey) {
    const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs, assignedSubject);
    return res.json({
      success: true,
      data: mockData,
      mode: 'simulated',
      assignedSubject,
      debug: { systemPrompt, userPrompt, assignedSubject },
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Claude API Warning] Status ${response.status}: ${errText}. Using fallback.`);
      const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs, assignedSubject);
      return res.json({ success: true, data: mockData, mode: 'simulated_fallback', assignedSubject, warning: errText, debug: { systemPrompt, userPrompt, assignedSubject } });
    }

    const resJson = await response.json();
    const rawContent = resJson.content?.[0]?.text || '';
    const cleanedText = cleanJsonResponse(rawContent);

    try {
      const parsedData = JSON.parse(cleanedText);

      // STEP 2 & 3: Attach CPIC Grounding Lookup to PharmAI response if live Claude output
      if (agentId === 'pharmai') {
        const metabolizerKey = previousOutputs?.genolens?.metabolizer_status || deriveStandardizedKey(patientInfo?.geneticVariant);
        const cpicLookup = lookupCPICGuidance(metabolizerKey);
        parsedData.cpic_grounding = cpicLookup;
      }

      return res.json({ success: true, data: parsedData, mode: 'live_claude', assignedSubject, debug: { systemPrompt, userPrompt, assignedSubject } });
    } catch (parseErr) {
      console.warn('[JSON Parse Warning] Using fallback.', cleanedText);
      const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs, assignedSubject);
      return res.json({ success: true, data: mockData, mode: 'simulated_parse_fallback', assignedSubject, debug: { systemPrompt, userPrompt, assignedSubject } });
    }
  } catch (err) {
    console.error('[Agent Server Error]', err);
    const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs, assignedSubject);
    return res.json({ success: true, data: mockData, mode: 'simulated_error_fallback', assignedSubject, error: err.message, debug: { systemPrompt, userPrompt, assignedSubject } });
  }
});

// Serve production static assets if dist exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Med Matrix AI Server running on http://localhost:${PORT}`);
});
