"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Flame,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { BusinessTask, TaskStep } from "@prosis/orchestrator";

interface TaskProgressCardProps {
  task: BusinessTask;
  onRetryStep?: (taskId: string, stepIndex: number) => void;
  onApproveTask?: (approvalId: string) => void;
  onCancelTask?: (taskId: string) => void;
  isRetrying?: boolean;
}

export const TaskProgressCard: React.FC<TaskProgressCardProps> = ({
  task,
  onRetryStep,
  onApproveTask,
  onCancelTask,
  isRetrying = false,
}) => {
  const isCompleted = task.status === "completed";
  const isWaitingApproval = task.status === "waiting_for_approval";
  const isFailed = task.status === "failed";
  const isCancelled = task.status === "cancelled";
  const isExecuting = task.status === "executing" || task.status === "planning";

  const pendingApproval = task.approvalRequirements.find((a) => a.status === "pending");

  const completedStepsCount = task.steps.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedStepsCount / task.steps.length) * 100);

  const getStatusBadge = () => {
    switch (task.status) {
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> COMPLETED
          </span>
        );
      case "waiting_for_approval":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-3 h-3 text-amber-400" /> WAITING FOR APPROVAL
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <AlertCircle className="w-3 h-3 text-rose-400" /> FAILED
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-gray-400" /> CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-core-cyan/15 text-core-cyan border border-core-cyan/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <Loader2 className="w-3 h-3 text-core-cyan animate-spin" /> ANALYZING &amp; EXECUTING
          </span>
        );
    }
  };

  return (
    <div className="my-4 rounded-2xl surface-hud border border-white/10 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all text-gray-100 bg-obsidian-975">
      {/* Top Ambient Glow Ribbon */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          isWaitingApproval
            ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse"
            : isCompleted
            ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"
            : isFailed
            ? "bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400"
            : "bg-gradient-to-r from-core-cyan via-core-violet to-core-cyan animate-pulse"
        }`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">
              PROSIS TASK RUNNER
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-[11px] font-mono text-gray-400">
              {task.id.slice(0, 16)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            {task.goal}
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getStatusBadge()}
        </div>
      </div>

      {/* Stepped Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span className="font-mono text-[11px]">
            Step {Math.min(task.currentStepIndex + 1, task.steps.length)} of {task.steps.length}
          </span>
          <span className="font-mono text-[11px] font-medium text-white">{progressPercent}% complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isWaitingApproval
                ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                : isCompleted
                ? "bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                : isFailed
                ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                : "bg-core-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stepped Checklist */}
      <div className="space-y-2 mb-4">
        {task.steps.map((step, idx) => {
          const isCurrent = task.currentStepIndex === idx && (isExecuting || isWaitingApproval);
          const isStepDone = step.status === "completed";
          const isStepFailed = step.status === "failed";
          const isStepSkipped = step.status === "skipped";

          return (
            <div
              key={step.id || idx}
              className={`p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-3 ${
                isCurrent
                  ? isWaitingApproval
                    ? "bg-amber-500/[0.08] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-core-cyan/[0.08] border-core-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                  : isStepDone
                  ? "bg-white/[0.02] border-white/10 text-gray-300"
                  : isStepFailed
                  ? "bg-rose-500/[0.08] border-rose-500/30 text-rose-200"
                  : "bg-white/[0.01] border-white/5 text-gray-500 opacity-50"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Step Icon */}
                <div className="mt-0.5 shrink-0">
                  {isStepDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isStepFailed ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : isCurrent ? (
                    isWaitingApproval ? (
                      <span className="relative flex h-3.5 w-3.5 mt-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                      </span>
                    ) : (
                      <Loader2 className="w-4 h-4 text-core-cyan animate-spin" />
                    )
                  ) : isStepSkipped ? (
                    <XCircle className="w-4 h-4 text-gray-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-600 mt-0.5" />
                  )}
                </div>

                {/* Step Content */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium ${
                        isStepDone
                          ? "text-gray-200"
                          : isStepFailed
                          ? "text-rose-200 font-semibold"
                          : isCurrent
                          ? "text-white font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>

                    {step.isDestructive && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 text-rose-400" /> Outbound Dispatch
                      </span>
                    )}

                    {step.requiresApproval && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Authorization Gate
                      </span>
                    )}
                  </div>

                  {/* Step Error Note */}
                  {step.error && (
                    <p className="mt-1.5 text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 font-mono">
                      {step.error}
                    </p>
                  )}

                  {/* Step Warnings */}
                  {step.warnings && step.warnings.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {step.warnings.map((w, wIdx) => (
                        <p
                          key={wIdx}
                          className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 font-mono"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" /> {w}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step Retry / Status Details */}
              {isStepFailed && (
                <div className="shrink-0 flex items-center gap-1.5">
                  {step.canRetry ? (
                    <button
                      onClick={() => onRetryStep?.(task.id, idx)}
                      disabled={isRetrying}
                      className="px-2.5 py-1 rounded-lg text-[10.5px] font-mono bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                      Retry Step
                    </button>
                  ) : (
                    <span
                      title="Destructive operations cannot be blindly retried without explicit authorization"
                      className="px-2 py-1 rounded-lg text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 flex items-center gap-1 cursor-help"
                    >
                      <HelpCircle className="w-3 h-3" /> Auto-retry guarded
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transparent Partial Failure Explanation Alert */}
      {task.warnings && task.warnings.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-sans">
            <span className="font-semibold text-white font-mono uppercase text-[10.5px]">Execution Transparency Notice: </span>
            {task.warnings.join(". ")}.
            <p className="text-[11px] text-amber-300/80 mt-0.5 font-sans">
              Prosis guarantees full accounting of partial discrepancies rather than masking them as total success.
            </p>
          </div>
        </div>
      )}

      {/* Waiting for Approval Action Footer */}
      {isWaitingApproval && pendingApproval && (
        <div className="p-4 rounded-xl surface-hud border border-amber-500/40 bg-amber-500/[0.05] shadow-[0_0_25px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>CONSEQUENCE REVIEW REQUIRED</span>
            </div>
            <p className="text-[11px] text-gray-300 mt-0.5 font-sans">
              Say <span className="font-semibold text-white font-mono">&ldquo;Prosis, go ahead&rdquo;</span> or confirm below to dispatch outbound actions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onCancelTask?.(task.id)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            >
              Cancel Task
            </button>
            <button
              onClick={() => pendingApproval.approvalId && onApproveTask?.(pendingApproval.approvalId)}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-90 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Approve &amp; Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Explanation */}
      {isCompleted && task.explanation && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="font-sans">
            <span className="font-semibold text-white font-mono uppercase text-[10.5px]">Outcome: </span>
            {task.explanation}
          </div>
        </div>
      )}
    </div>
  );
};

