"use client";

import React from "react";
import {
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Flame,
} from "lucide-react";
import { ProactiveBriefing, EpistemicStatus } from "@prosis/proactive";

interface ProactiveBriefingCardProps {
  briefing: ProactiveBriefing;
  onInvestigate?: (directive: string) => void;
  onOpenAutonomySettings?: () => void;
  disabled?: boolean;
}

export const ProactiveBriefingCard: React.FC<ProactiveBriefingCardProps> = ({
  briefing,
  onInvestigate,
  onOpenAutonomySettings,
  disabled = false,
}) => {
  const getEpistemicBadge = (status: EpistemicStatus) => {
    switch (status) {
      case "observed":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
            [OBSERVED FACT]
          </span>
        );
      case "inferred":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
            [INFERRED IMPACT]
          </span>
        );
      case "recommended":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-core-cyan/15 text-core-cyan border border-core-cyan/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            [RECOMMENDED]
          </span>
        );
      case "executed":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
            [EXECUTED]
          </span>
        );
    }
  };

  return (
    <div className="my-5 rounded-2xl surface-hud border border-white/10 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all text-gray-100 bg-obsidian-975">
      {/* Top Ambient Glow Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-core-emerald" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-core-cyan/10 border border-core-cyan/30 text-core-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-core-cyan">
                PROSIS PROACTIVE INTELLIGENCE
              </span>
              <span className="text-gray-600">•</span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-semibold bg-white/10 text-core-cyan border border-core-cyan/20">
                Level {briefing.autonomyLevel} Agency
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-0.5 tracking-wide">
              {briefing.headline}
            </h3>
          </div>
        </div>

        {onOpenAutonomySettings && (
          <button
            onClick={onOpenAutonomySettings}
            disabled={disabled}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-mono text-gray-300 hover:text-white surface-hud hover:border-core-cyan/40 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-core-cyan" />
            <span>Policy Settings</span>
          </button>
        )}
      </div>

      {/* 3 Concise Items */}
      <div className="space-y-3 mb-4">
        {briefing.items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 text-xs transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-mono font-bold text-[11px] text-core-cyan">
                  {idx + 1}
                </span>
                <span className="font-semibold text-white text-sm">
                  {item.title}
                </span>
              </div>
              <div>{getEpistemicBadge(item.epistemic)}</div>
            </div>

            {/* Delineated Details */}
            {item.details ? (
              <div className="space-y-1.5 mt-2 font-sans">
                {item.details.observedFact && (
                  <p className="leading-relaxed text-gray-300">
                    <span className="font-semibold text-emerald-400 font-mono text-[10.5px] uppercase tracking-wider block sm:inline">
                      Ground Truth:{" "}
                    </span>
                    {item.details.observedFact}
                  </p>
                )}
                {item.details.inferredImpact && (
                  <p className="leading-relaxed text-gray-400">
                    <span className="font-semibold text-purple-400 font-mono text-[10.5px] uppercase tracking-wider block sm:inline">
                      Inferred Impact:{" "}
                    </span>
                    {item.details.inferredImpact}
                  </p>
                )}
                {item.details.recommendation && (
                  <p className="leading-relaxed text-gray-200">
                    <span className="font-semibold text-core-cyan font-mono text-[10.5px] uppercase tracking-wider block sm:inline">
                      Recommended Action:{" "}
                    </span>
                    {item.details.recommendation}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 leading-relaxed mt-1 font-sans">
                {item.description}
              </p>
            )}

            {/* Action Trigger */}
            {item.actionLabel && item.actionDirective && onInvestigate && (
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end">
                <button
                  onClick={() => onInvestigate(item.actionDirective!)}
                  disabled={disabled}
                  className="px-3 py-1 rounded-lg text-[11px] font-mono font-medium text-core-cyan hover:text-white bg-core-cyan/10 hover:bg-core-cyan/20 border border-core-cyan/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Prompt */}
      <div className="p-3.5 rounded-xl surface-hud border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <HelpCircle className="w-4 h-4 text-core-cyan shrink-0" />
          <span className="font-sans italic">{briefing.followUpPrompt}</span>
        </div>

        {onInvestigate && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onInvestigate("Investigate Cantina Bella")}
              disabled={disabled}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-semibold text-black bg-gradient-to-r from-core-cyan to-core-emerald hover:opacity-90 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Investigate Anomaly</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

