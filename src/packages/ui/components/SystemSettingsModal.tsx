"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Shield,
  ShieldAlert,
  Moon,
  Bell,
  Layers,
  Cpu,
  Sparkles,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Radio,
  SlidersHorizontal,
  Activity,
  Mic,
  Volume2,
  Database,
  Building2,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Github } from "./GithubIcon";
import {
  AutonomyLevel,
  AUTONOMY_LEVEL_LABELS,
  ProactiveSettings,
} from "@prosis/proactive";
import { AuthenticatedUser, AuthenticatedSession } from "./LoginPage";

export interface SystemSettingsConfig {
  // Autonomy & Governance
  autonomyLevel: AutonomyLevel;
  requireApprovalForDestructive: boolean;
  requireApprovalForOutbound: boolean;
  requireApprovalForRosterChanges: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  notificationsEnabled: boolean;

  // AI & Cognitive Engine
  primaryModel: string;
  cognitiveTone: "executive" | "analytical" | "concise";
  reasoningTemperature: number;
  voiceEngine: "openai" | "gemini" | "text_only";

  // Product Surveillance
  monitoredProducts: string[];
  importanceThreshold: number;
  automaticActionsAllowed: string[];

  // Security & Audit
  auditLevel: "standard" | "verbose" | "strict_compliance";
}

