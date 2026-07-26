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
  // Remove markdown code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

// -------------------------------------------------------------------
// Fallback Mock Generators (for offline/demo mode without API key)
// -------------------------------------------------------------------
function generateMockOutput(agentId, patientInfo, timelineData, previousOutputs) {
  const name = patientInfo?.name || "Marcus Vance";
  const genVariant = patientInfo?.geneticVariant || "CYP2D6 Poor Metabolizer (CYP2D6 *4/*4)";
  
  if (agentId === 'genolens') {
    return {
      metabolizer_status: genVariant,
      drug_interaction_risks: [
        "Severe clearance defect for CYP2D6 substrate beta-blockers (e.g., Metoprolol, Carvedilol), increasing AUC by 300-500% and risking profound bradycardia/heart block.",
        "Impaired bioactivation of codeine/tramadol prodrugs leading to analgesic resistance.",
        "Mild secondary clearance delay for CYP2C19 & CYP2D6 pathway co-substrates."
      ],
      summary: `Patient ${name} exhibits complete loss-of-function for the CYP2D6 metabolic pathway. Standard doses of CYP2D6-cleared cardiovascular medications will accumulate to toxic plasma concentrations. Alternative metabolic pathways (e.g. CYP3A4, renal excretion, or ARBs/CCBs) are strictly required.`
    };
  }

  if (agentId === 'pulseiq') {
    const baselineHR = 84.6;
    const postHR = 78.4;
    const baselineSleep = 6.1;
    const postSleep = 7.2;
    return {
      baseline_summary: `Baseline Phase (Days 1-30): Mean Resting HR = ${baselineHR} bpm (elevated sympathetic tone), Mean Sleep = ${baselineSleep} h (fragmented), SpO2 = 96.7% (stable), Daily Steps = 10,450.`,
      post_intervention_summary: `Post-Intervention Phase (Days 31-60): Mean Resting HR decreased to ${postHR} bpm (-6.2 bpm reduction), Mean Sleep improved to ${postSleep} h (+1.1 h gain), SpO2 = 96.8%, Daily Steps = 10,890.`,
      trend_analysis: "Exhibits a classic 18-day exponential decay in resting heart rate starting Day 31 post-intervention, stabilizing at normal baseline (77-78 bpm). Sleep architecture shows reduced night-to-night variance and 18% duration recovery.",
      anomalies_detected: [
        "Day 14 transient HR spike to 88.2 bpm following acute sleep reduction (5.3 h).",
        "Day 42 isolated SpO2 dip to 96.0%, spontaneously resolving to 97.2% within 24 hours."
      ],
      summary: "Longitudinal 60-day wearable telemetry demonstrates high physiological responsiveness to therapeutic intervention, with marked autonomic stabilization and reduction in nocturnal heart rate variability."
    };
  }

  if (agentId === 'synthai') {
    const geno = previousOutputs.genolens || {};
    const pulse = previousOutputs.pulseiq || {};
    return {
      unified_patient_profile: `Information Commons Multi-Layer Profile: [Genomics]: ${geno.metabolizer_status || genVariant} | [Telemetry]: Resting HR 84.6 -> 78.4 bpm recovery, Sleep 6.1 -> 7.2 h | [Clinical]: ${patientInfo?.condition || "Refractory Stage 2 Hypertension"} | [Exposome]: ${patientInfo?.lifestyle || "High stress, moderate activity"}.`,
      key_risk_factors: [
        "Contraindication for CYP2D6-cleared beta-blockers due to poor metabolizer phenotype.",
        "Elevated baseline sympathetic autonomic tone with resting tachycardia.",
        "Co-occurring sleep deprivation accentuating morning blood pressure surges."
      ],
      summary: `Layered GIS-style synthesis confirms ${name} is a high-responder to non-CYP2D6 targeted antihypertensives. Fusing genomic clearance defects with continuous telemetry mandates avoiding Metoprolol while optimizing vascular resistance.`
    };
  }

  if (agentId === 'pharmai') {
    return {
      recommended_drug: "Amlodipine Besylate 5 mg + Lisinopril 5 mg",
      recommended_dose: "Amlodipine 5 mg PO QD (Morning) + Lisinopril 5 mg PO QD (Morning)",
      reasoning: `Amlodipine is metabolized via CYP3A4, completely bypassing the deficient CYP2D6 pathway identified by GenoLens. Combined with Lisinopril (eliminated unchanged via renal excretion), this dual regimen addresses refractory hypertension, lowers peripheral vascular resistance, and accounts for the 60-day telemetry recovery observed by PulseIQ without risk of toxic drug accumulation.`,
      confidence_level: "94.8%",
      alternative_options: [
        "Valsartan 80 mg PO QD (Angiotensin II Receptor Blocker - CYP2C9 non-sensitive)",
        "Diltiazem ER 180 mg PO QD (Non-dihydropyridine CCB - CYP3A4 pathway)"
      ]
    };
  }

  if (agentId === 'alertai') {
    return {
      monitoring_thresholds: [
        "Resting Heart Rate: Alert if sustained > 88 bpm or < 52 bpm over 2 consecutive days",
        "SpO2: Alert if daily average drops below 94.5%",
        "Sleep Duration: Flag if sleep duration < 5.0 hours for > 3 consecutive nights"
      ],
      alert_conditions: [
        "Development of lower extremity pedal edema secondary to dihydropyridine calcium channel blockade",
        "Acute serum creatinine elevation > 30% or persistent dry cough from Lisinopril"
      ],
      follow_up_schedule: "Bi-weekly wearable telemetry trend review at Day 14 and Day 30; comprehensive renal function & electrolyte panel at 4 weeks."
    };
  }

  return { summary: "Agent processing complete." };
}

