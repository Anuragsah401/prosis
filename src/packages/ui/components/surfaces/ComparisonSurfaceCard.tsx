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
    <div className="my-5 rounded-3xl bg-white border border-black/[0.08] p-5 shadow-command-card relative overflow-hidden text-charcoal-900 animate-fade-in">
      {/* Top Ambient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-400 via-purple-500 to-amber-400" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-purple-700">
                COMPARATIVE SURFACE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-bone-100 text-charcoal-600">
                Side-by-Side Analysis
              </span>
            </div>
            <h3 className="text-sm font-semibold text-charcoal-900 mt-0.5">
              {venueA.name} vs. {venueB.name}
            </h3>
          </div>
        </div>

        {onSelectAction && (
          <button
            onClick={() => onSelectAction("Email the owner")}
            disabled={disabled}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>Email the owner</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Venue A Card */}
        <div className="p-4 rounded-2xl bg-bone-50/70 border border-black/[0.04] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-charcoal-900 text-sm">
                {venueA.name}
              </h4>
              <p className="text-[11px] text-charcoal-500">{venueA.cuisine}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {venueA.weeklyTrendPercent}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-charcoal-600">
              <span>Capacity Paced:</span>
              <span className="font-mono font-semibold text-charcoal-900">
                {venueA.capacityBookedPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-charcoal-600">
              <span>Today&apos;s Covers:</span>
              <span className="font-mono font-semibold text-charcoal-900">
                {venueA.currentCovers} guests
              </span>
            </div>
            <div className="flex items-center justify-between text-charcoal-600">
              <span>General Manager:</span>
              <span className="font-medium text-charcoal-800">
                {venueA.managerName}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-black/[0.04] text-[11.5px] leading-relaxed text-charcoal-700">
            <span className="font-semibold text-charcoal-900 block mb-0.5">
              Diagnosis:
            </span>
            {venueA.diagnosis}
          </div>
        </div>

        {/* Venue B Card */}
        <div className="p-4 rounded-2xl bg-bone-50/70 border border-black/[0.04] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-charcoal-900 text-sm">
                {venueB.name}
              </h4>
              <p className="text-[11px] text-charcoal-500">{venueB.cuisine}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {venueB.weeklyTrendPercent}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-charcoal-600">
              <span>Capacity Paced:</span>
              <span className="font-mono font-semibold text-charcoal-900">
                {venueB.capacityBookedPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-charcoal-600">
              <span>Today&apos;s Covers:</span>
              <span className="font-mono font-semibold text-charcoal-900">
                {venueB.currentCovers} guests
              </span>
            </div>
            <div className="flex items-center justify-between text-charcoal-600">
              <span>General Manager:</span>
              <span className="font-medium text-charcoal-800">
                {venueB.managerName}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-black/[0.04] text-[11.5px] leading-relaxed text-charcoal-700">
            <span className="font-semibold text-charcoal-900 block mb-0.5">
              Diagnosis:
            </span>
            {venueB.diagnosis}
          </div>
        </div>
      </div>

      {/* Surface Action Shortcuts */}
      {onSelectAction && (
        <div className="pt-3 border-t border-black/[0.06] flex flex-wrap gap-2 text-xs">
          <span className="text-[11px] font-mono text-charcoal-400 self-center mr-1">
            Next steps:
          </span>
          <button
            onClick={() => onSelectAction("Email the owner")}
            className="px-3 py-1.5 rounded-xl bg-bone-100 hover:bg-bone-200 text-charcoal-800 font-medium transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Email Elena Rostova (Cantina Bella)</span>
            <ArrowRight className="w-3 h-3 text-purple-600" />
          </button>
          <button
            onClick={() => onSelectAction("Prepare emails for those restaurants")}
            className="px-3 py-1.5 rounded-xl bg-bone-100 hover:bg-bone-200 text-charcoal-800 font-medium transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Prepare emails for both venues</span>
            <ArrowRight className="w-3 h-3 text-indigo-600" />
          </button>
        </div>
      )}
    </div>
  );
};

