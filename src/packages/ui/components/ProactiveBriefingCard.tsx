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
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300/40">
            [OBSERVED FACT]
          </span>
        );
      case "inferred":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-purple-50 text-purple-800 border border-purple-300/40">
            [INFERRED IMPACT]
          </span>
        );
      case "recommended":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-indigo-50 text-indigo-800 border border-indigo-300/40">
            [RECOMMENDED]
          </span>
        );
      case "executed":
        return (
          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase bg-blue-50 text-blue-800 border border-blue-300/40">
            [EXECUTED]
          </span>
        );
    }
  };

  return (
    <div className="my-5 rounded-3xl bg-white border border-black/[0.08] p-5 shadow-command-card relative overflow-hidden transition-all text-charcoal-900">
      {/* Top Ambient Glow Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-indigo-600">
                PROSIS PROACTIVE INTELLIGENCE
              </span>
              <span className="text-charcoal-300">•</span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-semibold bg-bone-100 text-charcoal-700 border border-black/[0.04]">
                Level {briefing.autonomyLevel} Agency
              </span>
            </div>
            <h3 className="text-base font-semibold text-charcoal-900 mt-0.5">
              {briefing.headline}
            </h3>
          </div>
        </div>

        {onOpenAutonomySettings && (
          <button
            onClick={onOpenAutonomySettings}
            disabled={disabled}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-medium text-charcoal-600 hover:text-charcoal-900 bg-bone-50 hover:bg-bone-100 border border-black/10 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Policy Settings</span>
          </button>
        )}
      </div>

      {/* 3 Concise Items */}
      <div className="space-y-3 mb-4">
        {briefing.items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-bone-50/70 border border-black/[0.04] text-xs hover:border-black/10 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white border border-black/10 flex items-center justify-center font-mono font-bold text-[11px] text-charcoal-700">
                  {idx + 1}
                </span>
                <span className="font-semibold text-charcoal-900 text-sm">
                  {item.title}
                </span>
              </div>
              <div>{getEpistemicBadge(item.epistemic)}</div>
            </div>

            {/* Delineated Details */}
            {item.details ? (
              <div className="space-y-1 mt-2 text-charcoal-700">
                {item.details.observedFact && (
                  <p className="leading-relaxed">
                    <span className="font-semibold text-emerald-950 font-mono text-[10.5px] uppercase tracking-wide">
                      Ground Truth:{" "}
                    </span>
                    {item.details.observedFact}
                  </p>
                )}
                {item.details.inferredImpact && (
                  <p className="leading-relaxed text-charcoal-600">
                    <span className="font-semibold text-purple-950 font-mono text-[10.5px] uppercase tracking-wide">
                      Inferred Impact:{" "}
                    </span>
                    {item.details.inferredImpact}
                  </p>
                )}
                {item.details.recommendation && (
                  <p className="leading-relaxed text-charcoal-800">
                    <span className="font-semibold text-indigo-950 font-mono text-[10.5px] uppercase tracking-wide">
                      Recommended Action:{" "}
                    </span>
                    {item.details.recommendation}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-charcoal-600 leading-relaxed mt-1">
                {item.description}
              </p>
            )}

            {/* Action Trigger */}
            {item.actionLabel && item.actionDirective && onInvestigate && (
              <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center justify-end">
                <button
                  onClick={() => onInvestigate(item.actionDirective!)}
                  disabled={disabled}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-all flex items-center gap-1 active:scale-95"
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
      <div className="p-3 rounded-2xl bg-bone-100/70 border border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-charcoal-700">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-medium italic">{briefing.followUpPrompt}</span>
        </div>

        {onInvestigate && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onInvestigate("Investigate Cantina Bella")}
              disabled={disabled}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
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