// -------------------------------------------------------------------
// Agent Prompts Registry
// -------------------------------------------------------------------
function getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs) {
  const systemPrompt = "You are a specialized clinical AI agent in the Med Matrix AI precision medicine platform. You MUST respond with VALID JSON ONLY. Do NOT include any markdown code blocks (no ```json), no preambles, no conversational text, and no postscript. Output ONLY raw parseable JSON.";

  let userPrompt = "";

  if (agentId === 'genolens') {
    userPrompt = `Agent 1 — GenoLens (Pharmacogenomics & Metabolism Risk Analysis)
Patient Info:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age}, Sex: ${patientInfo.sex}, Weight: ${patientInfo.weight}
- Condition/Symptoms: ${patientInfo.condition}
- Current Medications: ${patientInfo.medications}
- Genetic Variant: ${patientInfo.geneticVariant}
- Lifestyle Notes: ${patientInfo.lifestyle}

Analyze this genetic variant in relation to common cardiovascular/neurological drugs.
Return a JSON object with EXACTLY these keys:
{
  "metabolizer_status": "string description",
  "drug_interaction_risks": ["array of specific clinical risks"],
  "summary": "concise 2-3 sentence clinical summary"
}`;
  } else if (agentId === 'pulseiq') {
    const baselineData = timelineData.filter(d => d.phase === 'baseline');
    const postData = timelineData.filter(d => d.phase === 'post_intervention');
    
    userPrompt = `Agent 2 — PulseIQ (Longitudinal Wearable Telemetry & Phase Trend Analysis)
Patient 60-Day Telemetry Dataset Summary:
- Baseline Phase (${baselineData.length} days): Mean HR = ${(baselineData.reduce((a,b)=>a+b.heart_rate,0)/baselineData.length).toFixed(1)} bpm, Mean SpO2 = ${(baselineData.reduce((a,b)=>a+b.spo2,0)/baselineData.length).toFixed(1)}%, Mean Sleep = ${(baselineData.reduce((a,b)=>a+b.sleep_hours,0)/baselineData.length).toFixed(1)} h, Mean Steps = ${Math.round(baselineData.reduce((a,b)=>a+b.steps,0)/baselineData.length)}.
- Post-Intervention Phase (${postData.length} days): Mean HR = ${(postData.reduce((a,b)=>a+b.heart_rate,0)/postData.length).toFixed(1)} bpm, Mean SpO2 = ${(postData.reduce((a,b)=>a+b.spo2,0)/postData.length).toFixed(1)}%, Mean Sleep = ${(postData.reduce((a,b)=>a+b.sleep_hours,0)/postData.length).toFixed(1)} h, Mean Steps = ${Math.round(postData.reduce((a,b)=>a+b.steps,0)/postData.length)}.

Analyze the shift between baseline and post_intervention phases across heart_rate, spo2, steps, and sleep_hours. Identify recovery curves and anomalies.
Return a JSON object with EXACTLY these keys:
{
  "baseline_summary": "string summary",
  "post_intervention_summary": "string summary",
  "trend_analysis": "detailed trajectory description",
  "anomalies_detected": ["array of specific anomalies/spikes"],
  "summary": "concise clinical summary of telemetry trends"
}`;
  } else if (agentId === 'synthai') {
    userPrompt = `Agent 3 — SynthAI (Information Commons Multi-Layer Patient Profile Fusion)
Inputs:
- Patient Intake: ${JSON.stringify(patientInfo)}
- GenoLens Output: ${JSON.stringify(previousOutputs.genolens)}
- PulseIQ Output: ${JSON.stringify(previousOutputs.pulseiq)}

Fuse genomics, 60-day telemetry, clinical symptoms, and exposome into a single Information Commons GIS-style layered profile.
Return a JSON object with EXACTLY these keys:
{
  "unified_patient_profile": "string describing Layer 1 (Genomics), Layer 2 (Telemetry), Layer 3 (Clinical), Layer 4 (Exposome)",
  "key_risk_factors": ["array of merged risk factors"],
  "summary": "concise profile summary"
}`;
  } else if (agentId === 'pharmai') {
    userPrompt = `Agent 4 — PharmAI (N-of-1 Precision Dosing & Drug Selection)
Input:
- SynthAI Unified Profile: ${JSON.stringify(previousOutputs.synthai)}

Formulate a precise N-of-1 drug and dosage recommendation that respects the patient's genomic clearance defect and telemetry trajectory.
Return a JSON object with EXACTLY these keys:
{
  "recommended_drug": "specific drug name",
  "recommended_dose": "exact dose and administration schedule",
  "reasoning": "detailed clinical mechanism justification",
  "confidence_level": "percentage string (e.g. 94.5%)",
  "alternative_options": ["array of 2 alternative drugs/doses"]
}`;
  } else if (agentId === 'alertai') {
    userPrompt = `Agent 5 — AlertAI (Continuous Guardrails & Safety Thresholds)
Inputs:
- PharmAI Recommendation: ${JSON.stringify(previousOutputs.pharmai)}
- PulseIQ Telemetry Baseline: ${JSON.stringify(previousOutputs.pulseiq)}

Establish continuous monitoring guardrails, alert criteria, and follow-up plan tailored to this recommendation.
Return a JSON object with EXACTLY these keys:
{
  "monitoring_thresholds": ["array of physiological threshold rules"],
  "alert_conditions": ["array of adverse drug reaction or deterioration triggers"],
  "follow_up_schedule": "string describing follow-up timeline"
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

  if (!anthropicKey) {
    // Return realistic fallback response
    const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
    return res.json({ success: true, data: mockData, mode: 'simulated' });
  }

  try {
    const { systemPrompt, userPrompt } = getAgentPrompts(agentId, patientInfo, timelineData, previousOutputs);

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
      console.warn(`[Claude API Warning] Status ${response.status}: ${errText}. Using fallback generator.`);
      const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
      return res.json({ success: true, data: mockData, mode: 'simulated_fallback', warning: errText });
    }

    const resJson = await response.json();
    const rawContent = resJson.content?.[0]?.text || '';
    const cleanedText = cleanJsonResponse(rawContent);

    try {
      const parsedData = JSON.parse(cleanedText);
      return res.json({ success: true, data: parsedData, mode: 'live_claude' });
    } catch (parseErr) {
      console.warn('[JSON Parse Warning] Stripped text was not valid JSON. Using fallback.', cleanedText);
      const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
      return res.json({ success: true, data: mockData, mode: 'simulated_parse_fallback' });
    }
  } catch (err) {
    console.error('[Agent Server Error]', err);
    const mockData = generateMockOutput(agentId, patientInfo, timelineData, previousOutputs);
    return res.json({ success: true, data: mockData, mode: 'simulated_error_fallback', error: err.message });
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
