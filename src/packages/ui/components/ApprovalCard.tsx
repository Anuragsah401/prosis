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
    <div className="my-4 rounded-3xl bg-white border border-amber-500/30 p-5 shadow-command-card relative overflow-hidden transition-all text-charcoal-900">
      {/* Top Ambient Glow Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-500/20 text-amber-600">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-600">
                AUTHORIZATION REQUIRED
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-500/20">
                High Impact
              </span>
            </div>
            <h4 className="text-sm font-semibold text-charcoal-900 mt-0.5">
              {request.summary}
            </h4>
          </div>
        </div>

        <span className="text-[11px] font-mono text-charcoal-400">
          Ref: <span className="text-charcoal-700">{request.id.slice(0, 10)}</span>
        </span>
      </div>

      {/* Impact Statement */}
      <div className="p-3 rounded-2xl bg-bone-100 border border-black/[0.04] mb-3 text-xs text-charcoal-700 leading-relaxed">
        <span className="font-semibold text-amber-800">Consequence Analysis: </span>
        {request.impactDescription}
      </div>

      {/* Affected Entities Grid */}
      <div className="mb-3 space-y-1.5">
        <div className="text-[10.5px] font-mono text-charcoal-400 tracking-wider uppercase">
          Target Entities & Parameters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {request.affectedEntities.map((entity, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-xl bg-bone-50 border border-black/[0.04]"
            >
              <span className="text-charcoal-400 uppercase tracking-tight text-[9.5px] font-mono">
                {entity.type}
              </span>
              <span className="font-medium text-charcoal-800">{entity.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed Changes Preview */}
      {request.proposedChanges && (
        <div className="mb-4 p-3 rounded-2xl bg-bone-100 border border-black/[0.04] font-mono text-xs">
          <div className="text-[10px] text-charcoal-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CornerDownRight className="w-3 h-3 text-charcoal-600" /> Staged Modifications
          </div>
          <div className="space-y-1 text-charcoal-800 text-[11px]">
            {Object.entries(request.proposedChanges).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <span className="text-charcoal-500">{k}:</span>
                <span className="text-charcoal-900 font-medium">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      {isPending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.06]">
          <div className="text-xs text-charcoal-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Voice sanction available: say <b>&ldquo;Yes, proceed&rdquo;</b> or <b>&ldquo;Cancel&rdquo;</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(request.id)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-charcoal-700 bg-bone-100 hover:bg-bone-200 border border-black/[0.06] transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => onApprove(request.id)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-charcoal-900 hover:bg-black shadow-sm transition-all transform active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorize & Execute</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] text-xs font-mono">
          <span className="text-charcoal-500">
            Resolution:{" "}
            <span
              className={`font-semibold ${
                request.status === "EXECUTED" || request.status === "APPROVED"
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {request.status}
            </span>
          </span>
          <span className="text-charcoal-400">
            Decided by {request.resolvedBy}
          </span>
        </div>
      )}
    </div>
  );
};
