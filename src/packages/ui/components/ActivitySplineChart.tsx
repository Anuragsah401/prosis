"use client";

import React, { useState } from "react";

export const ActivitySplineChart: React.FC = () => {
  const [activeRange, setActiveRange] = useState<"daily" | "weekly" | "monthly">("daily");

  return (
    <div className="card-neumorphic rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-charcoal-900 tracking-tight">
          Agent Activity
        </h3>

        {/* Filter Pill Switcher */}
        <div className="flex items-center p-1 rounded-full bg-black/[0.04] border border-black/[0.03] text-xs font-medium">
          <button
            onClick={() => setActiveRange("daily")}
            className={`px-3 py-1 rounded-full transition-all ${
              activeRange === "daily"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveRange("weekly")}
            className={`px-3 py-1 rounded-full transition-all ${
              activeRange === "weekly"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveRange("monthly")}
            className={`px-3 py-1 rounded-full transition-all ${
              activeRange === "monthly"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative h-[280px] w-full mt-2">
        {/* Y-Axis Labels & Horizontal Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[160, 120, 80, 40, "00"].map((label, idx) => (
            <div key={idx} className="flex items-center w-full">
              <span className="w-8 text-[11px] font-mono text-charcoal-400 select-none">
                {label}
              </span>
              <div className="flex-1 border-b border-dashed border-black/[0.06] ml-2" />
            </div>
          ))}
        </div>

        {/* Multi-Line Curves (SVG) */}
        <svg
          className="absolute inset-0 w-full h-[calc(100%-24px)] pl-10 pr-2 pt-1 pb-1 overflow-visible"
          viewBox="0 0 600 240"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Subtle Gradient Fills */}
            <linearGradient id="orangeGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 1. Grey baseline wave */}
          <path
            d="M 0,160 C 80,150 120,120 180,140 C 240,160 300,180 380,120 C 440,80 520,130 600,160"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 2. Vibrant Purple / Blue Curve */}
          <path
            d="M 0,210 C 100,210 140,195 200,170 C 270,140 330,85 400,85 C 470,85 540,115 600,150"
            fill="none"
            stroke="#5800FF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* 3. Vibrant Orange Curve */}
          <path
            d="M 0,210 C 80,210 120,195 200,155 C 270,115 320,65 370,45 C 420,25 480,22 600,22"
            fill="none"
            stroke="#FF6B00"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Vertical Orange Drop Line Indicator at ~x=370 */}
          <line
            x1="370"
            y1="45"
            x2="370"
            y2="240"
            stroke="#FF6B00"
            strokeWidth="2"
          />

          {/* Dot on Orange Curve */}
          <circle cx="370" cy="45" r="5" fill="#FF6B00" />
        </svg>

        {/* Floating Peak Tooltip Card */}
        <div
          className="absolute left-[38%] top-[20%] -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-2xl p-4 shadow-floating-badge border border-black/[0.06] backdrop-blur-md z-10 w-[200px] transition-transform duration-200 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <span className="text-[19px] font-bold text-charcoal-900 leading-none">
              +24,11%
            </span>
            <button className="text-charcoal-400 hover:text-charcoal-700 text-xs">
              ×
            </button>
          </div>
          <p className="text-[10.5px] text-charcoal-500 font-medium mt-1 leading-tight">
            Agent Executions (Peak Activity)
          </p>
        </div>

        {/* X-Axis Time Labels */}
        <div className="absolute bottom-0 inset-x-0 flex justify-between pl-10 pr-2 text-[11px] font-mono text-charcoal-400 select-none">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:59</span>
        </div>
      </div>
    </div>
  );
};