interface DemoPersona {
  userId: string;
  name: string;
  email: string;
  role: string;
  orgName: string;
  venueCount: number;
  description: string;
}

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthenticatedUser | null;
  currentOrg?: { id: string; name: string; plan: string } | null;
  onLogout?: () => void;
  onSwitchPersona?: (session: AuthenticatedSession) => void;
  onSettingsSaved?: (newSettings: SystemSettingsConfig) => void;
  onOpenRepositories?: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentOrg,
  onLogout,
  onSwitchPersona,
  onSettingsSaved,
  onOpenRepositories,
}) => {
  const [activeTab, setActiveTab] = useState<"autonomy" | "cognitive" | "products" | "security">("autonomy");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(1);
  const [requireDestructiveApproval, setRequireDestructiveApproval] = useState(true);
  const [requireOutboundApproval, setRequireOutboundApproval] = useState(true);
  const [requireRosterApproval, setRequireRosterApproval] = useState(true);

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // AI Engine State
  const [primaryModel, setPrimaryModel] = useState("gpt-4o");
  const [cognitiveTone, setCognitiveTone] = useState<"executive" | "analytical" | "concise">("executive");
  const [reasoningTemperature, setReasoningTemperature] = useState(0.2);
  const [voiceEngine, setVoiceEngine] = useState<"openai" | "gemini" | "text_only">("openai");

  // Products State
  const [monitoredProducts, setMonitoredProducts] = useState<string[]>([
    "seatbooking",
    "workforce",
    "marketing",
    "menu",
    "analytics",
  ]);
  const [importanceThreshold, setImportanceThreshold] = useState(0.6);
  const [autoCacheWarming, setAutoCacheWarming] = useState(true);
  const [autoPrecompute, setAutoPrecompute] = useState(true);
  const [autoHealthChecks, setAutoHealthChecks] = useState(true);

  // Security / Demo personas
  const [demoPersonas, setDemoPersonas] = useState<DemoPersona[]>([]);
  const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);

  // Fetch current system settings on mount / open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);

    fetch("/api/v1/system/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data.success) return;
        const s = data.settings;
        if (s) {
          setAutonomyLevel(s.autonomyLevel ?? 1);
          setRequireDestructiveApproval(s.requireApprovalForDestructive ?? true);
          setRequireOutboundApproval(s.requireApprovalForOutbound ?? true);
          setRequireRosterApproval(s.requireApprovalForRosterChanges ?? true);

          if (s.quietHours) {
            setQuietHoursEnabled(s.quietHours.enabled ?? false);
            setQuietStart(s.quietHours.start ?? "22:00");
            setQuietEnd(s.quietHours.end ?? "07:00");
          }
          setNotificationsEnabled(s.notificationsEnabled ?? true);

          setPrimaryModel(s.primaryModel ?? "gpt-4o");
          setCognitiveTone(s.cognitiveTone ?? "executive");
          setReasoningTemperature(s.reasoningTemperature ?? 0.2);
          setVoiceEngine(s.voiceEngine ?? "openai");

          if (Array.isArray(s.monitoredProducts)) {
            setMonitoredProducts(s.monitoredProducts);
          }
          if (typeof s.importanceThreshold === "number") {
            setImportanceThreshold(s.importanceThreshold);
          }
        }
        if (Array.isArray(data.demoUsers)) {
          setDemoPersonas(data.demoUsers);
        }
      })
      .catch((err) => {
        console.warn("[SystemSettingsModal] Failed to load settings:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductToggle = (slug: string) => {
    setMonitoredProducts((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const automaticActionsAllowed: string[] = [];
    if (autoCacheWarming) automaticActionsAllowed.push("cache_warming");
    if (autoPrecompute) automaticActionsAllowed.push("analytics_precompute");
    if (autoHealthChecks) automaticActionsAllowed.push("health_check");

    const payload: SystemSettingsConfig = {
      autonomyLevel,
      requireApprovalForDestructive: requireDestructiveApproval,
      requireApprovalForOutbound: requireOutboundApproval,
      requireApprovalForRosterChanges: requireRosterApproval,
      quietHours: {
        enabled: quietHoursEnabled,
        start: quietStart,
        end: quietEnd,
        timezone: "UTC",
      },
      notificationsEnabled,
      primaryModel,
      cognitiveTone,
      reasoningTemperature,
      voiceEngine,
      monitoredProducts,
      importanceThreshold,
      automaticActionsAllowed,
      auditLevel: "strict_compliance",
    };

    try {
      const res = await fetch("/api/v1/system/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        onSettingsSaved?.(payload);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error("[SystemSettingsModal] Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchPersona = async (p: DemoPersona) => {
    setIsSwitchingPersona(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: p.userId }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        localStorage.setItem("prosis_session", JSON.stringify(data.session));
        localStorage.setItem("prosis_session_token", data.session.sessionToken);
        onSwitchPersona?.(data.session);
        onClose();
      }
    } catch (err) {
      console.error("[SystemSettingsModal] Switch persona error:", err);
    } finally {
      setIsSwitchingPersona(false);
    }
  };

  const allAvailableProducts = [
    { slug: "seatbooking", label: "Seatbooking", version: "v2.4.0", desc: "Reservations, table pacing, covers, capacity bounds" },
    { slug: "workforce", label: "Prosis Workforce", version: "v1.2.0", desc: "Staff rosters, overtime guardrails, shift compliance" },
    { slug: "marketing", label: "Prosis Marketing", version: "v1.1.0", desc: "VIP guest outreach, recovery campaigns, retention" },
    { slug: "menu", label: "Prosis Menu", version: "v1.0.0", desc: "Recipe costing, gross margin simulator, inventory pricing" },
    { slug: "analytics", label: "Prosis Analytics", version: "v2.1.0", desc: "Cross-product telemetry correlation & surge forecasting" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-3xl surface-hud rounded-3xl border border-white/10 shadow-[0_25px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh] relative bg-obsidian-975">
        {/* Top Specular Neon Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-core-cyan shadow-[0_0_12px_#00f0ff]" />

        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-obsidian-950/80 gap-3">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-core-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)] shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-semibold font-mono tracking-wide text-white">
                  SYSTEM CONTROL MATRIX
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/10 text-core-cyan border border-core-cyan/30 font-semibold shrink-0">
                  PROSIS.OS v2.4
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans hidden sm:block mt-0.5">
                Global governance, autonomy level, cognitive models, surveillance &amp; zero-trust security.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 px-6 pt-3 border-b border-white/10 bg-obsidian-950/40 text-xs font-mono">
          <button
            onClick={() => setActiveTab("autonomy")}
            className={`pb-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "autonomy"
                ? "border-core-cyan text-core-cyan font-semibold shadow-[0_4px_12px_rgba(0,240,255,0.15)]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Autonomy &amp; Agency</span>
            <span className="sm:hidden">Agency</span>
          </button>

          <button
            onClick={() => setActiveTab("cognitive")}
            className={`pb-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "cognitive"
                ? "border-core-violet text-core-violet font-semibold shadow-[0_4px_12px_rgba(139,92,246,0.15)]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cognitive Core</span>
            <span className="sm:hidden">AI Core</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "products"
                ? "border-core-emerald text-emerald-400 font-semibold shadow-[0_4px_12px_rgba(52,211,153,0.15)]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Surveillance</span>
            <span className="sm:hidden">Products</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "security"
                ? "border-rose-400 text-rose-400 font-semibold shadow-[0_4px_12px_rgba(244,63,94,0.15)]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Operator &amp; Security</span>
            <span className="sm:hidden">Security</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-200 max-h-[62vh]">
          {/* TAB 1: AUTONOMY & AGENCY */}
          {activeTab === "autonomy" && (
            <div className="space-y-6">
              {/* Autonomy Level Radio Group */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300">
                    System Autonomy Level (Agency Scope)
                  </label>
                  <span className="text-[10px] font-mono text-core-cyan">
                    Level {autonomyLevel} Active
                  </span>
                </div>

                <div className="space-y-2">
                  {([0, 1, 2, 3, 4] as AutonomyLevel[]).map((lvl) => {
                    const info = AUTONOMY_LEVEL_LABELS[lvl];
                    const isSelected = autonomyLevel === lvl;
                    const isLevel4 = lvl === 4;

                    return (
                      <div
                        key={lvl}
                        onClick={() => setAutonomyLevel(lvl)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-core-cyan/10 border-core-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-core-cyan bg-core-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                                  : "border-white/30 bg-black/40"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <span className="font-semibold text-white">
                              {info.name}
                            </span>
                            {lvl === 1 && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-white/10 text-core-cyan border border-core-cyan/30">
                                ENTERPRISE DEFAULT
                              </span>
                            )}
                          </div>

                          {isLevel4 && (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-400" /> Executive Opt-In Only
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 pl-6 leading-relaxed font-sans">
                          {info.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Human-In-The-Loop Approval Gates */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-core-cyan font-mono text-xs font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>MANDATORY APPROVAL GATES</span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans">
                  Actions requiring explicit human operator review before state modification:
                </p>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all">
                    <div>
                      <div className="text-white font-medium text-xs">Destructive Operations &amp; Database Deletions</div>
                      <div className="text-[10px] text-gray-400">Canceling reservations, modifying floor allocations, deleting menus</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireDestructiveApproval}
                      onChange={(e) => setRequireDestructiveApproval(e.target.checked)}
                      className="rounded accent-core-cyan cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all">
                    <div>
                      <div className="text-white font-medium text-xs">Outbound Communications (Email &amp; SMS)</div>
                      <div className="text-[10px] text-gray-400">Guest notifications, recovery campaign dispatches, VIP invitations</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireOutboundApproval}
                      onChange={(e) => setRequireOutboundApproval(e.target.checked)}
                      className="rounded accent-core-cyan cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all">
                    <div>
                      <div className="text-white font-medium text-xs">Workforce Overtime &amp; Shift Swaps</div>
                      <div className="text-[10px] text-gray-400">Scheduling alterations triggering labor wage deficits</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireRosterApproval}
                      onChange={(e) => setRequireRosterApproval(e.target.checked)}
                      className="rounded accent-core-cyan cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Quiet Hours Configuration */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-core-cyan" />
                    <span className="font-semibold text-white font-mono">QUIET HOURS SURVEILLANCE</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-core-cyan" />
                  </label>
                </div>
                <p className="text-[11px] text-gray-400 font-sans">
                  Silences unsolicited proactive audio briefings and audio notifications during off-duty hours.
                </p>
                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                        Start (UTC)
                      </label>
                      <input
                        type="time"
                        value={quietStart}
                        onChange={(e) => setQuietStart(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-white/10 bg-obsidian-975 font-mono text-xs text-white focus:outline-none focus:border-core-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                        End (UTC)
                      </label>
                      <input
                        type="time"
                        value={quietEnd}
                        onChange={(e) => setQuietEnd(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-white/10 bg-obsidian-975 font-mono text-xs text-white focus:outline-none focus:border-core-cyan/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COGNITIVE CORE & AI */}
          {activeTab === "cognitive" && (
            <div className="space-y-6">
              {/* Primary LLM Model Selector */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300 block mb-2">
                  Primary Cognitive Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "gpt-4o", name: "OpenAI GPT-4o", desc: "Flagship multi-step reasoning with tool orchestration", badge: "RECOMMENDED" },
                    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "Ultra-low latency multimodal live streaming", badge: "LIVE VOICE" },
                    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "1M+ token context window for deep corporate audit", badge: "DEEP AUDIT" },
                  ].map((m) => {
                    const isSelected = primaryModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setPrimaryModel(m.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-core-violet/15 border-core-violet/60 shadow-[0_0_20px_rgba(139,92,246,0.2)] text-white"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-white">{m.name}</span>
                          <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-core-violet/20 text-core-violet border border-core-violet/30">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans leading-relaxed">{m.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cognitive Tone & Style */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300 block mb-2">
                  Executive Communication Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "executive", name: "Executive Calm", desc: "Direct, brief, zero corporate fluff or cheerful emojis. Strict Prosis SOP." },
                    { id: "analytical", name: "Analytical Deep", desc: "Root-cause explanations, numeric deltas, and statistical variance models." },
                    { id: "concise", name: "Operational Brevity", desc: "Rapid dispatch bullets optimized for floor managers during dinner service." },
                  ].map((t) => {
                    const isSelected = cognitiveTone === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setCognitiveTone(t.id as any)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-core-cyan/15 border-core-cyan/60 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-white"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-400"
                        }`}
                      >
                        <span className="font-semibold text-xs text-white block mb-1">{t.name}</span>
                        <p className="text-[10px] text-gray-400 font-sans leading-relaxed">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reasoning Temperature Slider */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300">
                    Reasoning Determinism &amp; Temperature
                  </label>
                  <span className="font-mono text-xs font-semibold text-core-violet">
                    {reasoningTemperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={reasoningTemperature}
                  onChange={(e) => setReasoningTemperature(parseFloat(e.target.value))}
                  className="w-full accent-core-violet cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Deterministic (0.00)</span>
                  <span>Balanced Enterprise (0.20)</span>
                  <span>Creative Strategy (0.80)</span>
                </div>
              </div>

              {/* Realtime Voice Mode */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-core-cyan font-mono text-xs font-semibold">
                  <Mic className="w-4 h-4" />
                  <span>VOICE DUPLEX STREAMING ENGINE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "openai", name: "OpenAI WebRTC", desc: "Ultra-low latency peer connection with continuous echo-cancellation" },
                    { id: "gemini", name: "Gemini Live API", desc: "Multimodal WebSocket bidirectional audio streaming" },
                    { id: "text_only", name: "Mute Voice", desc: "High-security silent operation with text chat only" },
                  ].map((v) => {
                    const isSelected = voiceEngine === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setVoiceEngine(v.id as any)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-core-cyan/15 border-core-cyan text-white"
                            : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/15"
                        }`}
                      >
                        <div className="font-medium text-xs text-white">{v.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{v.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT SURVEILLANCE */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300 block mb-2">
                  Active Monitored Product Capabilities ({monitoredProducts.length}/{allAvailableProducts.length})
                </label>
                <div className="space-y-2">
                  {allAvailableProducts.map((p) => {
                    const isChecked = monitoredProducts.includes(p.slug);
                    return (
                      <div
                        key={p.slug}
                        onClick={() => handleProductToggle(p.slug)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-500/10 border-emerald-500/40 text-white shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                            : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">{p.label}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-400">
                              {p.version}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-sans mt-0.5">{p.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded accent-emerald-400 cursor-pointer w-4 h-4 ml-4"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Anomaly Detection Sensitivity */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300">
                    Anomaly Detection Sensitivity Threshold
                  </label>
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {(importanceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={importanceThreshold}
                  onChange={(e) => setImportanceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>High Sensitivity (30%)</span>
                  <span>Balanced Enterprise (60%)</span>
                  <span>Critical Anomalies Only (95%)</span>
                </div>
              </div>

              {/* Self-Healing & Background Maintenance */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>AUTONOMOUS BACKGROUND MAINTENANCE</span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                    <span className="text-xs text-white">Periodic Cache Warming for Fast Telemetry Queries</span>
                    <input
                      type="checkbox"
                      checked={autoCacheWarming}
                      onChange={(e) => setAutoCacheWarming(e.target.checked)}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                    <span className="text-xs text-white">Background Analytics Precomputation (Cover Pacing &amp; Wages)</span>
                    <input
                      type="checkbox"
                      checked={autoPrecompute}
                      onChange={(e) => setAutoPrecompute(e.target.checked)}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                    <span className="text-xs text-white">Telemetry Health Checks across Database Nodes</span>
                    <input
                      type="checkbox"
                      checked={autoHealthChecks}
                      onChange={(e) => setAutoHealthChecks(e.target.checked)}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* GitHub Repositories & Codebase Intelligence Integration */}
              <div className="p-4 rounded-2xl bg-core-cyan/[0.04] border border-core-cyan/20 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white font-mono flex items-center gap-2">
                    <Github className="w-4 h-4 text-core-cyan" />
                    <span>CONNECTED GITHUB REPOSITORIES</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans">
                    Ingest codebases, API routes, and database schemas so Prosis AI assistant understands external repositories.
                  </p>
                </div>
                {onOpenRepositories && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRepositories();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-core-cyan/20 hover:bg-core-cyan/30 text-core-cyan border border-core-cyan/40 font-mono text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <span>Manage Repositories</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OPERATOR & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Active Operator Profile Card */}
              {currentUser && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-core-cyan/10 via-obsidian-950 to-core-violet/10 border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-core-cyan/30 to-core-violet/30 border border-core-cyan/50 flex items-center justify-center text-sm font-mono font-bold text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        {currentUser.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {currentUser.name}
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-core-cyan/20 text-core-cyan border border-core-cyan/40">
                        {currentUser.role}
                      </span>
                      {currentOrg && (
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          {currentOrg.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Zero-Trust Boundaries:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> STRICT SERVER-SIDE RBAC ACTIVE
                    </span>
                  </div>
                </div>
              )}

              {/* Demo Persona Switching */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300 block mb-1">
                  Switch Operator Persona (Zero-Trust Simulation)
                </label>
                <p className="text-[11px] text-gray-400 font-sans mb-3">
                  Test and observe Prosis under distinct role permissions and tenant access boundaries:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {demoPersonas.map((p) => {
                    const isCurrent = currentUser?.email === p.email;
                    return (
                      <div
                        key={p.userId}
                        onClick={() => !isCurrent && handleSwitchPersona(p)}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrent
                            ? "bg-core-cyan/15 border-core-cyan/60 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-white">{p.name}</span>
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${
                              p.role === "owner"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : p.role === "manager"
                                ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/30"
                                : "bg-white/10 text-gray-400 border border-white/20"
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans leading-snug">{p.description}</p>
                        <div className="mt-2 text-[9px] font-mono text-gray-500">
                          Tenant: {p.orgName} · {p.venueCount} venue{p.venueCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terminal Session Lock & Sign Out */}
              <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-rose-300 font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCK CONSOLE &amp; TERMINATE SESSION</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                    Safely closes server session tokens and returns to the cyber login gate.
                  </p>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Session</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-obsidian-950/90 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Cancel
            </button>
            {saveSuccess && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings Enforced
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2 rounded-xl text-xs font-mono font-semibold text-black bg-gradient-to-r from-core-cyan via-core-emerald to-core-cyan hover:opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enforcing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply &amp; Enforce</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

