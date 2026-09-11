"use client";

import React from "react";
import {
  GitCompare,
  TrendingDown,
  User,
  Mail,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface VenueComparisonProfile {
  id: string;
  name: string;
  cuisine: string;
  managerName: string;
  managerEmail: string;
  weeklyTrendPercent: number;
  capacityBookedPercent: number;
  currentCovers: number;
  diagnosis: string;
  recommendedAction: string;
}

interface ComparisonSurfaceCardProps {
  venueA?: VenueComparisonProfile;
  venueB?: VenueComparisonProfile;
  onSelectAction?: (directive: string) => void;
  disabled?: boolean;
}

const DEFAULT_VENUE_A: VenueComparisonProfile = {
  id: "rest-02",
  name: "Cantina Bella",
  cuisine: "Tuscan Trattoria",
  managerName: "Elena Rostova",
  managerEmail: "elena@cantinabella.it",
  weeklyTrendPercent: -34.2,
  capacityBookedPercent: 58.0,
  currentCovers: 48,
  diagnosis: "Road construction on Via Veneto has restricted walk-in dinner footfall by ~35%.",
  recommendedAction: "Dispatch mid-week VIP re-engagement campaign offering chef's table pairings.",
};

const DEFAULT_VENUE_B: VenueComparisonProfile = {
  id: "rest-03",
  name: "Verdant Bistro",
  cuisine: "Botanical Farm-to-Table",
  managerName: "Marcus Vance",
  managerEmail: "marcus@verdantbistro.com",
  weeklyTrendPercent: -28.0,
  capacityBookedPercent: 64.0,
  currentCovers: 54,
  diagnosis: "Recent menu price adjustments increased dinner cancellation rates by 17%.",
  recommendedAction: "Activate Seatbooking dynamic waitlist auto-release and test tasting menu promotion.",
};

export const ComparisonSurfaceCard: React.FC<ComparisonSurfaceCardProps> = ({
  venueA = DEFAULT_VENUE_A,
  venueB = DEFAULT_VENUE_B,
  onSelectAction,
  disabled = false,
}) => {
  return (
    <div className="my-5 rounded-3xl surface-hud p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden text-gray-200 border border-core-violet/30 animate-fade-in backdrop-blur-xl">
      {/* Top Ambient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-amber-400 shadow-[0_0_10px_#8b5cf6]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-core-violet/15 border border-core-violet/30 text-core-violet shadow-[0_0_10px_rgba(139,92,246,0.2)]">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-core-violet">
                COMPARATIVE SURFACE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-white/5 border border-white/10 text-gray-400">
                Side-by-Side Analysis
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mt-0.5">
              {venueA.name} vs. {venueB.name}
            </h3>
          </div>
        </div>

        {onSelectAction && (
          <button
            onClick={() => onSelectAction("Email the owner")}
            disabled={disabled}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium text-white bg-core-violet/20 hover:bg-core-violet/30 border border-core-violet/40 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <span>Email the owner</span>
            <ArrowRight className="w-3 h-3 text-core-violet" />
          </button>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Venue A Card */}
        <div className="p-4 rounded-2xl bg-obsidian-975/80 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white text-sm">
                {venueA.name}
              </h4>
              <p className="text-[11px] text-gray-400">{venueA.cuisine}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {venueA.weeklyTrendPercent}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-gray-400">
              <span>Capacity Paced:</span>
              <span className="font-semibold text-white">
                {venueA.capacityBookedPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>Today&apos;s Covers:</span>
              <span className="font-semibold text-white">
                {venueA.currentCovers} guests
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>General Manager:</span>
              <span className="font-medium text-gray-200">
                {venueA.managerName}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11.5px] leading-relaxed text-gray-300">
            <span className="font-semibold text-core-violet block mb-0.5 font-mono text-[10.5px] uppercase">
              // Diagnosis:
            </span>
            {venueA.diagnosis}
          </div>
        </div>

        {/* Venue B Card */}
        <div className="p-4 rounded-2xl bg-obsidian-975/80 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white text-sm">
                {venueB.name}
              </h4>
              <p className="text-[11px] text-gray-400">{venueB.cuisine}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              {venueB.weeklyTrendPercent}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-gray-400">
              <span>Capacity Paced:</span>
              <span className="font-semibold text-white">
                {venueB.capacityBookedPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>Today&apos;s Covers:</span>
              <span className="font-semibold text-white">
                {venueB.currentCovers} guests
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>General Manager:</span>
              <span className="font-medium text-gray-200">
                {venueB.managerName}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11.5px] leading-relaxed text-gray-300">
            <span className="font-semibold text-core-cyan block mb-0.5 font-mono text-[10.5px] uppercase">
              // Diagnosis:
            </span>
            {venueB.diagnosis}
          </div>
        </div>
      </div>

      {/* Surface Action Shortcuts */}
      {onSelectAction && (
        <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-mono text-gray-400 self-center mr-1">
            Next steps:
          </span>
          <button
            onClick={() => onSelectAction("Email the owner")}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-core-violet/20 border border-white/10 hover:border-core-violet/40 text-gray-200 hover:text-white font-mono transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Email Elena Rostova (Cantina Bella)</span>
            <ArrowRight className="w-3 h-3 text-core-violet" />
          </button>
          <button
            onClick={() => onSelectAction("Prepare emails for those restaurants")}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-core-cyan/20 border border-white/10 hover:border-core-cyan/40 text-gray-200 hover:text-white font-mono transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Prepare emails for both venues</span>
            <ArrowRight className="w-3 h-3 text-core-cyan" />
          </button>
        </div>
      )}
    </div>
  );
};

