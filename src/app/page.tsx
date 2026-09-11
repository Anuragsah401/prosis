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
  LoginPage,
  AuthenticatedSession,
  SystemSettingsModal,
  ConnectedRepositoriesModal,
  Github,
  useProsisSession,
} from "@/packages/ui";
import {
  Paperclip,
  Send,
  SlidersHorizontal,
  Sliders,
  Layers,
  ChevronRight,
  Mic,
  MicOff,
  AlertCircle,
  Brain,
  ShieldCheck,
  MoreHorizontal,
  X,
} from "lucide-react";

export default function ProsisOSPrimaryInterface() {
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [commandInput, setCommandInput] = useState<string>("");

  // Modals & Secondary Areas
  const [constellationOpen, setConstellationOpen] = useState<boolean>(false);
  const [productHubOpen, setProductHubOpen] = useState<boolean>(false);
  const [telemetryOpen, setTelemetryOpen] = useState<boolean>(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState<boolean>(false);
  const [systemSettingsOpen, setSystemSettingsOpen] = useState<boolean>(false);
  const [repositoriesModalOpen, setRepositoriesModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
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
    sessionToken: session?.sessionToken,
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
    const name = session?.user.name || "Operations Director";
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
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
    // Check saved session in localStorage
    try {
      const savedSession = localStorage.getItem("prosis_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.sessionToken) {
          setSession(parsed);
        }
      }
    } catch (e) {
      console.warn("[ProsisOS] Failed to parse cached session:", e);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLoginSuccess = (newSession: AuthenticatedSession) => {
    setSession(newSession);
    try {
      localStorage.setItem("prosis_session", JSON.stringify(newSession));
      localStorage.setItem("prosis_session_token", newSession.sessionToken);
    } catch {}
    syncServerData();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/session", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("prosis_session");
      localStorage.removeItem("prosis_session_token");
    } catch {}
    setSession(null);
  };

  useEffect(() => {
    if (session) {
      syncServerData();
    }

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
  }, [session]);

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

  // Auth Verification Loading Screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-obsidian-975 text-gray-100 flex flex-col items-center justify-center p-6 cyber-grid-bg relative select-none">
        <div className="relative flex items-center justify-center p-3">
          <AICoreVisual state="thinking" audioLevel={0.4} size={72} />
        </div>
        <div className="mt-4 flex flex-col items-center space-y-1">
          <span className="text-xs font-mono text-core-cyan uppercase tracking-widest animate-pulse">
            // SYS.INITIALIZING PROTOCOL...
          </span>
          <span className="text-[11px] font-mono text-gray-500">
            Validating neural credentials and zero-trust identity
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated Gate -> Render Futuristic Login Page
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-obsidian-975 text-gray-100 flex flex-col relative selection:bg-core-cyan/30 selection:text-white cyber-grid-bg">
      {/* Background Subtle Gradient Atmosphere & Sci-Fi Auroras */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-core-cyan/[0.07] via-core-violet/[0.04] to-transparent blur-[140px] rounded-full" />
        <div className="absolute -bottom-20 left-1/4 w-[700px] h-[350px] bg-core-violet/[0.04] blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-core-emerald/[0.02] blur-[100px] rounded-full" />
      </div>

      {/* TOP HUD BAR */}
      <header
        className={`relative z-20 h-16 sm:h-20 pl-4 sm:pl-6 md:pl-10 border-b border-white/[0.08] bg-obsidian-950/70 backdrop-blur-2xl flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          telemetryOpen ? "pr-4 sm:pr-6 md:pr-8 lg:pr-[410px]" : "pr-4 sm:pr-20 md:pr-24"
        }`}
      >
        {/* Logo & Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-core-cyan/20 via-obsidian-900 to-core-violet/20 border border-core-cyan/40 flex items-center justify-center text-core-cyan font-mono font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:border-core-cyan transition-all">
              P
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-core-cyan shadow-[0_0_6px_#38bdf8]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm tracking-wider font-mono text-white flex items-center gap-1.5">
                PROSIS
                <span className="text-core-cyan font-light">IT</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/10 text-core-cyan border border-core-cyan/30 font-semibold tracking-wide hidden xs:inline-block">
                SYS.v2.4
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-tight hidden sm:block">
              Hospitality Executive Intelligence OS
            </p>
          </div>
        </div>

        {/* Desktop Nav — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3.5">
          {/* Workspace Status */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud text-xs font-mono text-gray-300 border-white/10 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                currentWorkspace === "prosis"
                  ? "bg-core-cyan shadow-[0_0_10px_#38bdf8] animate-pulse"
                  : "bg-core-emerald shadow-[0_0_10px_#34d399] animate-pulse"
              }`}
            />
            <span className="hidden md:inline text-gray-400 text-[11px] tracking-wider">ORBIT ·</span>
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

          {/* Product Hub */}
          <button
            onClick={() => setProductHubOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud hover:border-core-cyan/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95 group"
            aria-label="Open Product Hub"
          >
            <Layers className="w-3.5 h-3.5 text-core-cyan group-hover:drop-shadow-[0_0_6px_#38bdf8] transition-all" />
            <span className="hidden md:inline">Products ({products.length})</span>
          </button>

          {/* Memory Manager */}
          <button
            onClick={() => setMemoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud hover:border-purple-400/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95 group"
            aria-label="Open Memory Manager"
          >
            <Brain className="w-3.5 h-3.5 text-core-violet group-hover:drop-shadow-[0_0_6px_#818cf8] transition-all" />
            <span className="hidden md:inline">Matrix ({memories.length})</span>
          </button>

          {/* Repos */}
          <button
            onClick={() => setRepositoriesModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud hover:border-emerald-400/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95 group"
            aria-label="Open Codebase Repositories"
            title="Connected Codebases & GitHub Repositories"
          >
            <Github className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-all" />
            <span className="hidden md:inline">Repos</span>
          </button>

          {/* Telemetry Dock */}
          <button
            onClick={() => setTelemetryOpen(!telemetryOpen)}
            className="p-2.5 rounded-full surface-hud hover:border-white/20 text-gray-400 hover:text-white transition-all"
            aria-label="Toggle Telemetry & Memory Dock"
            title="Telemetry & Memory Dock"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setSystemSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full surface-hud hover:border-core-cyan/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95 group"
            aria-label="Open System Settings"
            title="System Settings & Governance Control"
          >
            <Sliders className="w-3.5 h-3.5 text-core-cyan group-hover:rotate-45 transition-all" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* Operator Avatar */}
          {session && (
            <button
              onClick={() => setSystemSettingsOpen(true)}
              className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-white/10 hover:opacity-90 transition-opacity text-left cursor-pointer group"
              title="Operator Identity & Security Settings"
              aria-label="Operator Identity & Security Settings"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-xs font-mono font-bold text-core-cyan shrink-0 group-hover:border-core-cyan transition-all">
                {session.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-mono font-medium text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-core-emerald animate-pulse" />
                  {session.user.name}
                </span>
                <span className="text-[9px] font-mono text-core-cyan uppercase tracking-wider">
                  {session.user.role} // {session.organization.name}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Mobile Right Controls — visible only on mobile */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Workspace pill (compact) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full surface-hud text-[11px] font-mono text-gray-300 border-white/10">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                currentWorkspace === "prosis"
                  ? "bg-core-cyan animate-pulse"
                  : "bg-core-emerald animate-pulse"
              }`}
            />
            <span className="text-white font-medium capitalize truncate max-w-[90px]">
              {currentWorkspace === "prosis" ? "Core" : currentWorkspace}
            </span>
            {currentWorkspace !== "prosis" && (
              <button
                onClick={() => setCurrentWorkspace("prosis")}
                className="text-[10px] text-core-cyan font-mono shrink-0"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl surface-hud text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY — Bottom Sheet */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[35] sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-obsidian-975 border-t border-white/10 rounded-t-3xl p-5 space-y-3 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            {/* Operator identity */}
            {session && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-sm font-mono font-bold text-core-cyan shrink-0">
                  {session.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-core-emerald animate-pulse" />
                    {session.user.name}
                  </div>
                  <div className="text-[10px] font-mono text-core-cyan/80 uppercase tracking-wider">
                    {session.user.role} · {session.organization.name}
                  </div>
                </div>
              </div>
            )}

            {/* Nav Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setProductHubOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl surface-hud border border-white/10 hover:border-core-cyan/40 text-left active:scale-95 transition-all"
              >
                <Layers className="w-4 h-4 text-core-cyan shrink-0" />
                <div>
                  <div className="text-xs font-mono font-semibold text-white">Products</div>
                  <div className="text-[10px] text-gray-400">{products.length} connected</div>
                </div>
              </button>

              <button
                onClick={() => { setMemoryModalOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl surface-hud border border-white/10 hover:border-core-violet/40 text-left active:scale-95 transition-all"
              >
                <Brain className="w-4 h-4 text-core-violet shrink-0" />
                <div>
                  <div className="text-xs font-mono font-semibold text-white">Memory</div>
                  <div className="text-[10px] text-gray-400">{memories.length} records</div>
                </div>
              </button>

              <button
                onClick={() => { setRepositoriesModalOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl surface-hud border border-white/10 hover:border-emerald-400/40 text-left active:scale-95 transition-all"
              >
                <Github className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-mono font-semibold text-white">Repos</div>
                  <div className="text-[10px] text-gray-400">GitHub knowledge</div>
                </div>
              </button>

              <button
                onClick={() => { setTelemetryOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl surface-hud border border-white/10 hover:border-white/20 text-left active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-300 shrink-0" />
                <div>
                  <div className="text-xs font-mono font-semibold text-white">Telemetry</div>
                  <div className="text-[10px] text-gray-400">Audit & memory</div>
                </div>
              </button>
            </div>

            {/* Settings full-width */}
            <button
              onClick={() => { setSystemSettingsOpen(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-core-cyan/5 border border-core-cyan/20 hover:border-core-cyan/40 text-left active:scale-95 transition-all"
            >
              <Sliders className="w-4 h-4 text-core-cyan shrink-0" />
              <div>
                <div className="text-xs font-mono font-semibold text-white">System Settings</div>
                <div className="text-[10px] text-gray-400">Autonomy, AI models, governance</div>
              </div>
            </button>

            {/* Bottom safe area */}
            <div className="h-2" />
          </div>
        </div>
      )}

      {/* PRIMARY SCREEN CANVAS */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-6 sm:pt-10 pb-36 max-w-6xl mx-auto w-full">
        {currentWorkspace !== "prosis" ? (
          <div className="w-full space-y-6">
            {/* Docked Living AI Core Bar inside Product Workspace */}
            <div className="flex items-center justify-between p-3.5 surface-hud rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/15 text-core-cyan border border-core-cyan/30 tracking-wider font-medium">
                      ● {voice.voiceState.toUpperCase()}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all active:scale-95 ${
                    voice.isVoiceActive
                      ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "surface-hud text-gray-300 hover:text-white border border-white/10"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-core-cyan" />
                  <span>{voice.isVoiceActive ? "Listening" : "Voice"}</span>
                </button>
                <button
                  onClick={() => setCurrentWorkspace("prosis")}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all active:scale-95 border border-white/10"
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
                    hasTurns ? "w-[160px] h-[160px] sm:w-[240px] sm:h-[240px]" : "w-[220px] h-[220px] sm:w-[340px] sm:h-[340px]"
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
                    hasTurns ? "w-[190px] h-[190px] sm:w-[280px] sm:h-[280px]" : "w-[255px] h-[255px] sm:w-[390px] sm:h-[390px]"
                  }`}
                >
                  <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-core-emerald shadow-[0_0_8px_#34d399]" />
                </div>

                {/* Radar Ambient Pulse Ring */}
                <div
                  className={`absolute rounded-full bg-core-cyan/[0.02] border border-core-cyan/10 animate-radar-ping pointer-events-none ${
                    hasTurns ? "w-[140px] h-[140px] sm:w-[210px] sm:h-[210px]" : "w-[195px] h-[195px] sm:w-[300px] sm:h-[300px]"
                  }`}
                />

                <AICoreVisual
                  state={voice.voiceState}
                  audioLevel={voice.amplitude}
                  size={hasTurns ? 120 : 160}
                  onClick={() => {
                    voice.toggleVoice();
                  }}
                  className="sm:scale-[1.67] sm:origin-center"
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
      <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-30 pointer-events-auto px-3 sm:px-4">
        <div className="max-w-2xl mx-auto surface-glass-elevated border border-white/10 hover:border-core-cyan/30 rounded-full p-1.5 sm:p-2 pl-2 sm:pl-3 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.06)] flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-2xl transition-all duration-300">
          {/* Attachment Icon */}
          <button
            onClick={() => {}}
            className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-core-cyan hover:bg-white/5 transition-all shrink-0"
            title="Attach documentation or knowledge file"
            aria-label="Attach File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Primary Text Directive Input */}
          <form
            onSubmit={handleFormSubmit}
            className="flex-1 flex items-center min-w-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Direct Prosis..."
              disabled={isProcessing}
              className="w-full bg-transparent text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none px-1.5 sm:px-2 font-sans selection:bg-core-cyan/30 min-w-0"
              aria-label="Direct Prosis"
            />
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-500 border border-white/10 bg-white/[0.02] shrink-0">
              ⌘K
            </span>
          </form>

          {/* Real-time Voice Duplex Interaction */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-0.5 sm:pr-1 shrink-0">
            <button
              onClick={() => voice.toggleVoice()}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
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
                  <span className="tracking-wide hidden sm:inline">LIVE</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span className="tracking-wide hidden sm:inline">VOICE</span>
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
              className="p-2 sm:p-2.5 rounded-full bg-gradient-to-r from-core-cyan to-blue-500 text-obsidian-950 font-bold hover:brightness-110 disabled:opacity-25 disabled:pointer-events-none transition-all active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
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
        currentUser={session?.user}
        onLogout={handleLogout}
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

      {/* MODAL 4: Dedicated System Control & Governance Settings */}
      <SystemSettingsModal
        isOpen={systemSettingsOpen}
        onClose={() => setSystemSettingsOpen(false)}
        currentUser={session?.user}
        currentOrg={session?.organization}
        onLogout={handleLogout}
        onSwitchPersona={(newSession) => setSession(newSession)}
        onOpenRepositories={() => {
          setSystemSettingsOpen(false);
          setRepositoriesModalOpen(true);
        }}
      />

      {/* MODAL 5: Connected GitHub Repositories Knowledge Hub */}
      <ConnectedRepositoriesModal
        isOpen={repositoriesModalOpen}
        onClose={() => setRepositoriesModalOpen(false)}
      />
    </div>
  );
}
