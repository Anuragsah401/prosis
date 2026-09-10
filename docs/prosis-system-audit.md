# Prosis System Audit & Architecture Report

**Document Date:** September 10, 2026  
**Status:** Audit Complete — Phase 2 Report  
**Target:** Prosis Enterprise Intelligence Operating System

---

## 1. Current Architecture

```
User (Browser Microphone & UI)
   │
   ▼
[Web Audio API (getUserMedia + AnalyserNode VAD)]
   │
   ▼
[Web Speech API (webkitSpeechRecognition)]
   │ (Interim & Final Transcripts in browser memory)
   ▼
[useProsisSession Hook (Client Component)]
   │
   ▼  POST /api/v1/chat/stream  (Standard REST fetch, NOT SSE/WebSocket)
[Next.js App Router Route Handler]
   │
   ▼
[ProsisAgent.processInput() (Single in-memory singleton)]
   │
   ├── Step 1: Intent Analysis & Regex Matching (AgentRouter.analyze)
   ├── Step 2: In-Memory Memory Retrieval (Memory.retrieveRelevant)
   ├── Step 3: In-Memory Knowledge Retrieval (Knowledge.query)
   ├── Step 4: Rule-based branching if/else ladder
   │           └── Synthetic workflow execution (e.g. executeDecliningRestaurantsWorkflow)
   └── Step 5: Tool Execution via ToolRegistry
               │
               ▼
       [Seatbooking Database Mock (In-Memory JavaScript Objects)]
   │
   ▼  Returns static JSON { replyText, spokenText, coreState, ... }
[useProsisSession Hook receives JSON]
   │
   ├── UI updates turns state
   └── window.speechSynthesis.speak(spokenText) (Browser local TTS)
```

### Architectural Pipeline Breakdown:
- **Frontend Framework:** Next.js 16.3.4 (App Router) + React 19.3.0 + Tailwind CSS 3.4 + Three.js 0.186 (3D AI Core) + Lucide React.
- **Backend Framework:** Next.js Route Handlers (`/api/v1/...`).
- **Package Manager:** `npm`.
- **Database / Storage:** Purely in-memory JavaScript objects/maps (`SeatbookingDatabase`, `MemoryStore`, `AuditStore`). No external persistent database (no PostgreSQL, SQLite, or Redis).
- **Tool Layer:** `ToolRegistry` with Zod schemas for Seatbooking, Workforce, Marketing, Menu, and Analytics. Handlers query the in-memory mock datasets.

---

## 2. What is Working

1. **Next.js Production Build & SSR**: The application builds cleanly with `next build --webpack` with 0 TypeScript compilation errors across all 18 routes.
2. **Three.js AI Core Visual (`AICoreVisual.tsx`)**:
   - Organically reacts to state transitions (`IDLE`, `LISTENING`, `THINKING`, `EXECUTING`, `SPEAKING`, `WAITING_FOR_APPROVAL`, `SUCCESS`, `ERROR`).
   - Vertex shader noise deformation and counter-rotating orbital rings respond to audio amplitude.
   - Respects `prefers-reduced-motion` media queries.
3. **Contextual Dynamic Surfaces**:
   - `AnalyticsSurfaceCard.tsx`: Correctly renders venue capacity pacing, trends, and projected revenue.
   - `ComparisonSurfaceCard.tsx`: Renders side-by-side venue matrices with root-cause diagnostics.
   - `EmailComposerSurfaceCard.tsx`: Staged draft editing with consequence disclosures.
   - `ApprovalCard.tsx` & `TaskProgressCard.tsx`: Clean UI representation for approvals and multi-step tasks.
4. **Tool Definitions & Registry (`ToolRegistry`)**:
   - 22 tools registered with valid input/output Zod schemas and permission metadata.
5. **Scenario Verification Test Suite (`test/scenario-verification.ts`)**:
   - 18 scenarios testing capability routing, anomaly detection, epistemic trust categorization, and autonomy levels against the in-memory engine.

---

## 3. What is Broken

1. **No Realtime Stream despite `/api/v1/chat/stream` naming**:
   - `/api/v1/chat/stream/route.ts` is named "stream", but uses standard `NextResponse.json()` request-response blocking. There is no chunked transfer, Server-Sent Events (SSE), or WebRTC data channel.
2. **Web Speech API Fragility & Platform Incompatibility**:
   - Browser `webkitSpeechRecognition` is non-standard, unavailable in Firefox, behaves inconsistently on iOS Safari, and requires Google network STT roundtrips in Chromium.
   - Speech synthesis (`window.speechSynthesis`) is robotic, pauses unpredictably on mobile browsers, and cannot stream low-latency audio chunks.
3. **Voice State De-synchronization & Manual Overrides**:
   - `useProsisSession.ts` manually forces `voice.setManualState("THINKING")` before making a REST fetch, and manually resets to `IDLE` or `SPEAKING` on response.
   - If the network drops or the server errors, the voice state becomes desynchronized from the actual transport.
4. **Hardcoded Substring Bugs**:
   - E.g., `agent-router.ts` checked `normalized.includes("aura")`, which accidentally matched "restaurant" (`rest-aura-nt`), hijacking unrelated queries into Aura Rooftop Lounge until patched with word boundaries.
5. **No Network Error Recovery**:
   - If `/api/v1/chat/stream` times out or fails, the voice session abruptly terminates or gets stuck in `ERROR` without an automated reconnect or fallback strategy.

---

## 4. What is Fake

The following capabilities appear to be powered by an advanced foundation AI model, but are actually simulated or hardcoded:

