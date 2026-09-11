"use client";

import React, { useState } from "react";
import {
  BarChart3,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { SeatbookingService } from "@/packages/products/seatbooking/data";
import { WORKFORCE_SCHEDULES } from "@/packages/products/workforce/tools";

interface AnalyticsWorkspaceProps {
  onReturnToCore: () => void;
  onSendDirective: (text: string) => void;
}

export const AnalyticsWorkspace: React.FC<AnalyticsWorkspaceProps> = ({
  onReturnToCore,
  onSendDirective,
}) => {
  const [activeTab, setActiveTab] = useState<"executive" | "crossproduct">("executive");

  const restaurants = SeatbookingService.getAllRestaurants("org_acme_corp");
  const surgingProperties = restaurants.filter((r) => r.weeklyTrendPercent > 0);

  const crossCorrelations = surgingProperties.map((r) => {
    const sched = WORKFORCE_SCHEDULES.find((s) => s.restaurantId === r.id);
    return {
      restaurant: r,
      schedule: sched,
      hasDeficit: sched && sched.deficitCount < 0,
      deficit: sched ? Math.abs(sched.deficitCount) : 0,
    };
  }).filter((c) => c.hasDeficit);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-gray-100 pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 surface-hud rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-core-cyan/10 border border-core-cyan/30 flex items-center justify-center text-core-cyan shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-wide">Prosis Analytics Workspace</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/15 border border-core-cyan/30 text-core-cyan font-medium tracking-wider">
                ● v1.0.0 ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Cross-product telemetry correlation, revenue pacing &amp; operational benchmarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendDirective("Find restaurants with increasing bookings but insufficient staff")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-hud hover:border-core-cyan/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-core-cyan" />
            <span>Cross-Product AI</span>
          </button>
          <button
            onClick={onReturnToCore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all active:scale-95 border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Prosis Core</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("executive")}
          className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all ${
            activeTab === "executive"
              ? "text-core-cyan border-b-2 border-core-cyan font-medium bg-core-cyan/[0.06] shadow-[0_0_12px_rgba(56,189,248,0.15)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Executive Pulse
        </button>
        <button
          onClick={() => setActiveTab("crossproduct")}
          className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all ${
            activeTab === "crossproduct"
              ? "text-rose-400 border-b-2 border-rose-400 font-medium bg-rose-500/[0.06] shadow-[0_0_12px_rgba(244,63,94,0.15)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Cross-Product Correlation ({crossCorrelations.length} Alerts)
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-core-cyan/30 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">TOTAL REVENUE PACED</div>
          <div className="text-xl font-bold text-white font-mono">$14,850</div>
        </div>
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-emerald-500/30 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">PORTFOLIO OCCUPANCY</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">88.4%</div>
        </div>
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-white/20 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">LABOR COST RATIO</div>
          <div className="text-xl font-bold text-white font-mono">28.4%</div>
        </div>
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500/50 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400">CROSS-PRODUCT ALERTS</div>
          <div className="text-xl font-bold text-rose-400 font-mono">{crossCorrelations.length}</div>
        </div>
      </div>

      {/* TAB: EXECUTIVE */}
      {activeTab === "executive" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 surface-hud rounded-2xl border border-white/10 hover:border-core-cyan/30 transition-all space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Seatbooking Pacing</h3>
                <span className="text-xs font-mono text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% DoD
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Total dining volume across 5 properties is tracking 395 covers today. 2 properties report surging reservations above +10% weekly trend.
              </p>
              <button
                onClick={() => onSendDirective("Show portfolio reservation analytics")}
                className="text-xs font-mono text-core-cyan hover:underline flex items-center gap-1 active:scale-95"
              >
                <span>Inspect Reservation Analytics</span>
                <span>→</span>
              </button>
            </div>

            <div className="p-5 surface-hud rounded-2xl border border-white/10 hover:border-core-violet/30 transition-all space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Workforce Utilization</h3>
                <span className="text-xs font-mono text-amber-400">Labor Deficit Alert</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                Labor scheduling shows deficits at peak dining hours. L&apos;Atelier Lumière and Aura Rooftop require additional floor staff to preserve guest satisfaction.
              </p>
              <button
                onClick={() => onSendDirective("Show workforce shift schedules")}
                className="text-xs font-mono text-core-violet hover:underline flex items-center gap-1 active:scale-95"
              >
                <span>Inspect Workforce Schedules</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CROSS-PRODUCT CORRELATION */}
      {activeTab === "crossproduct" && (
        <div className="space-y-4">
          <div className="p-5 surface-hud rounded-2xl border border-rose-500/40 bg-rose-500/[0.04] space-y-3 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>// COMPOUND TELEMETRY: SEATBOOKING + WORKFORCE + ANALYTICS</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Prosis AI identified {crossCorrelations.length} properties experiencing surging dining demand concurrently paired with severe staffing shortages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {crossCorrelations.map((corr) => (
              <div key={corr.restaurant.id} className="p-5 surface-hud rounded-2xl border border-rose-500/30 hover:border-rose-500/50 transition-all space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-base">{corr.restaurant.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{corr.restaurant.cuisine} · {corr.restaurant.location}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    ● CRITICAL DEFICIT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-3 bg-obsidian-975 border border-white/10 rounded-xl">
                    <div className="text-gray-400 text-[10px] uppercase tracking-wider">SEATBOOKING TREND</div>
                    <div className="text-emerald-400 font-bold text-sm">+{corr.restaurant.weeklyTrendPercent}% weekly</div>
                    <div className="text-gray-400 text-[10px]">{corr.restaurant.todayBookings} covers today</div>
                  </div>
                  <div className="p-3 bg-obsidian-975 border border-rose-500/20 rounded-xl">
                    <div className="text-rose-400 text-[10px] uppercase tracking-wider">WORKFORCE DEFICIT</div>
                    <div className="text-rose-400 font-bold text-sm">-{corr.deficit} staff deficit</div>
                    <div className="text-gray-400 text-[10px]">{corr.schedule?.scheduledHeadcount} of {corr.schedule?.requiredHeadcount} on duty</div>
                  </div>
                </div>

                <div className="text-xs text-gray-300 bg-obsidian-975/80 p-3 rounded-xl border border-white/10 font-sans">
                  <strong className="text-white font-mono uppercase text-[11px] text-core-cyan block mb-1">AI Recommendation:</strong> Deploy {corr.deficit} on-call servers to absorb +{corr.restaurant.weeklyTrendPercent}% reservation surge.
                </div>

                <button
                  onClick={() => onSendDirective(`Deploy on-call staff for ${corr.restaurant.name}`)}
                  className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-mono text-rose-200 transition-all active:scale-98"
                >
                  Draft Staffing Allocation Directive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

