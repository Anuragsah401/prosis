"use client";

import React from "react";
import { ShieldAlert, CheckCircle2, XCircle, CornerDownRight } from "lucide-react";
import { ApprovalRequest } from "@prosis/orchestrator";

interface ApprovalCardProps {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  disabled?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  request,
  onApprove,
  onReject,
  disabled = false,
}) => {
  const isPending = request.status === "PENDING";

  return (
    <div className="my-4 rounded-3xl surface-hud border border-amber-500/40 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden transition-all text-gray-200 backdrop-blur-xl">
      {/* Top Ambient Glow Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_#f59e0b]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-400">
                LEVEL 1 AUTONOMY // SANCTION REQUIRED
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                High Impact
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-0.5">
              {request.summary}
            </h4>
          </div>
        </div>

        <span className="text-[11px] font-mono text-gray-500">
          Ref: <span className="text-gray-300">{request.id.slice(0, 10)}</span>
        </span>
      </div>

      {/* Impact Statement */}
      <div className="p-3.5 rounded-2xl bg-obsidian-975/80 border border-amber-500/20 mb-3 text-xs text-gray-300 leading-relaxed">
        <span className="font-semibold text-amber-400">Consequence Analysis: </span>
        {request.impactDescription}
      </div>

      {/* Affected Entities Grid */}
      <div className="mb-3 space-y-1.5">
        <div className="text-[10.5px] font-mono text-gray-400 tracking-wider uppercase">
          Target Entities & Parameters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {request.affectedEntities.map((entity, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono"
            >
              <span className="text-gray-500 uppercase tracking-tight text-[9.5px]">
                {entity.type}
              </span>
              <span className="font-medium text-white">{entity.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed Changes Preview */}
      {request.proposedChanges && (
        <div className="mb-4 p-3.5 rounded-2xl bg-obsidian-975/90 border border-white/10 font-mono text-xs">
          <div className="text-[10px] text-core-cyan uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-core-cyan" /> Staged Modifications
          </div>
          <div className="space-y-1 text-gray-300 text-[11px]">
            {Object.entries(request.proposedChanges).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <span className="text-gray-500">{k}:</span>
                <span className="text-core-cyan font-medium">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      {isPending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span>Voice sanction available: say <b className="text-white">&ldquo;Yes, proceed&rdquo;</b> or <b className="text-white">&ldquo;Cancel&rdquo;</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(request.id)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-gray-300 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => onApprove(request.id)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-obsidian-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all transform active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-obsidian-950" />
              <span>Authorize & Execute</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
          <span className="text-gray-400">
            Resolution:{" "}
            <span
              className={`font-semibold ${
                request.status === "EXECUTED" || request.status === "APPROVED"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {request.status}
            </span>
          </span>
          <span className="text-gray-500">
            Decided by {request.resolvedBy}
          </span>
        </div>
      )}
    </div>
  );
};
