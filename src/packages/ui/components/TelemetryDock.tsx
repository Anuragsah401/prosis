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
}

export const TelemetryDock: React.FC<TelemetryDockProps> = ({
  products,
  memories,
  auditLogs,
  onDeleteMemory,
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "memory" | "audit" | "knowledge">("products");

  return (
    <aside
      className={`fixed top-0 right-0 h-screen z-40 transition-all duration-300 ease-in-out border-l border-white/10 bg-obsidian-950/95 backdrop-blur-2xl flex flex-col ${
        isOpen ? "w-96 shadow-[0_0_50px_rgba(0,0,0,0.8)]" : "w-14"
      }`}
    >
      {/* Top Header / Toggle Bar */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-white/10">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          title={isOpen ? "Collapse Telemetry Dock" : "Expand Telemetry Dock"}
        >
          <Cpu className="w-5 h-5 text-cyan-400" />
          {isOpen && (
            <span className="font-mono text-xs font-semibold tracking-wider text-gray-200">
              OPERATING TELEMETRY
            </span>
          )}
        </button>

        {isOpen && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        )}
      </div>

      {/* When collapsed, show quick icon switcher */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-4 py-6 text-gray-500">
          <button
            onClick={() => {
              onToggle();
              setActiveTab("products");
            }}
            title="Connected Products"
            className="p-2 hover:text-cyan-400 transition-colors"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onToggle();
              setActiveTab("memory");
            }}
            title="Multi-Tier Memory"
            className="p-2 hover:text-cyan-400 transition-colors"
          >
            <Brain className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              onToggle();
              setActiveTab("audit");
            }}
            title="Immutable Audit Ledger"
            className="p-2 hover:text-cyan-400 transition-colors"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Expanded View */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/5 bg-obsidian-900/60 text-xs font-mono">
            <button
              onClick={() => setActiveTab("products")}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === "products"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[10px]">Products</span>
            </button>
            <button
              onClick={() => setActiveTab("memory")}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === "memory"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="text-[10px]">Memory</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === "audit"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px]">Audit</span>
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === "knowledge"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[10px]">Policy</span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: CONNECTED PRODUCTS */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
                  <span>REGISTERED PRODUCTS ({products.length})</span>
                  <span className="text-[10px] text-cyan-400">HOT-PLUG CAPABLE</span>
                </div>

                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-xl bg-obsidian-900 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-100">
                            {prod.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                            v{prod.version}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{prod.description}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    </div>

                    {/* Capabilities list */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                        Exposed Capabilities
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                        {prod.capabilities.map((cap) => (
                          <div
                            key={cap.id}
                            className="px-2 py-1 rounded bg-obsidian-850 border border-white/5 text-cyan-300/80 flex items-center gap-1"
                          >
                            <ChevronRight className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{cap.name.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Future Ecosystem Roadmap Card */}
                <div className="p-3 rounded-xl bg-obsidian-900/40 border border-dashed border-white/10 text-xs text-gray-400 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Prosis Ecosystem Bus
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                      + Prosis Workforce
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                      + Prosis Menu
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                      + Prosis Marketing
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MULTI-TIER MEMORY INSPECTOR */}
            {activeTab === "memory" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>PERSISTENT MEMORY TIERS</span>
                  <span className="text-[10px] text-gray-400">
                    {memories.length} records
                  </span>
                </div>

                <div className="space-y-2.5">
                  {memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3 rounded-xl bg-obsidian-900 border border-white/10 text-xs space-y-2 relative group hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium uppercase ${
                            mem.type === "company_memory"
                              ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                              : mem.type === "task_memory"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                              : mem.type === "user_preference"
                              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                              : "bg-gray-500/15 text-gray-300 border border-gray-500/20"
                          }`}
                        >
                          {mem.type.replace("_", " ")}
                        </span>

                        <button
                          onClick={() => onDeleteMemory(mem.id)}
                          className="text-gray-500 hover:text-ruby-400 transition-colors p-1 opacity-60 group-hover:opacity-100"
                          title="Prune / Delete Memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="font-mono text-gray-300 text-[11px] font-semibold">
                        {mem.key}
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {mem.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-white/5">
                        <span>Confidence: {(mem.confidence * 100).toFixed(0)}%</span>
                        <span>{new Date(mem.createdAt).toLocaleTimeString()}</span>
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
                  <span>IMMUTABLE AUDIT TRAIL</span>
                  <span className="text-[10px] text-cyan-400">ZERO SECRETS EXPOSED</span>
                </div>

                <div className="space-y-2">
                  {auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-mono">
                      No tool operations executed yet in this session.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-obsidian-900 border border-white/10 text-xs space-y-1.5 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-cyan-300">
                            {log.toolName}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              log.executionStatus === "success"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-ruby-500/15 text-ruby-400"
                            }`}
                          >
                            {log.executionStatus.toUpperCase()}
                          </span>
                        </div>

                        {log.resultSummary && (
                          <p className="text-gray-300 text-[11px] font-sans">
                            {log.resultSummary}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
                          <span>{log.durationMs}ms</span>
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
                <div className="text-xs text-gray-400 font-mono">
                  RETRIEVAL AUGMENTED GOVERNANCE
                </div>

                <div className="p-3 rounded-xl bg-obsidian-900 border border-white/10 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-medium">
                    <Shield className="w-4 h-4" />
                    <span>Outbound Campaign Guardrail</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Outbound communications to restaurant managers must be staged as drafts and require explicit human-in-the-loop authorization.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-obsidian-900 border border-white/10 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-violet-300 font-medium">
                    <BookOpen className="w-4 h-4" />
                    <span>Declining Cover Intervention SOP</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Venues exhibiting &gt;20% weekly drop trigger an automated recovery campaign formulation with Chef&apos;s Table VIP priority.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

