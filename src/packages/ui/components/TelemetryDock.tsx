"use client";

import React, { useState } from "react";
import {
  Layers,
  Brain,
  Activity,
  BookOpen,
  Trash2,
  CheckCircle,
  Clock,
  Shield,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  LogOut,
} from "lucide-react";
import { MemoryRecord } from "@prosis/memory";
import { AuditRecord } from "@prosis/orchestrator";
import { ProductManifest } from "@prosis/sdk";

interface TelemetryDockProps {
  products: ProductManifest[];
  memories: MemoryRecord[];
  auditLogs: AuditRecord[];
  onDeleteMemory: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentUser?: {
    name: string;
    role: string;
    email?: string;
  } | null;
  onLogout?: () => void;
}

export const TelemetryDock: React.FC<TelemetryDockProps> = ({
  products,
  memories,
  auditLogs,
  onDeleteMemory,
  isOpen,
  onToggle,
  currentUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "memory" | "audit" | "knowledge">("products");

  return (
    <>
      {/* ── MOBILE: Bottom Sheet (< md) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={onToggle}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 h-[80vh] bg-obsidian-975 border-t border-white/10 rounded-t-3xl flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.9)] animate-fade-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top ribbon */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-emerald-400 shadow-[0_0_12px_#00f0ff] rounded-t-3xl" />
            {/* Drag handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-core-cyan/10 border border-core-cyan/30 flex items-center justify-center text-core-cyan shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold tracking-wider text-white block">SYS.TELEMETRY</span>
                  <span className="font-mono text-[9px] text-core-cyan tracking-widest">// REAL-TIME BUS</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </span>
                  ONLINE
                </span>
                <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" aria-label="Close">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
              </div>
            </div>
            {/* Tab nav */}
            <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/10 bg-obsidian-900/80 text-xs font-mono shrink-0">
              {(["products", "memory", "audit", "knowledge"] as const).map((tab) => {
                const icons = { products: Layers, memory: Brain, audit: Activity, knowledge: BookOpen };
                const labels = { products: "Products", memory: "Memory", audit: "Audit", knowledge: "Policy" };
                const colors = {
                  products: "bg-core-cyan/15 text-core-cyan border-core-cyan/40",
                  memory: "bg-core-violet/20 text-core-violet border-core-violet/40",
                  audit: "bg-amber-400/15 text-amber-400 border-amber-400/40",
                  knowledge: "bg-emerald-400/15 text-emerald-400 border-emerald-400/40",
                };
                const Icon = icons[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      activeTab === tab
                        ? `${colors[tab]} border font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]`
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{labels[tab]}</span>
                  </button>
                );
              })}
            </div>
            {/* Tab body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "products" && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                    <span className="tracking-wider uppercase font-semibold text-gray-300">FEDERATED BUS ({products.length})</span>
                    <span className="text-[10px] text-core-cyan font-bold px-2 py-0.5 rounded-full bg-core-cyan/10 border border-core-cyan/30">HOT-PLUG</span>
                  </div>
                  {products.map((prod) => (
                    <div key={prod.id} className="p-3.5 rounded-2xl surface-hud border border-white/10 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-mono">{prod.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-core-cyan border border-core-cyan/30">v{prod.version}</span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1 leading-relaxed">{prod.description}</p>
                        </div>
                        <span className="relative flex h-2 w-2 shrink-0 mt-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "memory" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className="tracking-wider uppercase font-semibold text-gray-300">MEMORY MATRIX</span>
                    <span className="text-[10px] font-bold text-core-violet px-2 py-0.5 rounded-full bg-core-violet/10 border border-core-violet/30">{memories.length} RECORDS</span>
                  </div>
                  {memories.map((mem) => (
                    <div key={mem.id} className="p-3.5 rounded-2xl surface-hud border border-white/10 text-xs space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          mem.type === "company_memory" ? "bg-core-violet/20 text-core-violet border border-core-violet/40"
                          : mem.type === "task_memory" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          : mem.type === "user_preference" ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/40"
                          : "bg-gray-500/20 text-gray-300 border border-gray-500/40"
                        }`}>{mem.type.replace("_", " ")}</span>
                        <button onClick={() => onDeleteMemory(mem.id)} className="text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg p-1.5 transition-all" aria-label="Delete Memory">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="font-mono text-white text-[12px] font-semibold">{mem.key}</div>
                      <p className="text-gray-300 text-xs leading-relaxed font-sans">{mem.content}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "audit" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className="tracking-wider uppercase font-semibold text-gray-300">IMMUTABLE LEDGER</span>
                    <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">SECURE</span>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-mono surface-hud rounded-2xl border border-white/10">No operations yet.</div>
                  ) : auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-2xl surface-hud border border-white/10 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-core-cyan text-[11.5px] truncate max-w-[60%]">{log.toolName}</span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase ${log.executionStatus === "success" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"}`}>{log.executionStatus}</span>
                      </div>
                      {log.resultSummary && <p className="text-gray-300 text-[11px] font-sans leading-relaxed">{log.resultSummary}</p>}
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "knowledge" && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                    <span className="tracking-wider uppercase font-semibold text-gray-300">RETRIEVAL GOVERNANCE</span>
                    <span className="text-[10px] text-core-violet font-bold px-2 py-0.5 rounded-full bg-core-violet/10 border border-core-violet/30">ENFORCED</span>
                  </div>
                  <div className="p-4 rounded-2xl surface-hud border border-white/10 space-y-2.5">
                    <div className="flex items-center gap-2 text-core-cyan font-semibold text-xs font-mono"><Shield className="w-4 h-4 text-core-cyan" /><span>// SHIELD.v1: OUTBOUND GATE</span></div>
                    <p className="text-gray-300 text-xs leading-relaxed font-sans">Outbound communications require explicit human-in-the-loop authorization.</p>
                  </div>
                  <div className="p-4 rounded-2xl surface-hud border border-white/10 space-y-2.5">
                    <div className="flex items-center gap-2 text-core-violet font-semibold text-xs font-mono"><BookOpen className="w-4 h-4 text-core-violet" /><span>// SOP.v2: DECLINING PACING</span></div>
                    <p className="text-gray-300 text-xs leading-relaxed font-sans">Venues with &gt;20% weekly drop trigger an automated recovery campaign.</p>
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            {currentUser && (
              <div className="p-3.5 border-t border-white/10 bg-obsidian-950/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-xs font-mono font-bold text-core-cyan shrink-0">{currentUser.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-200 truncate">{currentUser.name}</div>
                    <div className="text-[10px] font-mono text-core-cyan/80 truncate uppercase tracking-wider">{currentUser.role}</div>
                  </div>
                </div>
                {onLogout && (
                  <button onClick={onLogout} className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-[11px] font-mono flex items-center gap-1.5 transition-all shrink-0 active:scale-95" title="Log Out">
                    <LogOut className="w-3.5 h-3.5" /><span>Lock</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DESKTOP: Right-Side Drawer (≥ md) ── */}
      <aside
        className={`fixed top-0 right-0 h-screen z-40 transition-all duration-300 ease-in-out border-l border-white/10 hover:border-core-cyan/40 bg-obsidian-975/95 backdrop-blur-2xl flex-col shadow-[0_0_50px_rgba(0,0,0,0.8),-5px_0_25px_rgba(0,240,255,0.06)] hidden md:flex ${
          isOpen ? "w-96" : "w-14"
        }`}
      >
      {/* Top Ambient Glow Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-emerald-400 shadow-[0_0_12px_#00f0ff]" />

      {/* Top Header / Toggle Bar */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-white/10">
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          title={isOpen ? "Collapse Telemetry Dock" : "Expand Telemetry Dock"}
        >
          <div className="w-8 h-8 rounded-lg bg-core-cyan/10 border border-core-cyan/30 flex items-center justify-center text-core-cyan shadow-[0_0_10px_rgba(0,240,255,0.25)] group-hover:border-core-cyan/60 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all">
            <Cpu className="w-4 h-4" />
          </div>
          {isOpen && (
            <div className="text-left">
              <span className="font-mono text-xs font-bold tracking-wider text-white block">
                SYS.TELEMETRY
              </span>
              <span className="font-mono text-[9px] text-core-cyan tracking-widest block">
                // REAL-TIME BUS
              </span>
            </div>
          )}
        </button>

        {isOpen && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              ONLINE
            </span>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Collapse"
              aria-label="Collapse"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* When collapsed, show quick icon switcher rail */}
      {!isOpen && (
        <div className="flex-1 flex flex-col items-center justify-between py-6 text-gray-400">
          <div className="flex flex-col items-center gap-3 w-full px-2">
            <button
              onClick={() => {
                onToggle();
                setActiveTab("products");
              }}
              title="Connected Products"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-core-cyan/10 hover:text-core-cyan hover:border hover:border-core-cyan/30 transition-all group relative"
            >
              <Layers className="w-4 h-4" />
              <span className="absolute left-12 px-2 py-1 rounded bg-obsidian-900 border border-white/10 text-[10px] font-mono text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap shadow-xl">
                Products
              </span>
            </button>

            <button
              onClick={() => {
                onToggle();
                setActiveTab("memory");
              }}
              title="Multi-Tier Memory"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-core-violet/15 hover:text-core-violet hover:border hover:border-core-violet/30 transition-all group relative"
            >
              <Brain className="w-4 h-4" />
              <span className="absolute left-12 px-2 py-1 rounded bg-obsidian-900 border border-white/10 text-[10px] font-mono text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap shadow-xl">
                Memory
              </span>
            </button>

            <button
              onClick={() => {
                onToggle();
                setActiveTab("audit");
              }}
              title="Immutable Audit Ledger"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-core-cyan/10 hover:text-core-cyan hover:border hover:border-core-cyan/30 transition-all group relative"
            >
              <Activity className="w-4 h-4" />
              <span className="absolute left-12 px-2 py-1 rounded bg-obsidian-900 border border-white/10 text-[10px] font-mono text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap shadow-xl">
                Audit
              </span>
            </button>

            <button
              onClick={() => {
                onToggle();
                setActiveTab("knowledge");
              }}
              title="Retrieval Governance"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-400 hover:border hover:border-emerald-500/30 transition-all group relative"
            >
              <BookOpen className="w-4 h-4" />
              <span className="absolute left-12 px-2 py-1 rounded bg-obsidian-900 border border-white/10 text-[10px] font-mono text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap shadow-xl">
                Policy
              </span>
            </button>
          </div>

          {/* Bottom pulse beacon & quick logout */}
          <div className="flex flex-col items-center gap-3">
            {onLogout && (
              <button
                onClick={onLogout}
                title="Lock Session / Log Out"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400/80 hover:bg-rose-500/15 hover:text-rose-300 hover:border hover:border-rose-500/30 transition-all group relative"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="absolute right-12 px-2 py-1 rounded bg-obsidian-900 border border-rose-500/30 text-[10px] font-mono text-rose-300 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap shadow-xl">
                  Log Out
                </span>
              </button>
            )}
            <span className="relative flex h-2 w-2" title="System Active">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-core-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-core-cyan shadow-[0_0_6px_#00f0ff]"></span>
            </span>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/10 bg-obsidian-900/80 text-xs font-mono">
            <button
              onClick={() => setActiveTab("products")}
              className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === "products"
                  ? "bg-core-cyan/15 text-core-cyan border border-core-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.2)] font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[10px]">Products</span>
            </button>
            <button
              onClick={() => setActiveTab("memory")}
              className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === "memory"
                  ? "bg-core-violet/20 text-core-violet border border-core-violet/40 shadow-[0_0_12px_rgba(139,92,246,0.2)] font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="text-[10px]">Memory</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === "audit"
                  ? "bg-amber-400/15 text-amber-400 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px]">Audit</span>
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                activeTab === "knowledge"
                  ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.2)] font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[10px]">Policy</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2">
            {/* TAB 1: CONNECTED PRODUCTS */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                  <span className="tracking-wider uppercase font-semibold text-gray-300">
                    FEDERATED BUS ({products.length})
                  </span>
                  <span className="text-[10px] text-core-cyan font-bold px-2 py-0.5 rounded-full bg-core-cyan/10 border border-core-cyan/30">
                    HOT-PLUG READY
                  </span>
                </div>

                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl surface-hud border border-white/10 hover:border-core-cyan/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-mono">
                            {prod.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-core-cyan border border-core-cyan/30">
                            v{prod.version}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">{prod.description}</p>
                      </div>
                      <span className="relative flex h-2 w-2 shrink-0 mt-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                      </span>
                    </div>

                    {/* Capabilities list */}
                    <div className="pt-2.5 border-t border-white/10 space-y-1.5">
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        // Exposed Capabilities
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                        {prod.capabilities.map((cap) => (
                          <div
                            key={cap.id}
                            className="px-2 py-1 rounded-lg bg-core-cyan/10 border border-core-cyan/20 text-core-cyan flex items-center gap-1 text-[10.5px] truncate"
                          >
                            <ChevronRight className="w-2.5 h-2.5 text-core-cyan shrink-0" />
                            <span className="truncate">{cap.name.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Future Ecosystem Roadmap Card */}
                <div className="p-3.5 rounded-2xl surface-hud border border-dashed border-white/15 text-xs text-gray-400 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-core-violet" />
                    <span>Ecosystem Federation Pipeline</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10.5px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
                      + Workforce Bus
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
                      + Menu Matrix
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10">
                      + Campaign Dispatch
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MULTI-TIER MEMORY INSPECTOR */}
            {activeTab === "memory" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className="tracking-wider uppercase font-semibold text-gray-300">
                    MEMORY MATRIX
                  </span>
                  <span className="text-[10px] font-bold text-core-violet px-2 py-0.5 rounded-full bg-core-violet/10 border border-core-violet/30">
                    {memories.length} RECORDS PERSISTED
                  </span>
                </div>

                <div className="space-y-2.5">
                  {memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3.5 rounded-2xl surface-hud border border-white/10 text-xs space-y-2.5 relative group hover:border-core-violet/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            mem.type === "company_memory"
                              ? "bg-core-violet/20 text-core-violet border border-core-violet/40"
                              : mem.type === "task_memory"
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                              : mem.type === "user_preference"
                              ? "bg-core-cyan/20 text-core-cyan border border-core-cyan/40"
                              : "bg-gray-500/20 text-gray-300 border border-gray-500/40"
                          }`}
                        >
                          {mem.type.replace("_", " ")}
                        </span>

                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg p-1.5 transition-all opacity-70 group-hover:opacity-100"
                          title="Prune / Delete Memory"
                          aria-label="Delete Memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="font-mono text-white text-[12px] font-semibold">
                        {mem.key}
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed font-sans">
                        {mem.content}
                      </p>

                      <div className="space-y-1 pt-1.5 border-t border-white/5 font-mono text-[10px]">
                        <div className="flex items-center justify-between text-gray-400">
                          <span>Confidence Factor</span>
                          <span className="text-white font-bold">{(mem.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-core-cyan to-core-violet"
                            style={{ width: `${mem.confidence * 100}%` }}
                          />
                        </div>
                        <div className="text-right text-gray-500 pt-0.5">
                          {new Date(mem.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: IMMUTABLE AUDIT LOG */}
            {activeTab === "audit" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className="tracking-wider uppercase font-semibold text-gray-300">
                    IMMUTABLE LEDGER
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    ZERO SECRETS EXPOSED
                  </span>
                </div>

                <div className="space-y-2.5">
                  {auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-mono surface-hud rounded-2xl border border-white/10">
                      No tool operations executed yet in this session.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl surface-hud border border-white/10 text-xs space-y-2 font-mono hover:border-core-cyan/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-core-cyan text-[11.5px] truncate max-w-[200px]">
                            {log.toolName}
                          </span>
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              log.executionStatus === "success"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {log.executionStatus}
                          </span>
                        </div>

                        {log.resultSummary && (
                          <p className="text-gray-300 text-[11px] font-sans leading-relaxed">
                            {log.resultSummary}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 border-t border-white/5">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                            {log.durationMs}ms latency
                          </span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: COMPANY POLICIES & KNOWLEDGE */}
            {activeTab === "knowledge" && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                  <span className="tracking-wider uppercase font-semibold text-gray-300">
                    RETRIEVAL GOVERNANCE
                  </span>
                  <span className="text-[10px] text-core-violet font-bold px-2 py-0.5 rounded-full bg-core-violet/10 border border-core-violet/30">
                    ENFORCED
                  </span>
                </div>

                <div className="p-4 rounded-2xl surface-hud border border-white/10 hover:border-core-cyan/30 transition-all space-y-2.5">
                  <div className="flex items-center gap-2 text-core-cyan font-semibold text-xs font-mono">
                    <Shield className="w-4 h-4 text-core-cyan" />
                    <span>// SHIELD.v1: OUTBOUND GATE</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed font-sans">
                    Outbound communications to restaurant managers must be staged as drafts and require explicit human-in-the-loop authorization.
                  </p>
                </div>

                <div className="p-4 rounded-2xl surface-hud border border-white/10 hover:border-core-violet/30 transition-all space-y-2.5">
                  <div className="flex items-center gap-2 text-core-violet font-semibold text-xs font-mono">
                    <BookOpen className="w-4 h-4 text-core-violet" />
                    <span>// SOP.v2: DECLINING PACING</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed font-sans">
                    Venues exhibiting &gt;20% weekly drop trigger an automated recovery campaign formulation with Chef&apos;s Table VIP priority.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Operator Identity & Logout Footer */}
          {currentUser && (
            <div className="p-3.5 border-t border-white/10 bg-obsidian-950/90 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-xs font-mono font-bold text-core-cyan shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-200 truncate">{currentUser.name}</div>
                  <div className="text-[10px] font-mono text-core-cyan/80 truncate uppercase tracking-wider">{currentUser.role}</div>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-[11px] font-mono flex items-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
                  title="Lock Session / Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
    </>
  );
};

