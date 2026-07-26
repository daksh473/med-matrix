import React, { useState, useEffect } from 'react';
import AgentCard from './AgentCard';
import PayloadModal from './PayloadModal';
import { ArrowLeft, Play, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

const AGENTS = [
  {
    id: 'genolens',
    step: 1,
    badge: 'Pharmacogenomics',
    title: 'GenoLens Agent',
    description: 'Analyzes patient genetic variant markers to evaluate hepatic CYP enzyme clearance rates, drug metabolism phenotypes, and inherent interaction risks.',
  },
  {
    id: 'pulseiq',
    step: 2,
    badge: 'Continuous Telemetry',
    title: 'PulseIQ Agent',
    description: 'Processes the full 60-day wearable dataset (heart rate, SpO2, sleep, steps) comparing baseline vs post-intervention phases to extract trajectory curves and anomalies.',
  },
  {
    id: 'synthai',
    step: 3,
    badge: 'Information Commons',
    title: 'SynthAI Agent',
    description: 'Fuses genomic clearance defects, continuous telemetry trends, clinical symptoms, and exposome data into a multi-layer GIS-style Information Commons profile.',
  },
  {
    id: 'pharmai',
    step: 4,
    badge: 'N-of-1 Precision Dosing',
    title: 'PharmAI Agent',
    description: 'Selects the optimal drug and precise dosage regimen that maximizes therapeutic efficacy while completely bypassing genomic clearance defects.',
  },
  {
    id: 'alertai',
    step: 5,
    badge: 'Continuous Guardrails',
    title: 'AlertAI Agent',
    description: 'Establishes continuous telemetry safety thresholds, adverse event warning triggers, and bi-weekly follow-up review schedules.',
  },
];

const THINKING_LOGS = {
  genolens: [
    'Parsing pharmacogenomic variant markers...',
    'Cross-referencing CPIC & PharmGKB guidelines...',
    'Evaluating hepatic CYP2D6 / CYP2C19 clearance kinetics...',
    'Formulating drug interaction risk summary...'
  ],
  pulseiq: [
    'Ingesting 60-day continuous wearable telemetry dataset...',
    'Computing baseline (Days 1-30) vs post-intervention statistics...',
    'Modeling 18-day exponential heart rate recovery curve...',
    'Detecting nocturnal sleep fragmentation anomalies...'
  ],
  synthai: [
    'Initiating Information Commons GIS multi-layer fusion...',
    'Overlaying Layer 1 (Genomics) with Layer 2 (Telemetry)...',
    'Synthesizing Layer 3 (Clinical Symptoms) and Layer 4 (Exposome)...',
    'Generating unified precision patient profile...'
  ],
  pharmai: [
    'Evaluating candidate antihypertensive & cardiovascular molecules...',
    'Filtering for non-CYP2D6 metabolic clearance pathways...',
    'Calculating N-of-1 precision dose (Amlodipine + Lisinopril)...',
    'Verifying therapeutic index and confidence score...'
  ],
  alertai: [
    'Ingesting PharmAI recommendation & PulseIQ baseline metrics...',
    'Deriving continuous resting heart rate and SpO2 safety bounds...',
    'Establishing adverse event alert criteria...',
    'Finalizing bi-weekly clinical follow-up protocol...'
  ]
};

export default function AgentPipeline({
  patientInfo,
  timelineData,
  onComplete,
  onBackToIntake,
}) {
  // States per agent: 'waiting' | 'thinking' | 'complete' | 'error'
  const [agentStates, setAgentStates] = useState({
    genolens: 'waiting',
    pulseiq: 'waiting',
    synthai: 'waiting',
    pharmai: 'waiting',
    alertai: 'waiting',
  });

  const [agentOutputs, setAgentOutputs] = useState({});
  const [thinkingLogs, setThinkingLogs] = useState({});
  const [activeModal, setActiveModal] = useState(null); // { agentTitle, payload }
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // Automatically start Agent 1 on mount
  useEffect(() => {
    runPipeline();
  }, []);

  const runPipeline = async () => {
    setIsPipelineRunning(true);
    setAgentStates({
      genolens: 'waiting',
      pulseiq: 'waiting',
      synthai: 'waiting',
      pharmai: 'waiting',
      alertai: 'waiting',
    });
    setAgentOutputs({});

    // Execute sequentially
    const outputs = {};

    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i];
      const agentId = agent.id;

      // Set to thinking
      setAgentStates(prev => ({ ...prev, [agentId]: 'thinking' }));

      // Ticker log animation
      const logs = THINKING_LOGS[agentId] || ['Processing agent payload...'];
      for (let l = 0; l < logs.length; l++) {
        setThinkingLogs(prev => ({ ...prev, [agentId]: logs[l] }));
        await new Promise(r => setTimeout(r, 600));
      }

      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            patientInfo,
            timelineData,
            previousOutputs: outputs,
          }),
        });

        const resData = await response.json();

        if (resData && resData.success) {
          outputs[agentId] = resData.data;
          setAgentOutputs(prev => ({ ...prev, [agentId]: resData.data }));
          setAgentStates(prev => ({ ...prev, [agentId]: 'complete' }));
        } else {
          setAgentStates(prev => ({ ...prev, [agentId]: 'error' }));
          setIsPipelineRunning(false);
          return;
        }
      } catch (err) {
        console.error(`Error in agent ${agentId}:`, err);
        setAgentStates(prev => ({ ...prev, [agentId]: 'error' }));
        setIsPipelineRunning(false);
        return;
      }
    }

    setIsPipelineRunning(false);
    onComplete(outputs);
  };

  const retryAgent = (agentId) => {
    runPipeline();
  };

  const handleInspect = (title, payload) => {
    setActiveModal({ title, payload });
  };

  const isAllComplete = Object.values(agentStates).every(s => s === 'complete');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBackToIntake}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Dossier</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={runPipeline}
            disabled={isPipelineRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-400 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Pipeline</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Patient: <strong className="text-white">{patientInfo.name}</strong> ({patientInfo.geneticVariant.split(' ')[0]})
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-mono font-semibold uppercase mb-1.5">
            <Sparkles className="w-3 h-3" /> Sequential 5-Agent Chain Execution
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Agent Decision Pipeline</h2>
          <p className="text-xs text-slate-400 mt-1">
            Passing context sequentially from GenoLens $\rightarrow$ PulseIQ $\rightarrow$ SynthAI $\rightarrow$ PharmAI $\rightarrow$ AlertAI
          </p>
        </div>

        {isAllComplete && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>All 5 Agents Complete</span>
          </div>
        )}
      </div>

      {/* Vertical Pipeline Flow */}
      <div className="relative pt-2">
        {AGENTS.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStates[agent.id]}
            output={agentOutputs[agent.id]}
            thinkingLog={thinkingLogs[agent.id]}
            onRetry={() => retryAgent(agent.id)}
            onInspectPayload={handleInspect}
            isLast={index === AGENTS.length - 1}
          />
        ))}
      </div>

      {/* JSON Viewer Modal */}
      {activeModal && (
        <PayloadModal
          agentName={activeModal.title}
          payload={activeModal.payload}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
