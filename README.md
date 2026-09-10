# PROSIS — Enterprise AI Operating System

> **Prosis** is not a chatbot or generic SaaS dashboard. It is an intelligent company operating system connecting business applications, voice and multimodal channels, persistent memory, and human-in-the-loop task governance into a unified interface.

---

## Architectural Highlights

```
Prosis OS
├── Core Engine (@prosis/orchestrator)
│   ├── Agent Loop & Dynamic Multi-Turn Planning
│   ├── Approval Interceptor & Decision Engine
│   └── Immutable Audit Trail & Observability Ledger
├── Extensibility & Registry Layer
│   ├── Product Registry (@prosis/sdk)
│   └── Tool Registry & Schema Guards (@prosis/tools)
├── Memory & Intelligence
│   ├── 5-Tier Scoped Memory Engine (@prosis/memory)
│   └── Scoped Enterprise Knowledge & RAG (@prosis/knowledge)
├── Integrated Product Ecosystem
│   ├── Seatbooking SaaS (@prosis/product-seatbooking)
│   └── Future Products (Workforce, Menu, Marketing, Analytics)
└── Futuristic Operating UI (@prosis/ui)
    ├── Living WebGL / Three.js 8-State AI Core
    ├── Low-Latency Voice Duplex with Instant Barge-In
    ├── Inline Consequence-Aware Approval Cards
    └── Real-time Telemetry & Memory Pruning Dock
```

---

## 8 Reactive AI Core States

Prosis features an **AI Core** with subtle, organic, and mathematically computed WebGL geometry transitions:

1. **`IDLE`**: Cyan/blue breathing pulse (period ~4s), calm celestial rotation.
2. **`LISTENING`**: Real-time microphone audio reactivity, acoustic intake waves.
3. **`THINKING`**: High-velocity internal neural rotation, synaptic lattice sparks.
4. **`EXECUTING`**: Orbital data streaks and kinetic execution pulses.
5. **`SPEAKING`**: Harmonic expansion waves and speech synthesis acoustic ripples.
6. **`WAITING_FOR_APPROVAL`**: Amber halo heartbeat cadence, execution suspended.
7. **`SUCCESS`**: Radiant emerald/cyan bloom and equilibrium settling.
8. **`ERROR`**: Ruby damping shockwave.

---

## Strict Tool Authorization Contract

The AI orchestrator **never** receives direct or unrestricted database access.

```
User Directive 
  ──> Prosis AI Orchestrator 
  ──> Tool Definition 
  ──> RBAC Authorization 
  ──> Schema Validation (Zod) 
  ──> Approval Interceptor (if destructive/external/financial)
  ──> Business Service API 
  ──> Database
```

---

## 5 Persistent Memory Tiers

1. **Conversation Memory**: Immediate contextual thread state.
2. **Working / Task Memory**: Active multi-step intent & staged operational data.
3. **User Preferences**: Briefing style, formatting preferences, thresholds.
4. **Company Memory**: Business operating policies, refund protocols, cancellation rules.
5. **Product Context**: Active tenant configurations and connected services.

Users can inspect and delete/prune any memory record directly from the **Telemetry Dock**.

---

## Voice Duplex & Instant Barge-In

- **Continuous Streaming**: Low-latency speech recognition (Web Speech API) and energy-level analysis (Web Audio API).
- **Instant Interruption (Barge-In)**: Speaking or typing while Prosis is vocalizing immediately cancels voice synthesis and transitions back to `LISTENING`.
- **Voice Sanction**: Approvals can be granted directly via voice directives (*"Yes, proceed"*, *"Do it"*, or *"Cancel"*).

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Scenario Verification Test Suite
```bash
npm test
```
Tests all 8 core product scenarios:
- Product registry registration
- Tool registry schemas
- Briefing: *"Prosis, what's happening today?"*
- Anomaly detection: *"Show me the restaurants with declining bookings."*
- Campaign staging: *"Prepare emails for those restaurants."*
- Human-in-the-loop authorization: *"Yes, proceed"*
- Destructive void action interception: *"Cancel John Smith's reservation"*
- User memory deletion & audit trail logging

### 3. Launch the Operating System
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm start
```

