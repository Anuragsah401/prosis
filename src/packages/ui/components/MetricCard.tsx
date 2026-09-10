"use client";

import React from "react";

interface MetricCardProps {
  value: string;
  label: string;
  badgeType: "radar" | "nodes" | "server" | "check";
  waveformHeights?: number[];
  activeColor?: string;
}

const DEFAULT_WAVEFORMS: Record<string, number[]> = {
  radar: [
    8, 14, 22, 16, 28, 12, 18, 24, 10, 16, 20, 14, 26, 8, 12, 18, 24, 16, 12, 8,
    14, 20, 10, 6, 12, 18, 8, 4,
  ],
  nodes: [
    12, 18, 10, 14, 24, 16, 20, 8, 14, 22, 12, 16, 18, 26, 14, 10, 8, 16, 12,
    14, 8, 12, 6, 10, 14, 8, 12, 6,
  ],
  server: [
    6, 10, 14, 12, 8, 14, 18, 22, 16, 20, 24, 18, 14, 10, 16, 12, 8, 14, 10,
    16, 8, 12, 10, 6, 8, 12, 6, 4,
  ],
  check: [
    14, 20, 24, 18, 26, 20, 24, 28, 22, 18, 24, 20, 28, 18, 22, 26, 16, 20,
    24, 18, 14, 18, 12, 16, 10, 14, 8, 6,
  ],
};

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  badgeType,
  waveformHeights,
  activeColor = "#111111",
}) => {
  const bars = waveformHeights || DEFAULT_WAVEFORMS[badgeType] || DEFAULT_WAVEFORMS.radar;

  return (
    <div className="card-neumorphic rounded-2xl p-5 flex flex-col justify-between h-[155px] relative overflow-hidden transition-all duration-200 hover:border-black/10">
      {/* Top Row: Metric Value and Badge */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[34px] font-bold tracking-tight text-charcoal-900 leading-none">
            {value}
          </div>
          <div className="text-[12px] font-medium text-charcoal-500 mt-2">
            {label}
          </div>
        </div>

        {/* Top-Right Pill/Circle Badge */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.03] border border-black/[0.05]">
          {badgeType === "radar" && (
            <div className="w-5 h-5 rounded-full border border-emerald-500/40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
          )}
          {badgeType === "nodes" && (
            <svg
              className="w-3.5 h-3.5 text-charcoal-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          )}
          {badgeType === "server" && (
            <svg
              className="w-3.5 h-3.5 text-charcoal-700"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="3" y="6" width="18" height="4" rx="1.5"></rect>
              <rect x="3" y="14" width="18" height="4" rx="1.5"></rect>
            </svg>
          )}
          {badgeType === "check" && (
            <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-500/30 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Waveform Meter */}
      <div className="flex items-end gap-[2px] h-6 pt-1">
        {bars.map((height, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full transition-all duration-300"
            style={{
              height: `${height}px`,
              backgroundColor:
                i > bars.length - 8 ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.45)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