1. **AI Natural Language Reasoning (100% Fake)**:
   - There is **NO LLM connected** (no OpenAI, no Anthropic, no Gemini, no local Ollama).
   - All "reasoning" is a static regex and keyword matcher inside `AgentRouter.analyze()` (`normalized.includes("declining")`, `normalized.includes("compare these two")`).
   - The AI responses (`replyText`, `spokenText`) are hardcoded template strings inside `ProsisAgent` methods.
2. **Fake Realtime Voice Pipeline (Turn-Based Chatbot with TTS)**:
   - The marketing and documentation describe a "low-latency audio transport pipeline $\rightarrow$ speech recognition $\rightarrow$ Prosis agent $\rightarrow$ streaming audio".
   - In reality, it is a sequential turn-based flow: User stops speaking $\rightarrow$ browser finishes transcribing $\rightarrow$ HTTP POST JSON $\rightarrow$ browser text-to-speech speaks the canned response.
   - There is NO realtime bidirectional audio streaming.
3. **Fake Execution Telemetry / Status Messages**:
   - In `useProsisSession.ts`, status strings like `"Comparing week-over-week capacity pacing..."` and `"Formulating executive re-engagement strategies..."` are generated using naive `if (text.includes("..."))` heuristics rather than reflecting real server tool execution progress.
4. **Fake Memory Embeddings**:
   - `src/packages/memory/embedding.ts` claims to support external embedding providers, but actually hashes string character codes to generate a synthetic 128-float deterministic vector.
5. **Fake Multi-Tenant Database**:
   - `SeatbookingDatabase` is an in-process JavaScript object initialized at boot. All changes disappear when the process restarts.

---

## 5. Realtime Voice Architecture

### Current Implementation Type:
**D. Something custom** (specifically, **Client-Side Web Speech API + Browser SpeechSynthesis + Standard REST POST**).

### Analysis:
- **Is it A (Browser RealtimeSession)?** No. There is no OpenAI RealtimeSession or WebSocket connection to any realtime model provider.
- **Is it B (Browser WebRTC + server-side control)?** No. There is zero WebRTC code (`RTCPeerConnection`, `RTCDataChannel`, or SDP exchange).
- **Is it C (WebSocket realtime architecture)?** No. No WebSocket server (`ws`, `socket.io`) exists in the backend.
- **Actual mechanism:**
  1. Microphones captured via `navigator.mediaDevices.getUserMedia`.
  2. `AudioContext` + `AnalyserNode` monitors energy thresholds for client-side VAD barge-in.
  3. Browser-native `SpeechRecognition` produces text.
  4. Client `fetch()` posts text to `/api/v1/chat/stream`.
  5. Browser-native `window.speechSynthesis` speaks canned strings.

---

## 6. Security Problems

1. **Zero Authentication on Internal API Endpoints (P0)**:
   - `/api/v1/chat/stream`, `/api/v1/approvals/[id]/resolve`, `/api/v1/seatbooking/reservations`, and `/api/v1/tasks` have **no session validation, JWT check, or API key requirement**. Any HTTP client can invoke destructive actions without authentication.
2. **Hardcoded Mock Credentials**:
   - `.env` contains `SEATBOOKING_API_KEY=sb_live_secret_token_acme_8971` and `PROSIS_AUTH_SECRET=prosis_secret_super_secure_key_2026`, but these are never verified by any middleware or route handler.
3. **No Ephemeral Token Architecture for Realtime**:
   - When real realtime models (OpenAI Realtime API) are introduced, client browsers must **NEVER** receive the permanent `OPENAI_API_KEY`. An ephemeral session minting endpoint (`POST /api/v1/realtime/session`) is required to generate short-lived credentials (`ek_...`) server-side.
4. **Client-Side Identity Trust**:
   - Context objects in `agent.ts` trust user ID and role passed from caller (`Operations Director`, `owner`) without server-side signature validation.

---

## 7. Dependency Problems

1. **Missing OpenAI SDK**:
   - Neither `openai` nor `@openai/realtime-api-beta` is installed in `package.json`. Realtime voice cannot communicate with OpenAI without either the official client or a direct WebRTC/WebSocket client.
2. **Dead Test Runner Configuration**:
   - `package.json` had `"test": "npx tsx ..."` which hung indefinitely in headless environments because `tsx` was not installed in `node_modules` (now repaired using local `node test/run-tests.cjs`).
3. **Unused / Bloated Dependencies**:
   - `@dimforge/rapier3d-compat` (3D physics engine) is installed in `node_modules` but unused by Prosis.

---

## 8. Criticality Classification

### P0 — System Cannot Function as Real Realtime Voice Assistant
- **Fake Voice Pipeline**: System relies on browser Web Speech API instead of real realtime audio streaming. No real audio models, high latency, poor audio quality, and zero natural multi-turn streaming voice.
- **No Realtime Session Token Minting**: No server-side route to establish secure, authenticated WebRTC/WebSocket realtime sessions.

### P1 — Major Realtime & AI Problems
- **No LLM Integration**: The assistant cannot understand novel user queries; it only responds to hardcoded regex strings.
- **Fragmented Voice State Machine**: The state machine is split across `VoiceSession`, `useVoiceSession`, and `useProsisSession` with manual override hacks (`setManualState`).
- **Unauthenticated API Routes**: All `/api/v1/...` endpoints accept unauthenticated requests.

### P2 — Important Product Problems
- In-memory mock database resets on every server restart.
- Fake vector embeddings with character-code math rather than real semantic embeddings.
- Simulated tool execution status strings.

### P3 — Polish
- Visual indicator refinements.
- WebGL particle fine-tuning on high-DPI displays.

