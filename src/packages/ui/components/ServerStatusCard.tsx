"use client";

import React from "react";
import { RotateCw, Terminal, Sliders, Play, Trash2, Settings } from "lucide-react";

interface SemiGaugeProps {
  value: string;
  label: string;
  percent: number; // 0 to 100
  color: string;
}

const SemiGauge: React.FC<SemiGaugeProps> = ({ value, label, percent, color }) => {
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke;
  // Semicircle circumference = PI * r
  const circumference = Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-12 flex items-end justify-center overflow-hidden">
        <svg height="44" width="76" className="transform rotate-0">
          {/* Background Arc */}
          <circle
            stroke="rgba(0, 0, 0, 0.07)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset: 0 }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx="38"
            cy="40"
          />
          {/* Filled Arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 0.6s ease",
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx="38"
            cy="40"
          />
        </svg>

        {/* Center Value */}
        <div className="absolute bottom-0 text-[13px] font-bold text-charcoal-900 leading-none">
          {value}
        </div>
      </div>
      <span className="text-[10.5px] font-medium text-charcoal-400 mt-1 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
};

export const ServerStatusCard: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-charcoal-900 tracking-tight">
        Server Status
      </h3>

      {/* Node 1: Singapore App Server */}
      <div className="card-neumorphic rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-[14px] text-charcoal-900">
              <span>App Server - Singapore</span>
              <span className="text-sm">🇸🇬</span>
            </div>
            <p className="text-[11px] text-charcoal-400 mt-0.5">
              Ubuntu 24.04 · 4GB / 2 vCPU
            </p>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Running
          </span>
        </div>

        {/* 3 Semicircular Radial Gauges */}
        <div className="flex items-center justify-around pt-1">
          <SemiGauge value="42%" label="CPU" percent={42} color="#EF4444" />
          <SemiGauge value="68%" label="RAM" percent={68} color="#FF6B00" />
          <SemiGauge value="124 GB" label="Bandwidth" percent={82} color="#5800FF" />
        </div>

        {/* Quick Action Pill Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04] text-xs font-medium text-charcoal-700">
          <button className="flex-1 py-1.5 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.04] flex items-center justify-center gap-1.5 transition-colors">
            <RotateCw className="w-3 h-3" />
            <span className="text-[11px]">Restart</span>
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.04] flex items-center justify-center gap-1.5 transition-colors">
            <Terminal className="w-3 h-3" />
            <span className="text-[11px]">SSH</span>
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.04] flex items-center justify-center gap-1.5 transition-colors">
            <Sliders className="w-3 h-3" />
            <span className="text-[11px]">Scale</span>
          </button>
        </div>
      </div>

      {/* Node 2: Backup Node - New York (Stopped) */}
      <div className="card-neumorphic rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-[14px] text-charcoal-900">
              <span>Backup Node - New York</span>
              <span className="text-sm">🇺🇸</span>
            </div>
            <p className="text-[11px] text-charcoal-400 mt-0.5">
              Ubuntu 22.04 · 2GB / 1 vCPU
            </p>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-rose-50 text-rose-500 border border-rose-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Stopped
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs font-medium">
          <button className="flex-1 py-1.5 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.04] text-charcoal-700 flex items-center justify-center gap-1.5 transition-colors">
            <Play className="w-3 h-3" />
            <span className="text-[11px]">Start</span>
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.04] text-charcoal-700 flex items-center justify-center gap-1.5 transition-colors">
            <Settings className="w-3 h-3" />
            <span className="text-[11px]">Configure</span>
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-500/10 text-rose-600 flex items-center justify-center gap-1.5 transition-colors">
            <Trash2 className="w-3 h-3" />
            <span className="text-[11px]">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

