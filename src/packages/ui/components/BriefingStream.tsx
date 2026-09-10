"use client";

import React from "react";
import { MessageTurn } from "@prosis/orchestrator";
import { ApprovalCard } from "./ApprovalCard";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Mail,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  Utensils,
  CheckCircle2,
} from "lucide-react";

interface BriefingStreamProps {
  turns: MessageTurn[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSelectFollowUp: (text: string) => void;
  isProcessing: boolean;
}

const renderContent = (content: string): any => {
  const paras = content.split("\n\n");
  return paras.map((para, pIdx) => {
    if (para.startsWith("### ")) {
      return (
        <h4 key={pIdx} className="font-semibold text-base text-gray-100 mt-2">
          {para.replace("### ", "")}
        </h4>
      );
    }
    if (para.startsWith("> ")) {
      return (
        <blockquote
          key={pIdx}
          className="pl-3 border-l-2 border-cyan-400 text-xs italic text-gray-300 bg-white/5 py-1.5 rounded-r"
        >
          {para.replace("> ", "")}
        </blockquote>
      );
    }
    return (
      <p key={pIdx} className="whitespace-pre-line">
        {para}
      </p>
    );
  });
};

export const BriefingStream: React.FC<BriefingStreamProps> = ({
  turns,
  onApprove,
  onReject,
  onSelectFollowUp,
  isProcessing,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28">
      {turns.map((turn, index) => {
        const isProsis = turn.role === "prosis";

        return (
          <div
            key={turn.id || index}
            className={`flex flex-col transition-all duration-300 ${
              isProsis ? "items-start" : "items-end"
            }`}
          >
            {/* Meta Label */}
            <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono text-gray-500">
              {isProsis ? (
                <>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">PROSIS OS</span>
                  {turn.activeTool && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/20 text-[10px]">
                      {turn.activeTool}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-gray-400" />
                  <span>OPERATOR</span>
                </>
              )}
              <span>•</span>
              <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
            </div>

            {/* Bubble Content */}
            <div
              className={`rounded-2xl p-5 text-sm leading-relaxed max-w-[92%] transition-all ${
                isProsis
                  ? "bg-obsidian-900/80 text-gray-200 border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_4px_20px_rgba(6,182,212,0.25)] font-medium"
              }`}
            >
              {/* Text rendering with basic markdown-style line parsing */}
              <div className="space-y-2.5">
                {renderContent(turn.content)}
              </div>

              {/* Structured Widget Render for Daily Briefing */}
              {turn.activeTool === "seatbooking_getDailyBriefing" && Boolean(turn.toolResult) && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10">
                  <div className="p-3 rounded-xl bg-obsidian-850/90 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Total Covers</span>
                    <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
                      {(turn.toolResult as any).totalCoversToday}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-obsidian-850/90 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Occupancy Paced</span>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                      {(turn.toolResult as any).occupancyRatePercent}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-obsidian-850/90 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Declining Alerts</span>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                      {(turn.toolResult as any).decliningRestaurantsCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-obsidian-850/90 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Est. Daily Rev</span>
                    <div className="text-xl font-bold font-mono text-gray-100 mt-0.5">
                      ${(turn.toolResult as any).revenuePacedUsd.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Structured Widget Render for Declining Venues */}
              {turn.activeTool === "seatbooking_getDecliningRestaurants" &&
                Array.isArray(turn.toolResult) && (
                  <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
                    <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                      Flagged Properties Requiring Intervention
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(turn.toolResult as any[]).map((rest) => (
                        <div
                          key={rest.id}
                          className="p-3 rounded-xl bg-obsidian-850/90 border border-ruby-500/20 hover:border-ruby-500/40 transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-100 text-sm">{rest.name}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-ruby-500/15 text-ruby-400 border border-ruby-500/30 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              {rest.weeklyTrendPercent}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center justify-between">
                            <span>Manager: {rest.managerName}</span>
                            <span className="font-mono text-gray-300">Pacing: {rest.capacityBookedPercent}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Staged Approval Card Render */}
              {turn.pendingApproval && (
                <ApprovalCard
                  request={turn.pendingApproval}
                  onApprove={onApprove}
                  onReject={onReject}
                  disabled={isProcessing}
                />
              )}
            </div>

            {/* Suggested Follow-Ups */}
            {isProsis && turn.suggestedFollowUps && turn.suggestedFollowUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[92%]">
                {turn.suggestedFollowUps.map((prompt, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => onSelectFollowUp(prompt)}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 text-[11px] font-mono transition-all flex items-center gap-1 group active:scale-95 disabled:opacity-40"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Thinking / Execution Status Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-obsidian-900/60 border border-cyan-500/20 backdrop-blur-md max-w-sm animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-xs text-cyan-300">
            Prosis operating across registered services...
          </span>
        </div>
      )}
    </div>
  );
};
