"use client";

import React, { useState } from "react";
import { MessageTurn } from "@prosis/orchestrator";
import { ApprovalCard } from "./ApprovalCard";
import { TaskProgressCard } from "./TaskProgressCard";
import { ProactiveBriefingCard } from "./ProactiveBriefingCard";
import { AutonomySettingsModal } from "./AutonomySettingsModal";
import { AnalyticsSurfaceCard } from "./surfaces/AnalyticsSurfaceCard";
import { ComparisonSurfaceCard } from "./surfaces/ComparisonSurfaceCard";
import { EmailComposerSurfaceCard } from "./surfaces/EmailComposerSurfaceCard";
import {
  Sparkles,
  User,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  UtensilsCrossed,
  Star,
  MapPin,
  Mail,
  Phone,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface CinematicConversationProps {
  turns: MessageTurn[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelectFollowUp: (text: string) => void;
  isProcessing: boolean;
  activeExecutionStatus?: string;
}

export const CinematicConversation: React.FC<CinematicConversationProps> = ({
  turns,
  onApprove,
  onReject,
  onSelectFollowUp,
  isProcessing,
  activeExecutionStatus = "Synthesizing cross-product intelligence...",
}) => {
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [showAutonomyModal, setShowAutonomyModal] = useState(false);
  const [proactiveSettings, setProactiveSettings] = useState({
    notificationsEnabled: true,
    quietHours: { enabled: false, start: "22:00", end: "07:00", timezone: "UTC" },
    monitoredProducts: ["seatbooking", "workforce", "marketing", "menu", "analytics"],
    importanceThreshold: 0.6,
    autonomyLevel: 1 as const,
    automaticActionsAllowed: ["cache_warming", "analytics_precompute"],
  });

  const toggleReasoning = (id: string) => {
    setExpandedReasoning((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 py-6">
      {turns.map((turn, index) => {
        const isProsis = turn.role === "prosis";
        const isExpanded = !!expandedReasoning[turn.id || index];

        return (
          <article
            key={turn.id || index}
            className={`group relative transition-all duration-300 ${
              isProsis
                ? "surface-hud hover:surface-hud-glow p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-core-cyan/40 shadow-[0_4px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                : "surface-glass p-4 sm:p-5 rounded-2xl border border-white/10 ml-auto max-w-2xl bg-white/[0.02]"
            }`}
            aria-label={isProsis ? "Prosis AI Response" : "Operator Input"}
          >
            {/* Holographic Header Telemetry */}
            <header className="flex items-center justify-between gap-3 mb-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                {isProsis ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-core-cyan opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-core-cyan shadow-[0_0_8px_#00f0ff]"></span>
                    </span>
                    <span className="font-bold tracking-widest text-[11px] bg-gradient-to-r from-core-cyan via-white to-core-violet bg-clip-text text-transparent">
                      PROSIS.AI // CORE ENGINE
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="font-semibold tracking-wider text-[11px] uppercase text-gray-300">
                      OPERATOR // DIRECTIVE
                    </span>
                  </div>
                )}

                {turn.activeTool && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-core-cyan/10 border border-core-cyan/30 text-core-cyan">
                    {turn.activeTool}
                  </span>
                )}
              </div>

              <time className="text-gray-500 text-[10px] font-mono">
                {new Date(turn.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </time>
            </header>

            {/* Content Body (Cinematic typography) */}
            <div className="text-sm sm:text-base leading-relaxed text-gray-200 font-sans space-y-3.5 selection:bg-core-cyan/30">
              {turn.content.split("\n\n").map((paragraph, pIdx) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h4
                      key={pIdx}
                      className="font-semibold text-lg text-white tracking-tight mt-3 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-core-cyan shadow-[0_0_6px_#00f0ff]" />
                      {paragraph.replace("### ", "")}
                    </h4>
                  );
                }
                if (paragraph.startsWith("> ")) {
                  return (
                    <blockquote
                      key={pIdx}
                      className="pl-4 py-2 border-l-2 border-core-cyan bg-core-cyan/[0.03] rounded-r text-gray-300 italic text-sm"
                    >
                      {paragraph.replace("> ", "")}
                    </blockquote>
                  );
                }
                return (
                  <p key={pIdx} className="whitespace-pre-line text-gray-300 leading-relaxed font-normal">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Safe Expandable Reasoning Summary */}
            {isProsis && turn.activeTool && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => toggleReasoning(turn.id || String(index))}
                  className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-core-cyan transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-core-cyan" />
                  <span className="tracking-wider uppercase text-[11px]">
                    {isExpanded ? "[ HIDE REASONING MATRIX ]" : "[ COGNITIVE TRACE // VIEW MATRIX ]"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-core-cyan" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-core-cyan" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 p-4 rounded-xl bg-obsidian-975 border border-core-cyan/20 font-mono text-xs text-gray-300 space-y-2 shadow-inner">
                    <div className="flex items-center gap-2 text-core-cyan text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>SECURITY GUARD: ZERO UNRESTRICTED SQL ACCESS</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-400">
                      <div>TARGET PRODUCT: <span className="text-white font-medium">Seatbooking SaaS</span></div>
                      <div>INVOKED TOOL: <span className="text-core-cyan font-medium">{turn.activeTool}</span></div>
                      <div>AUTHORIZATION: <span className="text-emerald-400 font-medium">VERIFIED (Server-side RBAC)</span></div>
                      <div>TENANT CONTEXT: <span className="text-gray-300 font-medium">Isolated</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================================== */}
            {/* RICH UI: SEATBOOKING RESERVATION LIST WIDGET */}
            {/* ==================================================================== */}
            {(turn.activeTool === "seatbooking_getReservations" || turn.activeTool === "getReservations") &&
              Array.isArray(turn.toolResult) && (
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
                    <span className="uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-core-cyan" />
                      Allocated Bookings ({turn.toolResult.length})
                    </span>
                    <span className="text-[11px] text-gray-500">Live Seatbooking Schedule</span>
                  </div>

                  <div className="surface-glass rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                    {(turn.toolResult as any[]).map((res) => (
                      <div
                        key={res.id}
                        className="p-4 hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-100 text-sm">{res.customerName}</span>
                            {res.vip && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-400" /> VIP
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                                res.status === "seated"
                                  ? "bg-core-cyan/15 text-core-cyan border border-core-cyan/30"
                                  : res.status === "confirmed"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : res.status === "cancelled"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>

                          <div className="text-xs text-gray-400 flex items-center gap-3">
                            <span className="text-gray-300 font-medium">{res.restaurantName}</span>
                            <span className="text-gray-500">•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Users className="w-3 h-3 text-gray-400" /> {res.partySize} guests
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="flex items-center gap-1 font-mono text-core-cyan">
                              <Clock className="w-3 h-3" /> {res.timeSlot}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400 font-mono">{res.date}</span>
                          </div>

                          {res.notes && (
                            <p className="text-xs text-gray-400 italic pt-0.5">
                              Note: {res.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right font-mono text-xs text-gray-500 shrink-0">
                          ID: <span className="text-gray-300">{res.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* ==================================================================== */}
            {/* RICH UI: SEATBOOKING RESTAURANT CARDS WIDGET */}
            {/* ==================================================================== */}
            {(turn.activeTool === "seatbooking_getRestaurants" ||
              turn.activeTool === "getRestaurants" ||
              turn.activeTool === "seatbooking_getRestaurant" ||
              turn.activeTool === "getRestaurant") &&
              Boolean(turn.toolResult) && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(turn.toolResult) ? turn.toolResult : [turn.toolResult]).map(
                    (rest: any) => (
                      <div
                        key={rest.id}
                        className={`surface-glass rounded-2xl p-4 border-l-2 space-y-3 ${
                          rest.status === "alert"
                            ? "border-core-ruby/80"
                            : "border-core-emerald/80"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-100 text-sm flex items-center gap-2">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-core-cyan" />
                              {rest.name}
                            </h5>
                            <span className="text-xs text-gray-400">{rest.cuisine}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                              rest.weeklyTrendPercent >= 0
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-core-ruby/10 text-core-ruby border border-core-ruby/30"
                            }`}
                          >
                            {rest.weeklyTrendPercent >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {rest.weeklyTrendPercent > 0 ? `+${rest.weeklyTrendPercent}%` : `${rest.weeklyTrendPercent}%`}
                          </span>
                        </div>

                        {/* Capacity Pacing Progress Indicator */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-gray-400">Capacity Paced</span>
                            <span className="text-gray-200 font-bold">{rest.capacityBookedPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                rest.capacityBookedPercent > 80
                                  ? "bg-emerald-400"
                                  : rest.capacityBookedPercent > 50
                                  ? "bg-core-cyan"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${Math.min(rest.capacityBookedPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-1 text-xs text-gray-400 space-y-1 font-mono">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="truncate">{rest.location}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>GM: {rest.managerName}</span>
                            <span>{rest.todayBookings} bookings today</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            {/* ==================================================================== */}
            {/* RICH UI: SEATBOOKING ANALYTICS CARDS & SPARKLINE */}
            {/* ==================================================================== */}
            {(turn.activeTool === "seatbooking_getRestaurantAnalytics" ||
              turn.activeTool === "seatbooking_getReservationAnalytics" ||
              turn.activeTool === "getRestaurantAnalytics" ||
              turn.activeTool === "getReservationAnalytics") &&
              Boolean(turn.toolResult) && (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="surface-glass rounded-2xl p-4">
                      <span className="text-[10px] font-mono uppercase text-gray-400">Total Bookings</span>
                      <div className="text-2xl font-bold font-mono text-core-cyan mt-1">
                        {(turn.toolResult as any).totalBookings}
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">
                        {(turn.toolResult as any).totalCovers} total covers
                      </span>
                    </div>

                    <div className="surface-glass rounded-2xl p-4">
                      <span className="text-[10px] font-mono uppercase text-gray-400">Capacity Pacing</span>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                        {(turn.toolResult as any).capacityBookedPercent ?? (turn.toolResult as any).occupancyRatePercent}%
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">Venue occupancy</span>
                    </div>

                    <div className="surface-glass rounded-2xl p-4">
                      <span className="text-[10px] font-mono uppercase text-gray-400">Cancellation Rate</span>
                      <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                        {(turn.toolResult as any).cancellationRatePercent ?? (turn.toolResult as any).overallCancellationRatePercent}%
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">Portfolio pacing</span>
                    </div>

                    <div className="surface-glass rounded-2xl p-4">
                      <span className="text-[10px] font-mono uppercase text-gray-400">Weekly Delta</span>
                      <div className="text-2xl font-bold font-mono text-gray-100 mt-1">
                        {(turn.toolResult as any).weeklyTrendPercent ?? (turn.toolResult as any).weeklyPacingTrendPercent}%
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">vs Previous 7 Days</span>
                    </div>
                  </div>

                  {/* Sparkline / Peak Hours telemetry */}
                  {(turn.toolResult as any).peakHours && (
                    <div className="surface-glass rounded-2xl p-3.5 flex items-center justify-between text-xs font-mono text-gray-400">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-core-cyan" /> Peak Service Hours:
                      </span>
                      <div className="flex gap-2">
                        {((turn.toolResult as any).peakHours as string[]).map((hr, hIdx) => (
                          <span key={hIdx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-core-cyan">
                            {hr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* ==================================================================== */}
            {/* RICH UI: SEATBOOKING CUSTOMER CRM PROFILE */}
            {/* ==================================================================== */}
            {(turn.activeTool === "seatbooking_getCustomer" || turn.activeTool === "getCustomer") &&
              Boolean(turn.toolResult) && (
                <div className="mt-5 surface-glass rounded-2xl p-5 border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-100 text-base">
                          {(turn.toolResult as any).name}
                        </h4>
                        {(turn.toolResult as any).vip && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> VIP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-3 mt-1 font-mono">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {(turn.toolResult as any).email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {(turn.toolResult as any).phone}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] uppercase text-gray-500">Total Covers</span>
                      <div className="text-xl font-bold text-core-cyan">{(turn.toolResult as any).totalVisits}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-gray-400 font-mono block">Favorite Venue:</span>
                      <span className="text-gray-200 font-medium">{(turn.toolResult as any).favoriteVenue || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-mono block">Dietary & Preferences:</span>
                      <span className="text-gray-200 font-medium">{(turn.toolResult as any).dietaryNotes || "None"}</span>
                    </div>
                  </div>
                </div>
              )}

            {/* Structured Metric Widget for Daily Briefing */}
            {turn.activeTool === "seatbooking_getDailyBriefing" &&
              Boolean(turn.toolResult) && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="surface-glass rounded-2xl p-4">
                    <span className="text-[10.5px] font-mono uppercase text-gray-400">Total Covers</span>
                    <div className="text-2xl font-bold font-mono text-core-cyan mt-1">
                      {(turn.toolResult as any).totalCoversToday}
                    </div>
                  </div>
                  <div className="surface-glass rounded-2xl p-4">
                    <span className="text-[10.5px] font-mono uppercase text-gray-400">Occupancy Paced</span>
                    <div className="text-2xl font-bold font-mono text-core-emerald mt-1">
                      {(turn.toolResult as any).occupancyRatePercent}%
                    </div>
                  </div>
                  <div className="surface-glass rounded-2xl p-4">
                    <span className="text-[10.5px] font-mono uppercase text-gray-400">Alert Properties</span>
                    <div className="text-2xl font-bold font-mono text-core-amber mt-1">
                      {(turn.toolResult as any).decliningRestaurantsCount}
                    </div>
                  </div>
                  <div className="surface-glass rounded-2xl p-4">
                    <span className="text-[10.5px] font-mono uppercase text-gray-400">Projected Rev</span>
                    <div className="text-2xl font-bold font-mono text-gray-100 mt-1">
                      ${(turn.toolResult as any).revenuePacedUsd.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

            {/* Structured Card for Declining Venues */}
            {turn.activeTool === "seatbooking_getDecliningRestaurants" &&
              Array.isArray(turn.toolResult) && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(turn.toolResult as any[]).map((rest) => (
                    <div
                      key={rest.id}
                      className="surface-glass rounded-2xl p-4 border-l-2 border-core-ruby/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-100 text-sm">{rest.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-core-ruby/10 text-core-ruby border border-core-ruby/30 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          {rest.weeklyTrendPercent}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center justify-between">
                        <span>GM: {rest.managerName}</span>
                        <span className="font-mono text-gray-300">Pacing: {rest.capacityBookedPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Multi-Step Task Progress Card */}
            {turn.task && (
              <div className="mt-6">
                <TaskProgressCard
                  task={turn.task}
                  onApproveTask={onApprove}
                  onCancelTask={(_taskId) => {
                    if (turn.pendingApproval) onReject(turn.pendingApproval.id);
                  }}
                  onRetryStep={(_taskId, _stepIdx) => {
                    fetch(`/api/v1/tasks/${_taskId}/retry`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ stepIndex: _stepIdx }),
                    }).catch(console.error);
                  }}
                />
              </div>
            )}

            {/* Inline Human-in-the-Loop Approval Card (for standalone operations) */}
            {turn.pendingApproval && !turn.task && (
              <div className="mt-6">
                <ApprovalCard
                  request={turn.pendingApproval}
                  onApprove={onApprove}
                  onReject={onReject}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Proactive 3-Point Briefing Card */}
            {turn.proactiveBriefing && (
              <div className="mt-6">
                <ProactiveBriefingCard
                  briefing={turn.proactiveBriefing}
                  onInvestigate={(directive) => onSelectFollowUp(directive)}
                  onOpenAutonomySettings={() => setShowAutonomyModal(true)}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Dynamic Contextual Surface: Portfolio & Restaurant Analytics */}
            {turn.analyticsData && (
              <div className="mt-6">
                <AnalyticsSurfaceCard
                  venues={turn.analyticsData.venues}
                  onSelectAction={(directive) => onSelectFollowUp(directive)}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Dynamic Contextual Surface: Comparative Venue Matrix */}
            {turn.comparisonData && (
              <div className="mt-6">
                <ComparisonSurfaceCard
                  venueA={turn.comparisonData.venueA}
                  venueB={turn.comparisonData.venueB}
                  onSelectAction={(directive) => onSelectFollowUp(directive)}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Dynamic Contextual Surface: Executive Email Composer */}
            {turn.emailComposerData && (
              <div className="mt-6">
                <EmailComposerSurfaceCard
                  draft={turn.emailComposerData}
                  onSend={(email, subject) => {
                    onSelectFollowUp(`Proceed to send email to ${email} with subject: ${subject}`);
                  }}
                  onCancel={() => {
                    onSelectFollowUp("Dismiss email draft and return to overview");
                  }}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Contextual Follow-Up Suggestions */}
            {isProsis && turn.suggestedFollowUps && turn.suggestedFollowUps.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-3 border-t border-white/5">
                {turn.suggestedFollowUps.map((suggestion, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => onSelectFollowUp(suggestion)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-full surface-hud hover:border-core-cyan/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] text-xs font-mono text-gray-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 hover:-translate-y-0.5"
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="w-3 h-3 text-core-cyan" />
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}

      {/* Safe Live Execution Telemetry (Non chain-of-thought) */}
      {isProcessing && (
        <div className="surface-hud p-4 rounded-2xl border border-core-cyan/30 flex items-center gap-3 py-3 shadow-[0_0_20px_rgba(0,240,255,0.15)] animate-pulse">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-core-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-core-cyan shadow-[0_0_8px_#00f0ff]"></span>
          </span>
          <span className="text-xs font-mono text-core-cyan tracking-wider font-semibold uppercase">
            {activeExecutionStatus}
          </span>
        </div>
      )}

      {/* Autonomy & Proactive Settings Modal */}
      <AutonomySettingsModal
        isOpen={showAutonomyModal}
        onClose={() => setShowAutonomyModal(false)}
        settings={proactiveSettings}
        onSaveSettings={(updated) => {
          setProactiveSettings((prev: any) => ({ ...prev, ...updated }));
          fetch("/api/v1/proactive/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          }).catch(console.error);
        }}
      />
    </div>
  );
};
