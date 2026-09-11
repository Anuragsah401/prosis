"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProductRegistry, ProductManifest } from "@prosis/sdk";
import { Memory, MemoryRecord } from "@prosis/memory";
import { AuditTrail, AuditRecord } from "@prosis/orchestrator";
import {
  AICoreVisual,
  CinematicConversation,
  ProductConstellation,
  ProductHubModal,
  SeatbookingWorkspace,
  WorkforceWorkspace,
  MenuWorkspace,
  AnalyticsWorkspace,
  TelemetryDock,
  MemoryManagerModal,
  ListeningIndicator,
  SpeakingIndicator,
  useProsisSession,
} from "@/packages/ui";
import {
  Paperclip,
  Send,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Mic,
  MicOff,
  AlertCircle,
  Brain,
} from "lucide-react";

export default function ProsisOSPrimaryInterface() {
  const [commandInput, setCommandInput] = useState<string>("");

  // Modals & Secondary Areas
  const [constellationOpen, setConstellationOpen] = useState<boolean>(false);
  const [productHubOpen, setProductHubOpen] = useState<boolean>(false);
  const [telemetryOpen, setTelemetryOpen] = useState<boolean>(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState<boolean>(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<string>("prosis");
  const [activeProductId, setActiveProductId] = useState<string>("prod_seatbooking_01");

  // Telemetry state
  const [products, setProducts] = useState<ProductManifest[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Prosis & Voice Session Hook with Workspace Navigation Callback
  const {
    turns,
    isProcessing,
    executionStatus,
    voice,
    sendDirective,
    resolveApproval,
  } = useProsisSession({
    onWorkspaceAction: (action) => {
      if (action.type === "return_to_core") {
        setCurrentWorkspace("prosis");
      } else if (action.type === "switch_workspace" && action.targetWorkspace) {
        setCurrentWorkspace(action.targetWorkspace);
      }
    },
  });

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, Operations Director";
    if (hour < 17) return "Good afternoon, Operations Director";
    return "Good evening, Operations Director";
  };

  const syncServerData = async () => {
    try {
      const [prodRes, auditRes, memRes] = await Promise.all([
        fetch("/api/v1/products").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/v1/audit").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/v1/memory").then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      if (prodRes?.data) setProducts(prodRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
      if (memRes?.data) setMemories(memRes.data);
    } catch (e) {
      console.warn("[ProsisOS] Server telemetry sync error:", e);
    }
  };

  useEffect(() => {
    syncServerData();

    // Global keyboard shortcuts (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setConstellationOpen(false);
        setTelemetryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const refreshMemoryState = async () => {
    try {
      const res = await fetch("/api/v1/memory").then((r) => r.json());
      if (res?.data) setMemories(res.data);
    } catch {}
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isProcessing) return;
    const text = commandInput.trim();
    setCommandInput("");
    sendDirective(text, "web");
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/v1/memory/${id}`, { method: "DELETE" });
      refreshMemoryState();
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const handleUpdateMemory = async (id: string, updates: Partial<MemoryRecord>) => {
    try {
      await fetch(`/api/v1/memory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      refreshMemoryState();
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  const handleAddMemory = async (record: { type: any; content: string; importance: any }) => {
    try {
      await fetch("/api/v1/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      refreshMemoryState();
    } catch (err) {
      console.error("Failed to add memory:", err);
    }
  };

  const hasTurns = turns.length > 0;

  return (
    <div className="min-h-screen bg-obsidian-975 text-gray-100 flex flex-col relative selection:bg-core-cyan/30 selection:text-white cyber-grid-bg">
      {/* Background Subtle Gradient Atmosphere & Sci-Fi Auroras */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-core-cyan/[0.07] via-core-violet/[0.04] to-transparent blur-[140px] rounded-full" />
        <div className="absolute -bottom-20 left-1/4 w-[700px] h-[350px] bg-core-violet/[0.04] blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-core-emerald/[0.02] blur-[100px] rounded-full" />
      </div>

      {/* TOP HUD BAR */}
      <header className="relative z-20 h-20 px-6 sm:px-10 border-b border-white/[0.08] bg-obsidian-950/70 backdrop-blur-2xl flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-core-cyan/20 via-obsidian-900 to-core-violet/20 border border-core-cyan/40 flex items-center justify-center text-core-cyan font-mono font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:border-core-cyan transition-all">
              P
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-core-cyan shadow-[0_0_6px_#38bdf8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider font-mono text-white flex items-center gap-1.5">
                PROSIS
                <span className="text-core-cyan font-light">IT</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/10 text-core-cyan border border-core-cyan/30 font-semibold tracking-wide">
                SYS.v2.4
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-tight hidden sm:block">
              Hospitality Executive Intelligence OS
            </p>
          </div>
        </div>

        {/* Connection Status & Active Workspace */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud text-xs font-mono text-gray-300 border-white/10 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                currentWorkspace === "prosis"
                  ? "bg-core-cyan shadow-[0_0_10px_#38bdf8] animate-pulse"
                  : "bg-core-emerald shadow-[0_0_10px_#34d399] animate-pulse"
              }`}
            />
            <span className="hidden sm:inline text-gray-400 text-[11px] tracking-wider">ORBIT ·</span>
            <span className="text-white font-medium capitalize text-xs">
              {currentWorkspace === "prosis" ? "Prosis OS Core" : `${currentWorkspace} Workspace`}
            </span>
            {currentWorkspace !== "prosis" && (
              <button
                onClick={() => setCurrentWorkspace("prosis")}
                className="ml-1 text-[10px] text-core-cyan hover:underline font-mono"
              >
                (Return)
              </button>
            )}
          </div>

          {/* Product Hub Button ("My Products") */}
          <button
            onClick={() => setProductHubOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud hover:border-core-cyan/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95 group"
            aria-label="Open Product Hub"
          >
            <Layers className="w-3.5 h-3.5 text-core-cyan group-hover:drop-shadow-[0_0_6px_#38bdf8] transition-all" />
            <span className="hidden sm:inline">Products ({products.length})</span>
          </button>

          {/* Memory Intelligence Manager Button */}
          <button
            onClick={() => setMemoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud hover:border-purple-400/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95 group"
            aria-label="Open Memory Manager"
          >
            <Brain className="w-3.5 h-3.5 text-core-violet group-hover:drop-shadow-[0_0_6px_#818cf8] transition-all" />
            <span className="hidden sm:inline">Matrix ({memories.length})</span>
          </button>

          {/* Telemetry / Profile Settings */}
          <button
            onClick={() => setTelemetryOpen(!telemetryOpen)}
            className="p-2.5 rounded-full surface-hud hover:border-white/20 text-gray-400 hover:text-white transition-all"
            aria-label="Toggle Telemetry & Memory Dock"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PRIMARY SCREEN CANVAS */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-6 sm:pt-10 pb-36 max-w-6xl mx-auto w-full">
        {currentWorkspace !== "prosis" ? (
          <div className="w-full space-y-6">
            {/* Docked Living AI Core Bar inside Product Workspace */}
            <div className="flex items-center justify-between p-3.5 surface-glass rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <AICoreVisual
                  state={voice.voiceState}
                  audioLevel={voice.amplitude}
                  size={46}
                  onClick={() => voice.toggleVoice()}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-white">Prosis Ambient Intelligence</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-core-cyan/10 text-core-cyan border border-core-cyan/20">
                      {voice.voiceState}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans">
                    Active across all workspaces. Speak naturally or type commands below.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => voice.toggleVoice()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                    voice.isVoiceActive
                      ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/40"
                      : "surface-glass text-gray-300 hover:text-white"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{voice.isVoiceActive ? "Listening" : "Voice"}</span>
                </button>
                <button
                  onClick={() => setCurrentWorkspace("prosis")}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all"
                >
                  Return to Prosis Core
                </button>
              </div>
            </div>

            {/* Render Selected Workspace */}
            {currentWorkspace === "seatbooking" && (
              <SeatbookingWorkspace
                onReturnToCore={() => setCurrentWorkspace("prosis")}
                onSendDirective={(d) => sendDirective(d, "web")}
              />
            )}
            {currentWorkspace === "workforce" && (
              <WorkforceWorkspace
                onReturnToCore={() => setCurrentWorkspace("prosis")}
                onSendDirective={(d) => sendDirective(d, "web")}
              />
            )}
            {currentWorkspace === "menu" && (
              <MenuWorkspace
                onReturnToCore={() => setCurrentWorkspace("prosis")}
                onSendDirective={(d) => sendDirective(d, "web")}
              />
            )}
            {currentWorkspace === "analytics" && (
              <AnalyticsWorkspace
                onReturnToCore={() => setCurrentWorkspace("prosis")}
                onSendDirective={(d) => sendDirective(d, "web")}
              />
            )}

            {/* Conversational responses inside active workspace */}
            {hasTurns && (
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  Prosis Dialogue Stream
                </div>
                <CinematicConversation
                  turns={turns}
                  onApprove={(id) => resolveApproval(id, true)}
                  onReject={(id) => resolveApproval(id, false)}
                  onSelectFollowUp={(prompt) => sendDirective(prompt, "web")}
                  isProcessing={isProcessing}
                  activeExecutionStatus={executionStatus}
                />
              </div>
            )}
          </div>
        ) : (
          /* PROSIS OS CORE INTERFACE */
          <>
            {/* CENTER FOCAL LIVING AI CORE */}
            <section
              className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
                hasTurns ? "mb-6 scale-90" : "my-auto py-8"
              }`}
              aria-label="AI Core Status"
            >
              {/* Futuristic Cyber Orbit Enclosure */}
              <div className="relative flex items-center justify-center my-2">
                {/* Orbital Ring 1 (Dashed Cyan with satellite nodes) */}
                <div
                  className={`absolute rounded-full border border-core-cyan/25 animate-orbit pointer-events-none transition-all duration-700 ${
                    hasTurns ? "w-[240px] h-[240px]" : "w-[340px] h-[340px]"
                  }`}
                  style={{
                    borderStyle: "dashed",
                    borderWidth: "1px",
                  }}
                >
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-core-cyan shadow-[0_0_10px_#38bdf8]" />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-core-violet shadow-[0_0_8px_#818cf8]" />
                </div>

                {/* Orbital Ring 2 (Outer reverse rotation with emerald node) */}
                <div
                  className={`absolute rounded-full border border-white/[0.07] animate-orbit-reverse pointer-events-none transition-all duration-700 ${
                    hasTurns ? "w-[280px] h-[280px]" : "w-[390px] h-[390px]"
                  }`}
                >
                  <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-core-emerald shadow-[0_0_8px_#34d399]" />
                </div>

                {/* Radar Ambient Pulse Ring */}
                <div
                  className={`absolute rounded-full bg-core-cyan/[0.02] border border-core-cyan/10 animate-radar-ping pointer-events-none ${
                    hasTurns ? "w-[210px] h-[210px]" : "w-[300px] h-[300px]"
                  }`}
                />

                <AICoreVisual
                  state={voice.voiceState}
                  audioLevel={voice.amplitude}
                  size={hasTurns ? 200 : 280}
                  onClick={() => {
                    voice.toggleVoice();
                  }}
                />
              </div>

              {/* Contextual Greeting & Operating State */}
              <div className="text-center mt-6 max-w-lg space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-[10px] font-mono text-gray-400 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-core-cyan animate-ping" />
                  <span className="tracking-widest uppercase text-gray-300">CORE INTELLIGENCE // v2.4</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
                  {getGreeting()}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans max-w-md mx-auto">
                  Prosis is orchestrating <span className="text-core-cyan font-mono">{products.length} registered products</span>. Speak naturally or select an executive directive below.
                </p>
              </div>

              {/* Real-time Voice Acoustic Feedback Banner */}
              <div className="mt-4 flex flex-col items-center gap-2 relative z-10">
                {voice.voiceState === "connecting" && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full surface-hud-glow text-xs font-mono text-core-cyan animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-core-cyan animate-ping" />
                    <span>Connecting Quantum Channel...</span>
                  </div>
                )}

                {(voice.voiceState === "listening" ||
                  voice.voiceState === "LISTENING" ||
                  voice.voiceState === "processing" ||
                  voice.voiceState === "PROCESSING") && (
                  <ListeningIndicator
                    amplitude={voice.amplitude}
                    transcript={voice.currentTranscript}
                    onStop={() => voice.stopVoice()}
                  />
                )}

                {(voice.voiceState === "speaking" || voice.voiceState === "SPEAKING") && (
                  <SpeakingIndicator
                    amplitude={voice.amplitude}
                    onInterrupt={() => voice.interruptVoice()}
                  />
                )}

                {/* Realtime Tool Activity Indicator */}
                {voice.toolActivity && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full surface-hud border-core-cyan/30 text-xs font-mono animate-fade-in shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                    {voice.toolActivity.status === "running" && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-core-cyan animate-pulse" />
                        <span className="text-gray-200">Prosis ● Checking venue analytics</span>
                      </>
                    )}
                    {voice.toolActivity.status === "success" && (
                      <>
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="text-gray-200">Prosis ✓ Venue analytics retrieved</span>
                      </>
                    )}
                    {voice.toolActivity.status === "error" && (
                      <>
                        <span className="text-red-400 font-bold">✕</span>
                        <span className="text-red-300">Prosis ✕ Analytics unavailable</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Explicit AI Readiness / Configuration Error Notification */}
              {(voice.voiceState === "CONFIGURATION_ERROR" ||
                voice.voiceState === "AI_UNAVAILABLE") && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-3 max-w-md text-left backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <div>
                    <span className="font-semibold block text-red-200">Realtime AI Not Configured</span>
                    <span className="text-gray-400">
                      Add GEMINI_API_KEY or OPENAI_API_KEY to the server environment to enable live voice intelligence.
                    </span>
                  </div>
                </div>
              )}

              {/* Other error notices */}
              {voice.errorMessage &&
                voice.voiceState !== "CONFIGURATION_ERROR" &&
                voice.voiceState !== "AI_UNAVAILABLE" && (
                  <div className="mt-3 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono flex items-center gap-2 backdrop-blur-md">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{voice.errorMessage}</span>
                  </div>
                )}
            </section>

            {/* DEFAULT INITIAL STATE: Futuristic Holographic Directives */}
            {!hasTurns ? (
              <div className="w-full max-w-2xl space-y-3 mt-4 animate-fade-in relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                  <button
                    onClick={() => sendDirective("Prosis, what's happening today?", "web")}
                    className="surface-hud hover:surface-hud-glow p-4 rounded-2xl transition-all space-y-2.5 group active:scale-95 text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-core-cyan">
                      <span className="tracking-widest uppercase font-semibold">// BRIEFING</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 text-core-cyan transition-transform" />
                    </div>
                    <div className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors">
                      &ldquo;What&apos;s happening today?&rdquo;
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Covers, occupancy, and pacing telemetry across portfolio.
                    </p>
                  </button>

                  <button
                    onClick={() => sendDirective("Find restaurants with increasing bookings but insufficient staff", "web")}
                    className="surface-hud hover:surface-hud-glow p-4 rounded-2xl transition-all space-y-2.5 group active:scale-95 text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-core-amber">
                      <span className="tracking-widest uppercase font-semibold">// CORRELATION</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 text-core-amber transition-transform" />
                    </div>
                    <div className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors">
                      &ldquo;Correlate bookings & staff&rdquo;
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Cross-checks Seatbooking pacing against Workforce rosters.
                    </p>
                  </button>

                  <button
                    onClick={() => sendDirective("Open Seatbooking", "web")}
                    className="surface-hud hover:surface-hud-glow p-4 rounded-2xl transition-all space-y-2.5 group active:scale-95 text-left hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-core-violet">
                      <span className="tracking-widest uppercase font-semibold">// WORKSPACE</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 text-core-violet transition-transform" />
                    </div>
                    <div className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors">
                      &ldquo;Open Seatbooking&rdquo;
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Direct view into reservation pacing & capacity matrices.
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE CONVERSATION: Editorial Cinematic Layout */
              <CinematicConversation
                turns={turns}
                onApprove={(id) => resolveApproval(id, true)}
                onReject={(id) => resolveApproval(id, false)}
                onSelectFollowUp={(prompt) => sendDirective(prompt, "web")}
                isProcessing={isProcessing}
                activeExecutionStatus={executionStatus}
              />
            )}
          </>
        )}
      </main>

      {/* FLOATING COMMAND OMNIBAR */}
      <div className="fixed bottom-6 inset-x-0 z-30 pointer-events-auto px-4">
        <div className="max-w-2xl mx-auto surface-glass-elevated border border-white/10 hover:border-core-cyan/30 rounded-full p-2 pl-3 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.06)] flex items-center justify-between gap-3 backdrop-blur-2xl transition-all duration-300">
          {/* Attachment Icon */}
          <button
            onClick={() => {}}
            className="p-2 rounded-full text-gray-400 hover:text-core-cyan hover:bg-white/5 transition-all"
            title="Attach documentation or knowledge file"
            aria-label="Attach File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Primary Text Directive Input */}
          <form
            onSubmit={handleFormSubmit}
            className="flex-1 flex items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Direct Prosis or speak naturally..."
              disabled={isProcessing}
              className="w-full bg-transparent text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none px-2 font-sans selection:bg-core-cyan/30"
              aria-label="Direct Prosis"
            />
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-500 border border-white/10 bg-white/[0.02]">
              ⌘K
            </span>
          </form>

          {/* Real-time Voice Duplex Interaction (Microphone with amplitude ring & barge-in) */}
          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={() => voice.toggleVoice()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                voice.isVoiceActive
                  ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  : "surface-glass text-gray-400 hover:text-gray-200 border-white/10 hover:border-white/20"
              }`}
              title={voice.isVoiceActive ? "Stop Voice Duplex" : "Start Voice Duplex"}
              aria-label={voice.isVoiceActive ? "Stop Voice Stream" : "Start Voice Stream"}
            >
              {voice.isVoiceActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-core-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-core-cyan"></span>
                  </span>
                  <span className="tracking-wide">LIVE</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span className="tracking-wide">VOICE</span>
                </>
              )}
            </button>

            {/* Send Button */}
            <button
              onClick={() => {
                if (!commandInput.trim() || isProcessing) return;
                const text = commandInput.trim();
                setCommandInput("");
                sendDirective(text, "web");
              }}
              disabled={!commandInput.trim() || isProcessing}
              className="p-2.5 rounded-full bg-gradient-to-r from-core-cyan to-blue-500 text-obsidian-950 font-bold hover:brightness-110 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              aria-label="Dispatch Directive"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT HUB MODAL: Dynamic registry grid of all connected products */}
      <ProductHubModal
        isOpen={productHubOpen}
        onClose={() => setProductHubOpen(false)}
        products={products}
        activeWorkspace={currentWorkspace}
        onSelectWorkspace={(slug) => setCurrentWorkspace(slug)}
        onSendDirective={(d) => sendDirective(d, "web")}
      />

      {/* SECONDARY DRAWER 1: Product Constellation Switcher */}
      <ProductConstellation
        isOpen={constellationOpen}
        onClose={() => setConstellationOpen(false)}
        activeProductId={activeProductId}
        onSelectProduct={(id) => setActiveProductId(id)}
      />

      {/* SECONDARY DRAWER 2: Telemetry, Memory & Audit Dock */}
      <TelemetryDock
        products={products}
        memories={memories}
        auditLogs={auditLogs}
        onDeleteMemory={handleDeleteMemory}
        isOpen={telemetryOpen}
        onToggle={() => setTelemetryOpen(!telemetryOpen)}
      />

      {/* MODAL 3: Dedicated Memory Manager (View, Correct, Disable, Delete) */}
      <MemoryManagerModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        memories={memories}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        onAddMemory={handleAddMemory}
      />
    </div>
  );
}
