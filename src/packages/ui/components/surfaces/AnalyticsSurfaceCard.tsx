"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Users,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

interface VenuePerformanceItem {
  id: string;
  name: string;
  cuisine: string;
  capacityPercent: number;
  weeklyTrendPercent: number;
  projectedRevenue: number;
  status: "strong" | "stable" | "declining";
}

interface AnalyticsSurfaceCardProps {
  venues?: VenuePerformanceItem[];
  onSelectAction?: (directive: string) => void;
  disabled?: boolean;
}

const DEFAULT_VENUES: VenuePerformanceItem[] = [
  {
    id: "rest-01",
    name: "L'Atelier Lumière",
    cuisine: "Contemporary French",
    capacityPercent: 94.2,
    weeklyTrendPercent: +18.4,
    projectedRevenue: 5400,
    status: "strong",
  },
  {
    id: "rest-04",
    name: "Kuro Omakase",
    cuisine: "Edomae Sushi",
    capacityPercent: 89.0,
    weeklyTrendPercent: +8.2,
    projectedRevenue: 4200,
    status: "strong",
  },
  {
    id: "rest-05",
    name: "Aura Rooftop Lounge",
    cuisine: "Small Plates & Mixology",
    capacityPercent: 82.5,
    weeklyTrendPercent: +12.1,
    projectedRevenue: 3100,
    status: "stable",
  },
  {
    id: "rest-03",
    name: "Verdant Bistro",
    cuisine: "Farm-to-Table Botanical",
    capacityPercent: 64.0,
    weeklyTrendPercent: -28.0,
    projectedRevenue: 1350,
    status: "declining",
  },
  {
    id: "rest-02",
    name: "Cantina Bella",
    cuisine: "Tuscan Trattoria",
    capacityPercent: 58.0,
    weeklyTrendPercent: -34.2,
    projectedRevenue: 800,
    status: "declining",
  },
];

export const AnalyticsSurfaceCard: React.FC<AnalyticsSurfaceCardProps> = ({
  venues = DEFAULT_VENUES,
  onSelectAction,
  disabled = false,
}) => {
  return (
    <div className="my-5 rounded-3xl bg-white border border-black/[0.08] p-5 shadow-command-card relative overflow-hidden text-charcoal-900 animate-fade-in">
      {/* Top Ambient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-cyan-700">
                DYNAMIC ANALYTICS SURFACE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-bone-100 text-charcoal-600">
                Live Portfolio Telemetry
              </span>
            </div>
            <h3 className="text-sm font-semibold text-charcoal-900 mt-0.5">
              Portfolio Performance & Capacity Pacing
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSelectAction && (
            <button
              onClick={() => onSelectAction("Compare these two")}
              disabled={disabled}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-charcoal-700 bg-bone-100 hover:bg-bone-200 border border-black/10 transition-all flex items-center gap-1 active:scale-95"
            >
              <span>Compare Venues</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Venue Performance Table */}
      <div className="space-y-2.5 mb-4">
        {venues.map((v) => {
          const isDeclining = v.weeklyTrendPercent < 0;
          return (
            <div
              key={v.id}
              className="p-3 rounded-2xl bg-bone-50/60 border border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-[180px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-charcoal-900 text-[13px]">
                    {v.name}
                  </span>
                  {isDeclining && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                      ATTENTION
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-charcoal-400 font-sans">
                  {v.cuisine}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between text-[10.5px] text-charcoal-500 font-mono mb-1">
                  <span>Capacity</span>
                  <span className="font-semibold text-charcoal-800">
                    {v.capacityPercent}%
                  </span>
                </div>
                <div className="w-full bg-bone-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDeclining ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${v.capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Trend & Revenue */}
              <div className="flex items-center gap-4 text-right">
                <div className="min-w-[70px]">
                  <div
                    className={`font-mono text-xs font-bold flex items-center justify-end gap-0.5 ${
                      isDeclining ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {isDeclining ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    <span>{v.weeklyTrendPercent > 0 ? `+${v.weeklyTrendPercent}%` : `${v.weeklyTrendPercent}%`}</span>
                  </div>
                  <span className="text-[10px] text-charcoal-400 font-mono">
                    vs Last Week
                  </span>
                </div>

                <div className="min-w-[80px]">
                  <span className="font-mono text-xs font-semibold text-charcoal-900">
                    ${v.projectedRevenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-charcoal-400 block font-mono">
                    Projected
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surface Action Shortcuts */}
      {onSelectAction && (
        <div className="pt-3 border-t border-black/[0.06] flex flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-mono text-charcoal-400 self-center mr-1">
            Contextual actions:
          </span>
          <button
            onClick={() => onSelectAction("Compare these two")}
            className="px-3 py-1.5 rounded-xl bg-bone-100 hover:bg-bone-200 text-charcoal-800 font-medium transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Compare Cantina Bella & Verdant Bistro</span>
            <ArrowRight className="w-3 h-3 text-cyan-600" />
          </button>
          <button
            onClick={() => onSelectAction("Email the owner")}
            className="px-3 py-1.5 rounded-xl bg-bone-100 hover:bg-bone-200 text-charcoal-800 font-medium transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Email the owner</span>
            <ArrowRight className="w-3 h-3 text-indigo-600" />
          </button>
        </div>
      )}
    </div>
  );
};

