# Med Matrix AI — Precision Medicine N-of-1 Decision Support System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2019-cyan)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express%205-green)](https://expressjs.com/)
[![Claude API](https://img.shields.io/badge/AI-Claude%20Sonnet%203.5-purple)](https://www.anthropic.com/)

**Med Matrix AI** is a personalized precision medicine decision platform built for hackathon demonstrations and clinical decision support prototyping. It processes a patient's multi-modal clinical history and 60-day continuous wearable telemetry through a sequential chain of 5 specialized AI agents to deliver N-of-1 drug and dosage recommendations.

---

## 🌟 Key Architectural Features

### 1. 🧬 Sequential 5-Agent AI Pipeline
The platform chains 5 specialized agents, passing accumulated structured context from one agent to the next:

1. 🧬 **Agent 1 — GenoLens (Pharmacogenomics & Clearance Risk)**: Evaluates hepatic CYP enzyme variants (e.g., *CYP2D6 Poor Metabolizer*, *CYP2C19 Rapid Metabolizer*) and identifies drug clearance defects and accumulation risks.
2. 🫀 **Agent 2 — PulseIQ (Longitudinal Telemetry Analysis)**: Ingests 60 continuous days of wearable metrics (`heart_rate`, `spo2`, `sleep_hours`, `steps`), comparing baseline (Days 1–30) against post-intervention (Days 31–60) recovery curves.
3. 🌐 **Agent 3 — SynthAI (Information Commons Multi-Layer Fusion)**: Fuses genomics, continuous telemetry, clinical symptoms, and exposome/lifestyle data into a GIS-style multi-layered patient model.
4. 💊 **Agent 4 — PharmAI (N-of-1 Precision Dosing)**: Formulates an optimal drug and dosage recommendation that achieves therapeutic efficacy while completely bypassing impaired genomic metabolic pathways.
5. 🔔 **Agent 5 — AlertAI (Continuous Guardrails & Safety Thresholds)**: Establishes personalized safety threshold bounds, adverse drug reaction warning triggers, and bi-weekly clinical review protocols.

### 2. 📊 Multi-Modal Grounded Telemetry Data
The 60-day simulated patient timeline (`fitbit_patient_timeline.json`) is grounded in real-world physiological datasets:
- **Heart Rate & Sleep**: Fitbit Fitness Tracker Dataset (Fitabase export, 31-day continuous wearable recording).
- **Pulse Oximetry ($\text{SpO}_2$)**: BIDMC PPG & Respiration Dataset (PhysioNet / Beth Israel Deaconess Medical Center, 25,365 clinical oximetry readings across 53 subjects).
- **Activity Level**: Single Chest-Mounted Accelerometer HAR Dataset (1,801,306 samples across 15 participants).

### 3. 🖥️ Demo-Ready Web Application
- **Interactive Intake Dossier**: Pre-populated with 3 quick-fill preset patient profiles (**Patient A**, **Patient B**, **Patient C**) for 1-click hackathon pitch demos.
- **60-Day Telemetry Vector Chart**: Built with Recharts, featuring interactive metric tabs and a dynamic vertical reference line marking the baseline vs. post-intervention boundary.
- **Live Agent Execution Pipeline**: Animated state cards (*Waiting* $\rightarrow$ *Thinking* shimmer $\rightarrow$ *Complete*), expandable JSON payload inspection, and auto-fallback execution mode for reliable offline/pitch presentation.
- **Hackathon Payoff Dashboard**: High-contrast summary dashboard showcasing the recommended drug & dose, confidence level, genomic clearance bypass validation tag, clinical rationale bullets, and continuous alert thresholds.

---

## 📁 Repository Structure

```text
med-matrix/
├── webapp/                 # Full-Stack Web Application (React + Express)
│   ├── server.js           # Node/Express API Proxy & Fallback Engine
│   ├── src/
│   │   ├── components/     # IntakeForm, TelemetryChart, AgentPipeline, FinalDashboard, PayloadModal
│   │   ├── data/           # Grounded 60-day patient_timeline.json
│   │   ├── App.jsx         # Main Multi-Screen Orchestrator
│   │   └── index.css       # Clinical Dark Theme & Glassmorphism Styling
│   ├── vite.config.js      # Vite Configuration with API Proxy
│   └── package.json
├── pulse_iq/               # PulseIQ Data Processing Pipeline & Seed Profiles
│   ├── data/               # fitbit_patient_timeline.json, seed_profile_v2.json, spo2_seed.json
│   ├── output/             # 3-Panel Verification Plot Artifacts
│   └── scripts/            # fitbit_pipeline.py (7-Step Python Extraction Pipeline)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (v24 recommended)
- **Python**: 3.9+ (with `pandas`, `numpy`, `matplotlib`)

### 1. Web Application Setup & Launch

```bash
# Navigate to webapp directory
cd webapp

# Install dependencies
npm install

# Build production assets
npm run build

# Start the Express server
node server.js
```

Open your browser and navigate to **`http://localhost:3001`**.

> **Note**: If `ANTHROPIC_API_KEY` is set in your environment, the server will proxy live requests to the Claude 3.5 Sonnet API (`https://api.anthropic.com/v1/messages`). If no key is present, the app automatically runs in simulated fallback mode, providing realistic responses for seamless hackathon pitching.

---

### 2. Python Data Pipeline (Optional)

To inspect raw datasets or regenerate seed statistics:

```bash
# Run the 7-step multi-modal extraction pipeline
python pulse_iq/scripts/fitbit_pipeline.py

# Fast re-generation of synthetic timelines:
python pulse_iq/scripts/fitbit_pipeline.py --seed-only
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
