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
// Load Timeline Data
// -------------------------------------------------------------------
const timelinePath = path.join(__dirname, 'public', 'patient_timeline.json');

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

// -------------------------------------------------------------------
// Helper: Clean Markdown Fences from API JSON Response
// -------------------------------------------------------------------
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

// -------------------------------------------------------------------
// Deterministic mock generators that vary by patient input
// -------------------------------------------------------------------

// Map genetic variant strings to clinical profiles
const VARIANT_PROFILES = {
  'CYP2D6 Poor Metabolizer': {
    enzyme: 'CYP2D6',
    phenotype: 'Poor Metabolizer',
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

// Compute real stats from the timeline data passed in
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

function generateMockOutput(agentId, patientInfo, timelineData, previousOutputs) {
  const name = patientInfo?.name || 'Unknown Patient';
  const age = patientInfo?.age || '?';
  const sex = patientInfo?.sex || '?';
  const weight = patientInfo?.weight || '?';
  const condition = patientInfo?.condition || 'No condition specified';
  const medications = patientInfo?.medications || 'None reported';
  const lifestyle = patientInfo?.lifestyle || 'Not specified';
  const genVariant = patientInfo?.geneticVariant || 'Normal Metabolizer (Wildtype / Extensive)';
  const profile = getVariantProfile(genVariant);
  const stats = computeTimelineStats(timelineData);

  // Seed a simple numeric hash from the patient name + age for variation
  let nameHash = 0;
  for (const ch of (name + String(age))) nameHash = ((nameHash << 5) - nameHash + ch.charCodeAt(0)) | 0;
  const jitter = (base, range) => +(base + (((nameHash & 0xffff) / 0xffff) * range - range / 2)).toFixed(1);

  if (agentId === 'genolens') {
    const risks = profile.riskyDrugs.length > 0
      ? profile.riskyDrugs.map(drug => `${drug}: ${profile.riskDescription.includes(drug.toLowerCase()) ? profile.riskDescription : 'requires dose adjustment or avoidance due to ' + profile.phenotype + ' of ' + profile.enzyme}.`)
      : ['No significant pharmacogenomic drug interaction risks identified for this genotype. Standard dosing is appropriate.'];

    // Add patient-specific medication cross-reference
    if (medications && medications !== 'None reported') {
      const medLower = medications.toLowerCase();
      for (const risky of profile.riskyDrugs) {
        if (medLower.includes(risky.toLowerCase().split(' ')[0].toLowerCase())) {
          risks.unshift(`⚠ CRITICAL: Patient is CURRENTLY prescribed ${risky}, which has ${profile.riskDescription}. Immediate reassessment required.`);
        }
      }
    }

    return {
      metabolizer_status: `${genVariant} — ${profile.phenotype} phenotype confirmed for ${profile.enzyme}`,
      drug_interaction_risks: risks.slice(0, 4),
      summary: `Patient ${name} (${age}y ${sex}, ${weight}) carries ${genVariant}, indicating ${profile.riskDescription}. Current medications (${medications}) must be cross-checked against ${profile.enzyme} substrate tables. ${profile.safeDrugClass} are recommended as the primary therapeutic class.`
    };
  }

  if (agentId === 'pulseiq') {
    if (!stats.baseline || !stats.post) {
      return {
        baseline_summary: 'No baseline data available.',
        post_intervention_summary: 'No post-intervention data available.',
        trend_analysis: 'Insufficient timeline data to compute trends.',
        anomalies_detected: ['Timeline data is empty or missing phase annotations.'],
        summary: 'Unable to perform telemetry analysis — patient_timeline.json appears empty or malformed.'
      };
    }
    return {
      baseline_summary: `Baseline Phase (${stats.baseline.days} days): Mean Resting HR = ${stats.baseline.hr} bpm (range ${stats.baseline.hrMin}–${stats.baseline.hrMax}), Mean Sleep = ${stats.baseline.sleep} h, SpO₂ = ${stats.baseline.spo2}%, Daily Steps = ${stats.baseline.steps.toLocaleString()}.`,
      post_intervention_summary: `Post-Intervention Phase (${stats.post.days} days): Mean Resting HR = ${stats.post.hr} bpm (Δ${stats.hrDelta} bpm), Mean Sleep = ${stats.post.sleep} h (Δ+${stats.sleepDelta} h), SpO₂ = ${stats.post.spo2}%, Daily Steps = ${stats.post.steps.toLocaleString()}.`,
      trend_analysis: `Heart rate shifted by ${stats.hrDelta} bpm between phases. Sleep duration improved by ${stats.sleepDelta} hours. ${parseFloat(stats.hrDelta) < -3 ? 'Exhibits significant autonomic stabilization consistent with effective therapeutic intervention.' : parseFloat(stats.hrDelta) > 3 ? 'Heart rate INCREASED post-intervention — warrants investigation for non-compliance or adverse drug reaction.' : 'Modest heart rate change — may indicate subtherapeutic dosing or delayed response.'}`,
      anomalies_detected: [
        `Baseline HR range ${stats.baseline.hrMin}–${stats.baseline.hrMax} bpm (spread = ${(stats.baseline.hrMax - stats.baseline.hrMin).toFixed(1)} bpm) — ${parseFloat(stats.baseline.hrMax) > 90 ? 'episodes of tachycardia detected' : 'within normal variability'}.`,
        `Post-intervention sleep of ${stats.post.sleep} h — ${parseFloat(stats.post.sleep) < 6 ? 'still below recommended 7-9h threshold, suggesting persistent sleep fragmentation' : 'approaching healthy sleep duration'}.`,
      ],
      summary: `60-day longitudinal telemetry for ${name} shows ${parseFloat(stats.hrDelta) < 0 ? 'a favorable reduction' : 'an increase'} in resting heart rate (${stats.baseline.hr} → ${stats.post.hr} bpm) and ${parseFloat(stats.sleepDelta) > 0 ? 'improved' : 'worsened'} sleep architecture (${stats.baseline.sleep} → ${stats.post.sleep} h) between baseline and post-intervention phases.`
    };
  }

  if (agentId === 'synthai') {
    const geno = previousOutputs?.genolens || {};
    const pulse = previousOutputs?.pulseiq || {};

    return {
      unified_patient_profile: `[Layer 1 — Genomics]: ${geno.metabolizer_status || genVariant}. [Layer 2 — Telemetry]: ${pulse.baseline_summary || 'No telemetry data'} → ${pulse.post_intervention_summary || 'No post-intervention data'}. [Layer 3 — Clinical]: ${name}, ${age}y ${sex}, ${weight}, presenting with ${condition}; current Rx: ${medications}. [Layer 4 — Exposome]: ${lifestyle}.`,
      key_risk_factors: [
        `Pharmacogenomic: ${profile.phenotype} of ${profile.enzyme} — ${profile.riskyDrugs.length > 0 ? 'contraindicated drugs: ' + profile.riskyDrugs.join(', ') : 'no specific contraindications'}.`,
        `Clinical: ${condition}${medications !== 'None reported' ? ' (currently on ' + medications + ')' : ''}.`,
        `Telemetric: ${pulse.trend_analysis || 'No telemetry trends available'}.`,
      ],
      summary: `Multi-layer Information Commons synthesis for ${name} (${age}y ${sex}) confirms ${profile.phenotype} phenotype requiring ${profile.safeDrugClass}. Clinical presentation (${condition.substring(0, 80)}${condition.length > 80 ? '...' : ''}) combined with ${pulse.summary ? 'telemetry showing ' + pulse.summary.substring(0, 100) : 'limited telemetry data'} informs the precision dosing strategy.`
    };
  }

  if (agentId === 'pharmai') {
    const confidence = jitter(profile.confidenceBase, 6);
    return {
      recommended_drug: `${profile.primaryDrug} + ${profile.secondaryDrug}`,
      recommended_dose: profile.primaryDose,
      reasoning: `For ${name} (${age}y, ${genVariant}): ${profile.reasoning} Clinical presentation of "${condition.substring(0, 100)}" and telemetry trajectory support this selection. ${profile.enzyme} ${profile.phenotype} status mandates avoiding ${profile.riskyDrugs.slice(0, 2).join(' and ') || 'standard contraindicated agents'}.`,
      confidence_level: `${Math.max(70, Math.min(99, confidence))}%`,
      alternative_options: profile.alternatives,
    };
  }

  if (agentId === 'alertai') {
    const hrBaseline = stats.baseline ? parseFloat(stats.baseline.hr) : 78;
    const hrUpper = Math.round(hrBaseline + 10);
    const hrLower = Math.max(45, Math.round(hrBaseline - 25));

    return {
      monitoring_thresholds: [
        `Resting Heart Rate: Alert if sustained >${hrUpper} bpm or <${hrLower} bpm over 2 consecutive days (personalized from baseline ${stats.baseline?.hr || '?'} bpm).`,
        `SpO₂: Alert if daily average drops below ${parseFloat(stats.baseline?.spo2 || 97) < 96 ? '93' : '94.5'}%.`,
        `Sleep Duration: Flag if <${Math.max(4, (parseFloat(stats.post?.sleep || 7) - 2)).toFixed(0)} hours for >3 consecutive nights.`,
      ],
      alert_conditions: [
        `${profile.edemaRisk} — specific to ${profile.primaryDrug}.`,
        `${profile.specificAdverse}.`,
      ],
      follow_up_schedule: `Bi-weekly wearable telemetry review at Day 14 and Day 30 post-initiation of ${profile.primaryDrug}; ${profile.enzyme === 'CYP2C9' ? 'INR/coagulation panel at Day 3, 7, 14' : 'comprehensive metabolic panel + renal function'} at 4 weeks. Reassess ${profile.primaryDrug} dose at 6-week mark.`,
    };
  }

  return { summary: 'Agent processing complete.' };
}

// -------------------------------------------------------------------
// Agent Prompts Registry (used when Claude API key is available)
// -------------------------------------------------------------------
function getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs) {
  const systemPrompt = `You are a specialized clinical AI agent in the Med Matrix AI precision medicine platform. You MUST respond with VALID JSON ONLY. Do NOT include any markdown code blocks (no \`\`\`json), no preambles, no conversational text, and no postscript. Output ONLY raw parseable JSON. Your response must be tailored specifically to the patient data provided — do NOT give generic or templated answers.`;

  let userPrompt = '';

  if (agentId === 'genolens') {
    userPrompt = `You are Agent 1 — GenoLens. Analyze this SPECIFIC patient's pharmacogenomic profile.

PATIENT DATA:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age} years, Sex: ${patientInfo.sex}, Weight: ${patientInfo.weight}
- Primary Condition: ${patientInfo.condition}
- Current Medications: ${patientInfo.medications}
- Genetic Variant: ${patientInfo.geneticVariant}
- Lifestyle: ${patientInfo.lifestyle}

TASK: Given that this patient has "${patientInfo.geneticVariant}", analyze:
1. What is their specific metabolizer phenotype and which CYP enzyme is affected?
2. Which of their CURRENT medications (${patientInfo.medications}) interact dangerously with this variant?
3. What drug classes should be AVOIDED and what alternative metabolic pathways can be used?

Your summary MUST mention the patient by name (${patientInfo.name}), their specific variant, and their specific current medications.

Return JSON with EXACTLY these keys:
{
  "metabolizer_status": "the specific variant and phenotype description",
  "drug_interaction_risks": ["3-4 specific clinical risks relevant to THIS patient's variant and medications"],
  "summary": "2-3 sentence summary mentioning ${patientInfo.name} by name and their specific clinical situation"
}`;
  } else if (agentId === 'pulseiq') {
    const baseline = timelineData.filter(d => d.phase === 'baseline');
    const post = timelineData.filter(d => d.phase === 'post_intervention');
    const avg = (arr, key) => arr.length ? (arr.reduce((s, d) => s + d[key], 0) / arr.length).toFixed(1) : 'N/A';

    userPrompt = `You are Agent 2 — PulseIQ. Analyze this patient's ACTUAL 60-day wearable telemetry data.

PATIENT: ${patientInfo.name}, ${patientInfo.age}y ${patientInfo.sex}, Condition: ${patientInfo.condition}

ACTUAL COMPUTED TELEMETRY STATISTICS:
Baseline Phase (${baseline.length} days):
  - Mean Heart Rate: ${avg(baseline, 'heart_rate')} bpm
  - Mean SpO₂: ${avg(baseline, 'spo2')}%
  - Mean Sleep: ${avg(baseline, 'sleep_hours')} hours
  - Mean Steps: ${baseline.length ? Math.round(baseline.reduce((s,d)=>s+d.steps,0)/baseline.length) : 'N/A'}

Post-Intervention Phase (${post.length} days):
  - Mean Heart Rate: ${avg(post, 'heart_rate')} bpm
  - Mean SpO₂: ${avg(post, 'spo2')}%
  - Mean Sleep: ${avg(post, 'sleep_hours')} hours
  - Mean Steps: ${post.length ? Math.round(post.reduce((s,d)=>s+d.steps,0)/post.length) : 'N/A'}

HR Change: ${(parseFloat(avg(post, 'heart_rate')) - parseFloat(avg(baseline, 'heart_rate'))).toFixed(1)} bpm
Sleep Change: ${(parseFloat(avg(post, 'sleep_hours')) - parseFloat(avg(baseline, 'sleep_hours'))).toFixed(1)} hours

TASK: Compare baseline vs post-intervention phases. Identify recovery curves, anomalies, and the clinical significance of the observed changes for a patient with "${patientInfo.condition}".

Return JSON:
{
  "baseline_summary": "summary with actual numbers from above",
  "post_intervention_summary": "summary with actual numbers and deltas",
  "trend_analysis": "clinical interpretation of the trajectory",
  "anomalies_detected": ["2-3 specific findings from the data"],
  "summary": "concise clinical summary for ${patientInfo.name}"
}`;
  } else if (agentId === 'synthai') {
    userPrompt = `You are Agent 3 — SynthAI. Fuse ALL previous agent outputs with the patient's clinical profile.

PATIENT INTAKE DATA:
${JSON.stringify(patientInfo, null, 2)}

GENOLENS OUTPUT (Agent 1):
${JSON.stringify(previousOutputs.genolens, null, 2)}

PULSEIQ OUTPUT (Agent 2):
${JSON.stringify(previousOutputs.pulseiq, null, 2)}

TASK: Create a unified multi-layer Information Commons profile for ${patientInfo.name} that synthesizes:
- Layer 1 (Genomics): Their ${patientInfo.geneticVariant} and its implications
- Layer 2 (Telemetry): The 60-day wearable trends from PulseIQ
- Layer 3 (Clinical): Their condition "${patientInfo.condition}" and current medications "${patientInfo.medications}"
- Layer 4 (Exposome): Their lifestyle "${patientInfo.lifestyle}"

Your output must be specific to THIS patient — not a generic template.

Return JSON:
{
  "unified_patient_profile": "a comprehensive multi-layer profile string",
  "key_risk_factors": ["3-4 risk factors specific to this patient's combined genomic+telemetric+clinical profile"],
  "summary": "summary mentioning ${patientInfo.name} by name"
}`;
  } else if (agentId === 'pharmai') {
    userPrompt = `You are Agent 4 — PharmAI. Generate a precision N-of-1 drug recommendation for this SPECIFIC patient.

PATIENT: ${patientInfo.name}, ${patientInfo.age}y ${patientInfo.sex}, ${patientInfo.weight}
CONDITION: ${patientInfo.condition}
GENETIC VARIANT: ${patientInfo.geneticVariant}
CURRENT MEDICATIONS: ${patientInfo.medications}

SYNTHAI UNIFIED PROFILE:
${JSON.stringify(previousOutputs.synthai, null, 2)}

TASK: Recommend a specific drug and dose that:
1. Is appropriate for "${patientInfo.condition}"
2. Avoids metabolic pathways impaired by "${patientInfo.geneticVariant}"
3. Does not dangerously interact with current medications "${patientInfo.medications}"
4. Accounts for the patient's age (${patientInfo.age}), sex (${patientInfo.sex}), and weight (${patientInfo.weight})

Do NOT recommend generic "standard" therapy. Tailor your recommendation specifically to this patient's pharmacogenomic profile. Your confidence level should reflect how well the available data supports your recommendation.

Return JSON:
{
  "recommended_drug": "specific drug name(s)",
  "recommended_dose": "exact dose and schedule",
  "reasoning": "detailed justification referencing ${patientInfo.name}'s specific variant, condition, and telemetry",
  "confidence_level": "percentage between 70-99%",
  "alternative_options": ["2 alternative drug/dose options"]
}`;
  } else if (agentId === 'alertai') {
    userPrompt = `You are Agent 5 — AlertAI. Establish personalized safety monitoring for this patient.

PATIENT: ${patientInfo.name}, ${patientInfo.age}y, Condition: ${patientInfo.condition}
GENETIC VARIANT: ${patientInfo.geneticVariant}

PHARMAI RECOMMENDATION:
${JSON.stringify(previousOutputs.pharmai, null, 2)}

PULSEIQ TELEMETRY BASELINE:
${JSON.stringify(previousOutputs.pulseiq, null, 2)}

TASK: Create monitoring thresholds personalized to ${patientInfo.name}'s baseline telemetry values, the specific drug recommended by PharmAI, and their pharmacogenomic risk profile. Alert conditions should be specific to the recommended drug's known adverse effects.

Return JSON:
{
  "monitoring_thresholds": ["3 personalized physiological threshold rules using actual baseline values"],
  "alert_conditions": ["2-3 adverse drug reaction triggers specific to the recommended drug"],
  "follow_up_schedule": "timeline referencing the specific drug and patient"
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

  // Build the prompt regardless of mode (for debug panel)
  const { systemPrompt, userPrompt } = getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs);

  if (!anthropicKey) {
    // Return patient-specific simulated response
    const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
    return res.json({
      success: true,
      data: mockData,
      mode: 'simulated',
      debug: { systemPrompt, userPrompt },
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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Claude API Warning] Status ${response.status}: ${errText}. Using fallback.`);
      const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
      return res.json({ success: true, data: mockData, mode: 'simulated_fallback', warning: errText, debug: { systemPrompt, userPrompt } });
    }

    const resJson = await response.json();
    const rawContent = resJson.content?.[0]?.text || '';
    const cleanedText = cleanJsonResponse(rawContent);

    try {
      const parsedData = JSON.parse(cleanedText);
      return res.json({ success: true, data: parsedData, mode: 'live_claude', debug: { systemPrompt, userPrompt } });
    } catch (parseErr) {
      console.warn('[JSON Parse Warning] Using fallback.', cleanedText);
      const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
      return res.json({ success: true, data: mockData, mode: 'simulated_parse_fallback', debug: { systemPrompt, userPrompt } });
    }
  } catch (err) {
    console.error('[Agent Server Error]', err);
    const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
    return res.json({ success: true, data: mockData, mode: 'simulated_error_fallback', error: err.message, debug: { systemPrompt, userPrompt } });
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
