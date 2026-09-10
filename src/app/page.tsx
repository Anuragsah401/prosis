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
    <div className="min-h-screen bg-obsidian-950 text-gray-100 flex flex-col relative selection:bg-core-cyan/30 selection:text-white">
      {/* Background Subtle Gradient Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-core-cyan/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-core-violet/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-20 h-18 px-6 sm:px-10 border-b border-white/[0.06] backdrop-blur-xl flex items-center justify-between">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider font-mono text-gray-100">
                PROSIS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/5 font-semibold">
                OS
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-tight hidden sm:block">
              Enterprise Intelligence Operating System
            </p>
          </div>
        </div>

        {/* Connection Status & Active Workspace */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full surface-glass text-xs font-mono text-gray-300">
            <span
              className={`w-2 h-2 rounded-full ${
                currentWorkspace === "prosis"
                  ? "bg-core-cyan shadow-[0_0_8px_#38bdf8]"
                  : "bg-core-emerald shadow-[0_0_8px_#34d399]"
              }`}
            />
            <span className="hidden sm:inline">Active ·</span>
            <span className="text-white font-medium capitalize">
              {currentWorkspace === "prosis" ? "Prosis OS Core" : `${currentWorkspace} Workspace`}
            </span>
            {currentWorkspace !== "prosis" && (
              <button
                onClick={() => setCurrentWorkspace("prosis")}
                className="ml-1 text-[10px] text-core-cyan hover:underline"
              >
                (Return)
              </button>
            )}
          </div>

          {/* Product Hub Button ("My Products") */}
          <button
            onClick={() => setProductHubOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-glass hover:bg-white/10 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95"
            aria-label="Open Product Hub"
          >
            <Layers className="w-3.5 h-3.5 text-core-cyan" />
            <span className="hidden sm:inline">My Products ({products.length})</span>
          </button>

          {/* Memory Intelligence Manager Button */}
          <button
            onClick={() => setMemoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-glass hover:bg-white/10 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95"
            aria-label="Open Memory Manager"
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Memory ({memories.length})</span>
          </button>

          {/* Telemetry / Profile Settings */}
          <button
            onClick={() => setTelemetryOpen(!telemetryOpen)}
            className="p-2 rounded-full surface-glass hover:bg-white/10 text-gray-400 hover:text-white transition-all"
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
              <AICoreVisual
                state={voice.voiceState}
                audioLevel={voice.amplitude}
                size={hasTurns ? 200 : 280}
                onClick={() => {
                  voice.toggleVoice();
                }}
              />

              {/* Contextual Greeting & Operating State */}
              <div className="text-center mt-4 max-w-lg space-y-2">
                <h1 className="text-lg sm:text-xl font-medium tracking-tight text-gray-100 font-sans">
                  {getGreeting()}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  Prosis is orchestrating {products.length} registered products. Speak naturally or select a directive below.
                </p>
              </div>

              {/* Real-time Voice Acoustic Feedback Banner */}
              <div className="mt-4 flex flex-col items-center gap-2">
                {voice.voiceState === "connecting" && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-glass border border-core-cyan/30 text-xs font-mono text-core-cyan animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-core-cyan" />
                    <span>Connecting Realtime Session...</span>
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

                {/* Section 12: Realtime Tool Activity Indicator */}
                {voice.toolActivity && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-glass border border-white/10 text-xs font-mono animate-fade-in">
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

              {/* Section 4: Explicit AI Readiness / Configuration Error Notification */}
              {(voice.voiceState === "CONFIGURATION_ERROR" ||
                voice.voiceState === "AI_UNAVAILABLE") && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-3 max-w-md text-left">
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
                  <div className="mt-3 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{voice.errorMessage}</span>
                  </div>
                )}
            </section>

            {/* DEFAULT INITIAL STATE: Clean Minimal Directives (Secondary areas hidden) */}
            {!hasTurns ? (
              <div className="w-full max-w-2xl space-y-3 mt-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <button
                    onClick={() => sendDirective("Prosis, what's happening today?", "web")}
                    className="surface-glass hover:bg-white/[0.06] p-4 rounded-2xl transition-all space-y-2 group active:scale-95"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-core-cyan">
                      <span>DAILY BRIEFING</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-sm font-medium text-gray-200">
                      &ldquo;What&apos;s happening today?&rdquo;
                    </div>
                    <p className="text-xs text-gray-400">
                      Gathers covers, occupancy, and pacing across portfolio.
                    </p>
                  </button>

                  <button
                    onClick={() => sendDirective("Find restaurants with increasing bookings but insufficient staff", "web")}
                    className="surface-glass hover:bg-white/[0.06] p-4 rounded-2xl transition-all space-y-2 group active:scale-95"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-core-amber">
                      <span>CROSS-PRODUCT AI</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-sm font-medium text-gray-200">
                      &ldquo;Correlate bookings & staff&rdquo;
                    </div>
                    <p className="text-xs text-gray-400">
                      Cross-checks Seatbooking pacing against Workforce rosters.
                    </p>
                  </button>

                  <button
                    onClick={() => sendDirective("Open Seatbooking", "web")}
                    className="surface-glass hover:bg-white/[0.06] p-4 rounded-2xl transition-all space-y-2 group active:scale-95"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-core-violet">
                      <span>WORKSPACE SWITCH</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-sm font-medium text-gray-200">
                      &ldquo;Open Seatbooking&rdquo;
                    </div>
                    <p className="text-xs text-gray-400">
                      Switches workspace to reservations & capacity view.
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
        <div className="max-w-2xl mx-auto surface-glass-elevated rounded-full p-2 pl-3 shadow-2xl flex items-center justify-between gap-3">
          {/* Attachment Icon */}
          <button
            onClick={() => {}}
            className="p-2 rounded-full text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
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
              placeholder="Direct Prosis or speak naturally (⌘K)..."
              disabled={isProcessing}
              className="w-full bg-transparent text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none px-2 font-sans"
              aria-label="Direct Prosis"
            />
          </form>

          {/* Real-time Voice Duplex Interaction (Microphone with amplitude ring & barge-in) */}
          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={() => voice.toggleVoice()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                voice.isVoiceActive
                  ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/40 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                  : "surface-glass text-gray-400 hover:text-gray-200 border-white/10"
              }`}
              title={voice.isVoiceActive ? "Stop Voice Duplex" : "Start Voice Duplex"}
              aria-label={voice.isVoiceActive ? "Stop Voice Stream" : "Start Voice Stream"}
            >
              {voice.isVoiceActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-core-cyan animate-ping" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice</span>
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
              className="p-2.5 rounded-full bg-white text-obsidian-950 font-medium hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
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
