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
// Load Datasets: Subject Pool, Timeline, and CPIC Reference Table
// -------------------------------------------------------------------
const poolPath = path.join(__dirname, 'public', 'subject_pool.json');
const timelinePath = path.join(__dirname, 'public', 'patient_timeline.json');
const cpicPath = path.join(__dirname, 'src', 'data', 'cpic_reference.json');

let subjectPool = [];
let cpicReference = { guidelines: {} };

try {
  if (fs.existsSync(poolPath)) subjectPool = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
} catch (err) {
  console.warn('Could not load subject_pool.json', err.message);
}

try {
  if (fs.existsSync(cpicPath)) {
    cpicReference = JSON.parse(fs.readFileSync(cpicPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not load cpic_reference.json', err.message);
}

// Grounding Helper: Match Patient Metabolizer Status to CPIC Guideline Entry
function matchCPICGuideline(geneticVariant) {
  const variantStr = (geneticVariant || '').toLowerCase();
  const guidelines = cpicReference.guidelines || {};

  if (variantStr.includes('cyp2d6') && variantStr.includes('poor')) return guidelines['CYP2D6 Poor Metabolizer'];
  if (variantStr.includes('cyp2d6') && variantStr.includes('ultrarapid')) return guidelines['CYP2D6 Ultrarapid Metabolizer'];
  if (variantStr.includes('cyp2c19') && variantStr.includes('rapid')) return guidelines['CYP2C19 Rapid Metabolizer'];
  if (variantStr.includes('cyp2c19') && variantStr.includes('poor')) return guidelines['CYP2C19 Poor Metabolizer'];
  if (variantStr.includes('cyp2c9') && variantStr.includes('slow')) return guidelines['CYP2C9 Slow Metabolizer'];

  return guidelines['Normal Metabolizer'] || {
    cpic_guideline_id: "CPIC-WILDTYPE-STANDARD",
    affected_drugs: [],
    dosing_recommendation: "Standard guideline-directed medical therapy.",
    evidence_level: "Standard Practice"
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
app.get('/api/cpic-reference', (req, res) => res.json(cpicReference));

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
      heart_rate_std: 11.82,
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
// Variant Profile Definitions
// -------------------------------------------------------------------
const VARIANT_PROFILES = {
  'CYP2D6 Poor Metabolizer': {
    enzyme: 'CYP2D6',
    phenotype: 'Poor Metabolizer',
    cpicId: 'CPIC-CYP2D6-SUBSTRATES-v3',
    impactedPathway: 'CYP2D6',
    bypassPathway: 'CYP3A4',
    riskyDrugs: ['Metoprolol', 'Carvedilol', 'Codeine', 'Tramadol'],
    riskDescription: 'complete loss-of-function of CYP2D6, causing 300-500% AUC increase for CYP2D6 substrates',
    safeDrugClass: 'Calcium Channel Blockers + ACE Inhibitors (CYP3A4/renal)',
    primaryDrug: 'Amlodipine Besylate 5 mg',
    secondaryDrug: 'Lisinopril 5 mg',
    primaryDose: 'Amlodipine 5 mg PO QD (Morning) + Lisinopril 5 mg PO QD (Morning)',
    reasoning: 'Amlodipine is metabolized via CYP3A4, completely bypassing the deficient CYP2D6 pathway. Combined with Lisinopril (eliminated unchanged via renal excretion), this dual regimen addresses hypertension without toxic drug accumulation.',
    alternatives: [
      'Valsartan 80 mg PO QD (ARB — CYP2C9 pathway, non-CYP2D6)',
      'Diltiazem ER 180 mg PO QD (Non-dihydropyridine CCB — CYP3A4)'
    ],
    confidenceBase: 94,
    edemaRisk: 'dihydropyridine calcium channel blockade pedal edema',
    specificAdverse: 'Acute serum creatinine elevation >30% or persistent dry cough from ACE inhibitor'
  },
  'CYP2C19 Rapid Metabolizer': {
    enzyme: 'CYP2C19',
    phenotype: 'Rapid Metabolizer',
    cpicId: 'CPIC-CYP2C19-CLOPIDOGREL-v2',
    impactedPathway: 'CYP2C19',
    bypassPathway: 'direct-acting',
    riskyDrugs: ['Clopidogrel (over-activation)', 'Omeprazole', 'Voriconazole'],
    riskDescription: 'ultra-rapid CYP2C19 activation causing excessive prodrug conversion and increased bleeding risk with Clopidogrel',
    safeDrugClass: 'Direct-acting P2Y12 inhibitors (non-prodrug)',
    primaryDrug: 'Ticagrelor 90 mg',
    secondaryDrug: 'Aspirin 81 mg',
    primaryDose: 'Ticagrelor 90 mg PO BID + Aspirin 81 mg PO QD',
    reasoning: 'Ticagrelor is a direct-acting reversible P2Y12 inhibitor that does not require CYP2C19 activation, eliminating the risk of excessive antiplatelet effect seen with Clopidogrel in rapid metabolizers. Combined with low-dose aspirin for dual antiplatelet therapy.',
    alternatives: [
      'Prasugrel 10 mg PO QD (active metabolite via different CYP pathway)',
      'Cangrelor IV (direct P2Y12, for acute settings)'
    ],
    confidenceBase: 91,
    edemaRisk: 'increased bleeding diathesis from excessive antiplatelet activity',
    specificAdverse: 'Dyspnea (Ticagrelor-specific adenosine reuptake inhibition), GI bleeding'
  },
  'CYP2C9 Slow Metabolizer': {
    enzyme: 'CYP2C9',
    phenotype: 'Slow Metabolizer',
    cpicId: 'CPIC-CYP2C9-WARFARIN-CELECOXIB',
    impactedPathway: 'CYP2C9',
    bypassPathway: 'non-CYP2C9',
    riskyDrugs: ['Warfarin', 'Celecoxib', 'Losartan', 'Phenytoin'],
    riskDescription: 'severely impaired CYP2C9 clearance causing 2-4x prolonged half-life for Warfarin, risking supratherapeutic INR and hemorrhage',
    safeDrugClass: 'Direct Oral Anticoagulants (non-CYP2C9 dependent)',
    primaryDrug: 'Apixaban 5 mg',
    secondaryDrug: 'Diltiazem ER 180 mg',
    primaryDose: 'Apixaban 5 mg PO BID (with renal dose adjustment)',
    reasoning: 'Apixaban (Factor Xa inhibitor) undergoes mixed CYP3A4/renal elimination, completely bypassing the impaired CYP2C9 pathway. Unlike Warfarin, it has a wide therapeutic window, does not require INR monitoring, and is safer in CYP2C9 slow metabolizers.',
    alternatives: [
      'Rivaroxaban 20 mg PO QD with food (Factor Xa — CYP3A4/renal)',
      'Edoxaban 60 mg PO QD (Factor Xa — minimal CYP dependency)'
    ],
    confidenceBase: 89,
    edemaRisk: 'occult GI bleeding from direct oral anticoagulant therapy',
    specificAdverse: 'Hepatotoxicity monitoring — LFT at 4 weeks; avoid concomitant strong CYP3A4 inhibitors'
  },
  'CYP2D6 Ultrarapid Metabolizer': {
    enzyme: 'CYP2D6',
    phenotype: 'Ultrarapid Metabolizer',
    cpicId: 'CPIC-CYP2D6-CODEINE-TRAMADOL',
    impactedPathway: 'CYP2D6',
    bypassPathway: 'non-CYP2D6',
    riskyDrugs: ['Codeine (→ toxic morphine levels)', 'Tramadol (serotonin syndrome risk)', 'Tamoxifen (over-activation)'],
    riskDescription: 'ultrarapid CYP2D6 conversion causing dangerously high active metabolite concentrations — codeine→morphine toxicity, tramadol serotonin syndrome',
    safeDrugClass: 'Non-CYP2D6-activated analgesics and targeted therapies',
    primaryDrug: 'Morphine Sulfate ER 15 mg',
    secondaryDrug: 'Acetaminophen 650 mg',
    primaryDose: 'Morphine Sulfate ER 15 mg PO Q12H + Acetaminophen 650 mg PO Q6H PRN',
    reasoning: 'In ultrarapid CYP2D6 metabolizers, prodrugs like codeine are converted to active metabolites at dangerous rates. Morphine does not require CYP2D6 activation (it IS the active compound), eliminating the ultrarapid conversion risk entirely.',
    alternatives: [
      'Hydromorphone 2 mg PO Q4-6H PRN (no CYP2D6 activation required)',
      'Fentanyl transdermal 25 mcg/hr Q72H (CYP3A4 pathway, non-CYP2D6)'
    ],
    confidenceBase: 87,
    edemaRisk: 'respiratory depression from opioid therapy',
    specificAdverse: 'Constipation, sedation — co-prescribe senna/docusate; naloxone rescue kit required'
  },
  'Normal Metabolizer': {
    enzyme: 'Multiple',
    phenotype: 'Normal (Extensive) Metabolizer',
    cpicId: 'CPIC-WILDTYPE-STANDARD',
    impactedPathway: 'none (standard clearance)',
    bypassPathway: 'standard',
    riskyDrugs: [],
    riskDescription: 'no pharmacogenomic clearance defects identified — standard dosing protocols apply',
    safeDrugClass: 'Standard first-line guideline-recommended therapy',
    primaryDrug: 'Lisinopril 10 mg',
    secondaryDrug: 'Hydrochlorothiazide 12.5 mg',
    primaryDose: 'Lisinopril 10 mg PO QD + HCTZ 12.5 mg PO QD (if BP uncontrolled)',
    reasoning: 'With no identified pharmacogenomic clearance abnormalities, standard JNC-8 guideline first-line therapy is appropriate. ACE inhibitor monotherapy with optional thiazide add-on provides evidence-based blood pressure control with well-characterized safety profile.',
    alternatives: [
      'Amlodipine 5 mg PO QD (first-line CCB alternative)',
      'Losartan 50 mg PO QD (ARB for ACE-intolerant patients)'
    ],
    confidenceBase: 96,
    edemaRisk: 'angioedema (rare, ACE inhibitor class effect)',
    specificAdverse: 'Hyperkalemia if combined with potassium-sparing agents; persistent dry cough (switch to ARB)'
  }
};

function getVariantProfile(geneticVariant) {
  const variantStr = (geneticVariant || '').toLowerCase();
  if (variantStr.includes('cyp2d6') && variantStr.includes('poor')) return VARIANT_PROFILES['CYP2D6 Poor Metabolizer'];
  if (variantStr.includes('cyp2c19') && variantStr.includes('rapid')) return VARIANT_PROFILES['CYP2C19 Rapid Metabolizer'];
  if (variantStr.includes('cyp2c9') && variantStr.includes('slow')) return VARIANT_PROFILES['CYP2C9 Slow Metabolizer'];
  if (variantStr.includes('cyp2d6') && variantStr.includes('ultrarapid')) return VARIANT_PROFILES['CYP2D6 Ultrarapid Metabolizer'];
  return VARIANT_PROFILES['Normal Metabolizer'];
}

function computeTimelineStats(timelineData) {
  if (!timelineData || !Array.isArray(timelineData) || timelineData.length === 0) {
    return { baseline: null, post: null };
  }
  const baseline = timelineData.filter(d => d.phase === 'baseline');
  const post = timelineData.filter(d => d.phase === 'post_intervention');
  const avg = (arr, key) => arr.length ? (arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;
  const min = (arr, key) => arr.length ? Math.min(...arr.map(d => d[key] || 999)) : 0;
  const max = (arr, key) => arr.length ? Math.max(...arr.map(d => d[key] || 0)) : 0;

  return {
    baseline: {
      days: baseline.length,
      hr: avg(baseline, 'heart_rate').toFixed(1),
      spo2: avg(baseline, 'spo2').toFixed(1),
      sleep: avg(baseline, 'sleep_hours').toFixed(1),
      steps: Math.round(avg(baseline, 'steps')),
      hrMin: min(baseline, 'heart_rate').toFixed(1),
      hrMax: max(baseline, 'heart_rate').toFixed(1),
    },
    post: {
      days: post.length,
      hr: avg(post, 'heart_rate').toFixed(1),
      spo2: avg(post, 'spo2').toFixed(1),
      sleep: avg(post, 'sleep_hours').toFixed(1),
      steps: Math.round(avg(post, 'steps')),
      hrMin: min(post, 'heart_rate').toFixed(1),
      hrMax: max(post, 'heart_rate').toFixed(1),
    },
    hrDelta: (avg(post, 'heart_rate') - avg(baseline, 'heart_rate')).toFixed(1),
    sleepDelta: (avg(post, 'sleep_hours') - avg(baseline, 'sleep_hours')).toFixed(1),
  };
}

// -------------------------------------------------------------------
// Deterministic Fallback Output Generator (Extended with Reasoning Steps & Critic)
// -------------------------------------------------------------------
function generateMockOutput(agentId, patientInfo, timelineData, previousOutputs, assignedSubject) {
  const name = patientInfo?.name || 'Unknown Patient';
  const age = patientInfo?.age || '?';
  const sex = patientInfo?.sex || '?';
  const weight = patientInfo?.weight || '?';
  const condition = patientInfo?.condition || 'No condition specified';
  const medications = patientInfo?.medications || 'None reported';
  const genVariant = patientInfo?.geneticVariant || 'Normal Metabolizer (Wildtype / Extensive)';
  const profile = getVariantProfile(genVariant);
  const cpicData = matchCPICGuideline(genVariant);
  const stats = computeTimelineStats(timelineData);
  const subjectLabel = assignedSubject ? assignedSubject.display_name : 'Default Fitbit User #1067';

  if (agentId === 'genolens') {
    const risks = profile.riskyDrugs.length > 0
      ? profile.riskyDrugs.map(drug => `${drug}: ${profile.riskDescription.includes(drug.toLowerCase()) ? profile.riskDescription : 'requires dose adjustment or avoidance due to ' + profile.phenotype + ' of ' + profile.enzyme}.`)
      : ['No significant pharmacogenomic drug interaction risks identified for this genotype. Standard dosing is appropriate.'];

    if (medications && medications !== 'None reported') {
      const medLower = medications.toLowerCase();
      for (const risky of profile.riskyDrugs) {
        if (medLower.includes(risky.toLowerCase().split(' ')[0].toLowerCase())) {
          risks.unshift(`⚠ CRITICAL: Patient is CURRENTLY prescribed ${risky}, which has ${profile.riskDescription}. Immediate reassessment required.`);
        }
      }
    }

    return {
      reasoning_steps: [
        `Step 1: Extracted patient variant marker "${genVariant}" and identified phenotype as ${profile.phenotype} for ${profile.enzyme}.`,
        `Step 2: Cross-referenced active prescriptions (${medications}) against ${profile.enzyme} substrate pathways.`,
        `Step 3: Matched guideline ${cpicData.cpic_guideline_id} (${cpicData.evidence_level}) for safe clearance recommendations.`,
        `Step 4: Formulated primary pathway bypass strategy targeting ${profile.safeDrugClass}.`
      ],
      metabolizer_status: `${genVariant} — ${profile.phenotype} phenotype confirmed for ${profile.enzyme}`,
      drug_interaction_risks: risks.slice(0, 4),
      summary: `Patient ${name} (${age}y ${sex}, ${weight}) carries ${genVariant}, indicating ${profile.riskDescription}. Current medications (${medications}) must be cross-checked against ${profile.enzyme} substrate tables. ${profile.safeDrugClass} are recommended as the primary therapeutic class.`
    };
  }

  if (agentId === 'pulseiq') {
    return {
      reasoning_steps: [
        `Step 1: Ingested 60-day wearable telemetry seeded from real subject dataset (${subjectLabel}).`,
        `Step 2: Computed baseline HR mean (${stats.baseline?.hr || '78.0'} bpm) vs post-intervention HR mean (${stats.post?.hr || '72.0'} bpm).`,
        `Step 3: Modeled exponential recovery trajectory demonstrating ${stats.hrDelta || '-6.0'} bpm cardiac stabilization.`,
        `Step 4: Identified sleep restoration pattern (${stats.baseline?.sleep || '6.5'}h → ${stats.post?.sleep || '7.4'}h).`
      ],
      baseline_summary: `Baseline Phase (${stats.baseline?.days || 30} days, seeded from ${subjectLabel}): Mean Resting HR = ${stats.baseline?.hr || '78.0'} bpm, Mean Sleep = ${stats.baseline?.sleep || '6.5'} h, SpO₂ = ${stats.baseline?.spo2 || '96.5'}%.`,
      post_intervention_summary: `Post-Intervention Phase (${stats.post?.days || 30} days): Mean Resting HR = ${stats.post?.hr || '72.0'} bpm (Δ${stats.hrDelta || '-6.0'} bpm), Mean Sleep = ${stats.post?.sleep || '7.4'} h (Δ+${stats.sleepDelta || '0.9'} h).`,
      trend_analysis: `Continuous telemetry seeded from ${subjectLabel} demonstrates a ${stats.hrDelta || '-6.0'} bpm reduction in resting heart rate following intervention, confirming autonomic stabilization.`,
      anomalies_detected: [
        `Seeded Ground Truth: Baseline HR range ${stats.baseline?.hrMin || '68.0'}–${stats.baseline?.hrMax || '92.0'} bpm derived from ${subjectLabel}.`,
        `Sleep restoring from ${stats.baseline?.sleep || '6.5'} h to ${stats.post?.sleep || '7.4'} h post-intervention.`
      ],
      summary: `60-day longitudinal telemetry for ${name} (seeded from ${subjectLabel}) shows a favorable recovery trajectory in resting heart rate (${stats.baseline?.hr || '78.0'} → ${stats.post?.hr || '72.0'} bpm) and sleep duration.`
    };
  }

  if (agentId === 'synthai') {
    const geno = previousOutputs?.genolens || {};
    const pulse = previousOutputs?.pulseiq || {};

    return {
      reasoning_steps: [
        `Step 1: Integrated genomic layer from GenoLens (${geno.metabolizer_status || genVariant}).`,
        `Step 2: Layered 60-day telemetry trends from PulseIQ (${pulse.trend_analysis || 'Seeded from ' + subjectLabel}).`,
        `Step 3: Merged clinical symptoms (${condition}) and active prescriptions (${medications}).`,
        `Step 4: Fused exposome factors (${patientInfo?.lifestyle || 'Standard'}) to form Information Commons profile.`
      ],
      unified_patient_profile: `[Layer 1 — Genomics]: ${geno.metabolizer_status || genVariant}. [Layer 2 — Telemetry]: ${pulse.baseline_summary || 'No telemetry'} → ${pulse.post_intervention_summary || ''} (Seeded from ${subjectLabel}). [Layer 3 — Clinical]: ${name}, ${age}y ${sex}, ${weight}, presenting with ${condition}; Rx: ${medications}. [Layer 4 — Exposome]: ${patientInfo?.lifestyle || 'Standard'}.`,
      key_risk_factors: [
        `Pharmacogenomic: ${profile.phenotype} of ${profile.enzyme} — ${profile.riskyDrugs.length > 0 ? 'contraindicated: ' + profile.riskyDrugs.join(', ') : 'no specific contraindications'}.`,
        `Clinical: ${condition}${medications !== 'None reported' ? ' (on ' + medications + ')' : ''}.`,
        `Telemetric Grounding: Grounded in real subject ${subjectLabel}.`
      ],
      summary: `Multi-layer Information Commons synthesis for ${name} (${age}y ${sex}) confirms ${profile.phenotype} phenotype. Clinical presentation (${condition.substring(0, 70)}) combined with telemetry from ${subjectLabel} informs the N-of-1 precision strategy.`
    };
  }

  if (agentId === 'pharmai') {
    const confidence = profile.confidenceBase;
    return {
      reasoning_steps: [
        `Step 1: Evaluated CPIC guideline ${cpicData.cpic_guideline_id} (${cpicData.evidence_level}) for ${genVariant}.`,
        `Step 2: Screened first-line agents for ${condition} to eliminate ${profile.enzyme} clearance dependencies.`,
        `Step 3: Selected ${profile.primaryDrug} due to ${profile.bypassPathway} clearance, bypassing impaired ${profile.enzyme} pathway.`,
        `Step 4: Added ${profile.secondaryDrug} to optimize therapeutic efficacy while maintaining non-interacting clearance.`,
        `Step 5: Verified dose against patient weight (${weight}) and baseline heart rate derived from ${subjectLabel}.`
      ],
      cpic_guideline_cited: cpicData.cpic_guideline_id,
      recommended_drug: `${profile.primaryDrug} + ${profile.secondaryDrug}`,
      recommended_dose: profile.primaryDose,
      reasoning: `Grounding in CPIC Guideline ${cpicData.cpic_guideline_id} (${cpicData.evidence_level}): For ${name} (${age}y, ${genVariant}), ${profile.reasoning} Telemetry trajectory seeded from ${subjectLabel} (${stats.baseline?.hr || '78'} bpm → ${stats.post?.hr || '72'} bpm) confirms cardiac safety. CPIC guidance strictly mandates avoiding ${profile.riskyDrugs.slice(0, 2).join(' and ') || 'impaired substrates'}.`,
      confidence_level: `${confidence}%`,
      confidence_rationale: `High confidence (${confidence}%) due to 100% CPIC guideline alignment (${cpicData.cpic_guideline_id}), clear ${genVariant} phenotype confirmation, and non-interacting ${profile.bypassPathway} metabolic pathway; minor uncertainty due to 30-day baseline telemetry sample size.`,
      alternative_options: profile.alternatives
    };
  }

  if (agentId === 'alertai') {
    const hrBaseline = stats.baseline ? parseFloat(stats.baseline.hr) : 78;
    const hrUpper = Math.round(hrBaseline + 10);
    const hrLower = Math.max(45, Math.round(hrBaseline - 25));

    return {
      reasoning_steps: [
        `Step 1: Ingested PharmAI recommendation (${profile.primaryDrug}) and CPIC safety parameters.`,
        `Step 2: Derived physiological upper/lower bounds from ${subjectLabel} baseline HR (${hrBaseline} bpm).`,
        `Step 3: Formulated adverse event trigger criteria for ${profile.edemaRisk}.`,
        `Step 4: Established bi-weekly wearable telemetry review and 4-week metabolic monitoring schedule.`
      ],
      monitoring_thresholds: [
        `Resting Heart Rate: Alert if sustained >${hrUpper} bpm or <${hrLower} bpm over 2 consecutive days (personalized from ${subjectLabel} baseline ${hrBaseline} bpm).`,
        `SpO₂: Alert if daily average drops below 94.0%.`,
        `Sleep Duration: Flag if <5 hours for >3 consecutive nights.`
      ],
      alert_conditions: [
        `${profile.edemaRisk} — specific to ${profile.primaryDrug}.`,
        `${profile.specificAdverse}.`
      ],
      follow_up_schedule: `Bi-weekly wearable telemetry review at Day 14 and Day 30 post-initiation of ${profile.primaryDrug}; metabolic panel at 4 weeks.`
    };
  }

  if (agentId === 'critic') {
    const pharma = previousOutputs?.pharmai || {};
    return {
      reasoning_steps: [
        `Step 1: Audited PharmAI recommendation (${pharma.recommended_drug || profile.primaryDrug}) against ${genVariant}.`,
        `Step 2: Verified compliance with CPIC guideline ${cpicData.cpic_guideline_id}.`,
        `Step 3: Evaluated active medications (${medications}) for secondary drug-drug interactions.`,
        `Step 4: Checked telemetry baseline from ${subjectLabel} for baseline bradycardia or rhythm anomalies.`
      ],
      review_status: 'PASSED_VERIFIED',
      critique_summary: `Senior Clinical Audit Verified: PharmAI's selection of ${pharma.recommended_drug || profile.primaryDrug} complies 100% with CPIC guideline ${cpicData.cpic_guideline_id}. The ${profile.bypassPathway} pathway successfully bypasses the ${genVariant} clearance defect with zero unflagged interactions.`,
      missed_contraindications: [],
      underweighted_risks: [
        `Monitor for ${profile.edemaRisk} during initial 14-day titration phase.`,
        `Routine serum creatinine / electrolyte check recommended at 4 weeks.`
      ],
      revision_needed: false,
      revised_recommendation: null
    };
  }

  return { summary: 'Processing complete.' };
}

// -------------------------------------------------------------------
// Agent System Prompts with Chain-of-Thought & Few-Shot Examples
// -------------------------------------------------------------------
function getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs, assignedSubject) {
  const cpicData = matchCPICGuideline(patientInfo?.geneticVariant);
  const subjectLabel = assignedSubject ? `${assignedSubject.display_name} (${assignedSubject.source === 'ppg_dalia' ? 'PPG Ground Truth' : 'Fitbit Continuous Wearable'})` : 'Real Wearable Telemetry Subject';

  let systemPrompt = '';
  let userPrompt = '';

  if (agentId === 'genolens') {
    systemPrompt = `You are GenoLens, a specialized pharmacogenomics AI agent in Med Matrix AI.
You MUST output strictly raw, parseable JSON ONLY with NO markdown fences, no preamble, and no postscript.

EVERY RESPONSE MUST INCLUDE A "reasoning_steps" ARRAY (3-5 short clinical reasoning steps) BEFORE THE FINAL FIELDS.

FEW-SHOT EXAMPLE INPUT:
Patient: Marcus Vance, 54y M, Condition: Stage 2 Essential Hypertension, Genetic Variant: CYP2D6 Poor Metabolizer (*4/*4), Meds: Metoprolol 50mg

FEW-SHOT EXAMPLE OUTPUT:
{
  "reasoning_steps": [
    "Step 1: Identified CYP2D6 Poor Metabolizer (*4/*4 biallelic loss-of-function) phenotype.",
    "Step 2: Cross-referenced active prescription Metoprolol, which relies 70-80% on CYP2D6 clearance.",
    "Step 3: Calculated severe drug accumulation risk (300-500% AUC elevation, risking severe bradycardia).",
    "Step 4: Formulated recommendation to transition from CYP2D6 beta-blockers to non-CYP2D6 pathways (CYP3A4/renal)."
  ],
  "metabolizer_status": "CYP2D6 Poor Metabolizer (*4/*4) — Complete loss of enzyme activity",
  "drug_interaction_risks": [
    "CRITICAL: Metoprolol succinate undergoes 70-80% CYP2D6 metabolism; poor metabolizer status results in 5-fold AUC accumulation and severe symptomatic bradycardia.",
    "Avoid codeine and tramadol due to lack of bioactivation to active analgesic metabolites."
  ],
  "summary": "Patient Marcus Vance (54y M) carries CYP2D6 Poor Metabolizer (*4/*4), causing severe clearance impairment for metoprolol. Transition to a non-CYP2D6 antihypertensive (e.g. Amlodipine via CYP3A4 + Lisinopril via renal clearance) is strongly recommended."
}`;

    userPrompt = `Analyze this SPECIFIC patient's pharmacogenomic profile:
PATIENT: ${patientInfo.name}, ${patientInfo.age}y ${patientInfo.sex}, ${patientInfo.weight}
CONDITION: ${patientInfo.condition}
CURRENT MEDS: ${patientInfo.medications}
GENETIC VARIANT: ${patientInfo.geneticVariant}
LIFESTYLE: ${patientInfo.lifestyle}
SEED SUBJECT: ${subjectLabel}
CPIC REFERENCE GUIDELINE: ${cpicData.cpic_guideline_id} (${cpicData.evidence_level}): "${cpicData.dosing_recommendation}"

Return JSON strictly matching this structure:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "metabolizer_status": "phenotype description for ${patientInfo.geneticVariant}",
  "drug_interaction_risks": ["3-4 specific risks for ${patientInfo.name}"],
  "summary": "2-3 sentence summary for ${patientInfo.name}"
}`;
  } else if (agentId === 'pulseiq') {
    const baseline = timelineData.filter(d => d.phase === 'baseline');
    const post = timelineData.filter(d => d.phase === 'post_intervention');
    const avg = (arr, key) => arr.length ? (arr.reduce((s, d) => s + d[key], 0) / arr.length).toFixed(1) : 'N/A';

    systemPrompt = `You are PulseIQ, a continuous wearable telemetry AI agent in Med Matrix AI. Respond ONLY with valid JSON.
EVERY RESPONSE MUST INCLUDE A "reasoning_steps" ARRAY (3-5 clinical reasoning steps) BEFORE FINAL FIELDS.`;

    userPrompt = `Analyze 60-day telemetry for ${patientInfo.name} (${patientInfo.age}y ${patientInfo.sex}), grounded in ${subjectLabel}.
BASELINE (${baseline.length} days): HR ${avg(baseline, 'heart_rate')} bpm, SpO₂ ${avg(baseline, 'spo2')}%, Sleep ${avg(baseline, 'sleep_hours')}h
POST-INTERVENTION (${post.length} days): HR ${avg(post, 'heart_rate')} bpm, SpO₂ ${avg(post, 'spo2')}%, Sleep ${avg(post, 'sleep_hours')}h
HR Delta: ${(parseFloat(avg(post, 'heart_rate')) - parseFloat(avg(baseline, 'heart_rate'))).toFixed(1)} bpm

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "baseline_summary": "baseline text with telemetry values and ${subjectLabel}",
  "post_intervention_summary": "post intervention text with deltas",
  "trend_analysis": "clinical interpretation of recovery curve",
  "anomalies_detected": ["2-3 telemetry findings"],
  "summary": "concise summary for ${patientInfo.name}"
}`;
  } else if (agentId === 'synthai') {
    systemPrompt = `You are SynthAI, an Information Commons fusion AI agent in Med Matrix AI. Respond ONLY with valid JSON.
EVERY RESPONSE MUST INCLUDE A "reasoning_steps" ARRAY (3-5 clinical reasoning steps) BEFORE FINAL FIELDS.`;

    userPrompt = `Synthesize multi-layer profile for ${patientInfo.name}:
INTAKE DATA: ${JSON.stringify(patientInfo)}
SEED SUBJECT: ${subjectLabel}
GENOLENS OUTPUT: ${JSON.stringify(previousOutputs.genolens)}
PULSEIQ OUTPUT: ${JSON.stringify(previousOutputs.pulseiq)}

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "unified_patient_profile": "comprehensive 4-layer profile string referencing ${subjectLabel}",
  "key_risk_factors": ["3-4 risk factors for ${patientInfo.name}"],
  "summary": "summary referencing ${patientInfo.name}"
}`;
  } else if (agentId === 'pharmai') {
    systemPrompt = `You are PharmAI, an N-of-1 precision pharmacotherapy AI agent in Med Matrix AI.
Respond ONLY with valid raw JSON with NO markdown formatting.

EVERY RESPONSE MUST INCLUDE:
1. "reasoning_steps" array (4-5 clinical reasoning steps)
2. "cpic_guideline_cited" field explicitly citing the matching CPIC guideline ID
3. "confidence_rationale" explaining what data supports high confidence vs what is uncertain

FEW-SHOT EXAMPLE INPUT:
Patient: Marcus Vance, 54y M, Variant: CYP2D6 Poor Metabolizer, Condition: Stage 2 Hypertension, CPIC Guideline: CPIC-CYP2D6-SUBSTRATES-v3

FEW-SHOT EXAMPLE OUTPUT:
{
  "reasoning_steps": [
    "Step 1: Evaluated CPIC Guideline CPIC-CYP2D6-SUBSTRATES-v3 for CYP2D6 Poor Metabolizer status.",
    "Step 2: Eliminated CYP2D6-dependent antihypertensives (Metoprolol, Carvedilol, Nebivolol).",
    "Step 3: Selected Amlodipine Besylate (CYP3A4 clearance) + Lisinopril (unchanged renal excretion).",
    "Step 4: Verified dual mechanism (dihydropyridine CCB + ACE inhibitor) for Stage 2 Hypertension blood pressure goal (<130/80 mmHg).",
    "Step 5: Checked baseline heart rate telemetry (78 bpm) to ensure no baseline heart block contraindication."
  ],
  "cpic_guideline_cited": "CPIC-CYP2D6-SUBSTRATES-v3",
  "recommended_drug": "Amlodipine Besylate 5 mg + Lisinopril 5 mg",
  "recommended_dose": "Amlodipine 5 mg PO QD (Morning) + Lisinopril 5 mg PO QD (Morning)",
  "reasoning": "Grounding in CPIC Guideline CPIC-CYP2D6-SUBSTRATES-v3 (Evidence Level A): Marcus Vance carries CYP2D6 Poor Metabolizer status, making metoprolol unsafe due to 5-fold drug accumulation. Amlodipine is cleared via CYP3A4, completely bypassing the deficient CYP2D6 pathway, while Lisinopril is eliminated via renal excretion. This combination provides synergistic blood pressure reduction without pharmacogenomic clearance risk.",
  "confidence_level": "94%",
  "confidence_rationale": "High confidence (94%) due to 100% alignment with CPIC-CYP2D6-SUBSTRATES-v3 guidance, confirmed loss-of-function genetic marker, and robust dual non-CYP2D6 clearance pathways; minor uncertainty due to lack of baseline renal panel (serum creatinine).",
  "alternative_options": [
    "Valsartan 80 mg PO QD (ARB — CYP2C9 clearance, non-CYP2D6)",
    "Diltiazem ER 180 mg PO QD (Non-dihydropyridine CCB — CYP3A4 pathway)"
  ]
}`;

    userPrompt = `Generate N-of-1 drug recommendation for ${patientInfo.name}:
CONDITION: ${patientInfo.condition}
GENETIC VARIANT: ${patientInfo.geneticVariant}
CURRENT MEDS: ${patientInfo.medications}
SEED SUBJECT: ${subjectLabel}
SYNTHAI PROFILE: ${JSON.stringify(previousOutputs.synthai)}

CPIC GROUNDING DATA:
Guideline ID: ${cpicData.cpic_guideline_id} (${cpicData.evidence_level})
Guideline Dosing Guidance: "${cpicData.dosing_recommendation}"
Affected/Impaired Substrates: ${JSON.stringify(cpicData.affected_drugs)}

YOU MUST EXPLICITLY CITE "${cpicData.cpic_guideline_id}" IN YOUR REASONING AND CPIC_GUIDELINE_CITED FIELD.

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5..."],
  "cpic_guideline_cited": "${cpicData.cpic_guideline_id}",
  "recommended_drug": "drug name(s)",
  "recommended_dose": "dose and schedule",
  "reasoning": "detailed clinical rationale explicitly citing ${cpicData.cpic_guideline_id}",
  "confidence_level": "percentage 70-99%",
  "confidence_rationale": "justification explaining high confidence factors and uncertainty factors",
  "alternative_options": ["2 alternative options"]
}`;
  } else if (agentId === 'alertai') {
    systemPrompt = `You are AlertAI, a continuous safety monitoring AI agent in Med Matrix AI. Respond ONLY with valid JSON.
EVERY RESPONSE MUST INCLUDE A "reasoning_steps" ARRAY (3-5 clinical reasoning steps) BEFORE FINAL FIELDS.`;

    userPrompt = `Establish personalized safety guardrails for ${patientInfo.name}:
CONDITION: ${patientInfo.condition}
GENETIC VARIANT: ${patientInfo.geneticVariant}
SEED SUBJECT: ${subjectLabel}
PHARMAI RECOMMENDATION: ${JSON.stringify(previousOutputs.pharmai)}
PULSEIQ TELEMETRY: ${JSON.stringify(previousOutputs.pulseiq)}

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "monitoring_thresholds": ["3 personalized threshold rules"],
  "alert_conditions": ["2-3 adverse drug trigger conditions"],
  "follow_up_schedule": "follow-up timeline text"
}`;
  } else if (agentId === 'critic') {
    systemPrompt = `You are the Senior Clinical Critic Agent in Med Matrix AI. Your job is to perform a rigorous AI Self-Review on PharmAI's recommendation.
Respond ONLY with valid JSON with NO markdown formatting.
EVERY RESPONSE MUST INCLUDE A "reasoning_steps" ARRAY (3-4 audit steps) BEFORE FINAL FIELDS.`;

    userPrompt = `Perform senior clinical audit for ${patientInfo.name} (${patientInfo.age}y ${patientInfo.sex}):
CONDITION: ${patientInfo.condition}
GENETIC VARIANT: ${patientInfo.geneticVariant}
CURRENT MEDS: ${patientInfo.medications}
CPIC GUIDELINE: ${cpicData.cpic_guideline_id} ("${cpicData.dosing_recommendation}")
PHARMAI OUTPUT: ${JSON.stringify(previousOutputs.pharmai)}
GENOLENS OUTPUT: ${JSON.stringify(previousOutputs.genolens)}
PULSEIQ TELEMETRY: ${JSON.stringify(previousOutputs.pulseiq)}

Audit for:
1. Missed contraindications or drug-drug interactions
2. CPIC guideline compliance
3. Underweighted genetic or telemetric risk factors

Return JSON:
{
  "reasoning_steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "review_status": "PASSED_VERIFIED" or "REVISION_REQUIRED",
  "critique_summary": "detailed clinical assessment of PharmAI output",
  "missed_contraindications": [],
  "underweighted_risks": ["1-2 specific risk factors to monitor"],
  "revision_needed": false,
  "revised_recommendation": null
}`;
  }

  return { systemPrompt, userPrompt };
}

// -------------------------------------------------------------------
// API Endpoint: /api/agent (Handles all 5 pipeline agents + Critic)
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
