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
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED
          </span>
        );
      case "waiting_for_approval":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-amber-50 text-amber-700 border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-amber-600" /> WAITING FOR APPROVAL
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-50 text-rose-700 border border-rose-500/20 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-rose-600" /> FAILED
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-charcoal-100 text-charcoal-600 border border-black/10 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-charcoal-500" /> CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-indigo-50 text-indigo-700 border border-indigo-500/20 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" /> ANALYZING & EXECUTING
          </span>
        );
    }
  };

  return (
    <div className="my-4 rounded-3xl bg-white border border-black/[0.08] p-5 shadow-command-card relative overflow-hidden transition-all text-charcoal-900">
      {/* Top Ambient Glow Ribbon */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          isWaitingApproval
            ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 animate-pulse"
            : isCompleted
            ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"
            : isFailed
            ? "bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400"
            : "bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-pulse"
        }`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-black/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-charcoal-400">
              PROSIS TASK RUNNER
            </span>
            <span className="text-charcoal-300">•</span>
            <span className="text-[11px] font-mono text-charcoal-500">
              {task.id.slice(0, 16)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-charcoal-900 flex items-center gap-2">
            {task.goal}
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {getStatusBadge()}
        </div>
      </div>

      {/* Stepped Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1.5">
          <span className="font-mono text-[11px]">
            Step {Math.min(task.currentStepIndex + 1, task.steps.length)} of {task.steps.length}
          </span>
          <span className="font-mono text-[11px] font-medium">{progressPercent}% complete</span>
        </div>
        <div className="w-full bg-bone-100 rounded-full h-1.5 overflow-hidden border border-black/[0.04]">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isWaitingApproval
                ? "bg-amber-500"
                : isCompleted
                ? "bg-emerald-500"
                : isFailed
                ? "bg-rose-500"
                : "bg-indigo-600"
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
              className={`p-2.5 rounded-2xl border transition-all text-xs flex items-start justify-between gap-3 ${
                isCurrent
                  ? isWaitingApproval
                    ? "bg-amber-50/50 border-amber-300/60 shadow-sm"
                    : "bg-indigo-50/40 border-indigo-200/70 shadow-sm"
                  : isStepDone
                  ? "bg-bone-50/60 border-black/[0.04] text-charcoal-800"
                  : isStepFailed
                  ? "bg-rose-50/40 border-rose-200/60 text-charcoal-900"
                  : "bg-white/40 border-black/[0.03] text-charcoal-400 opacity-60"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Step Icon */}
                <div className="mt-0.5 shrink-0">
                  {isStepDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isStepFailed ? (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  ) : isCurrent ? (
                    isWaitingApproval ? (
                      <span className="relative flex h-3.5 w-3.5 mt-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                      </span>
                    ) : (
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    )
                  ) : isStepSkipped ? (
                    <XCircle className="w-4 h-4 text-charcoal-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-charcoal-300 mt-0.5" />
                  )}
                </div>

                {/* Step Content */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium ${
                        isStepDone
                          ? "text-charcoal-800"
                          : isStepFailed
                          ? "text-rose-900 font-semibold"
                          : isCurrent
                          ? "text-charcoal-900 font-semibold"
                          : "text-charcoal-500"
                      }`}
                    >
                      {step.title}
                    </span>

                    {step.isDestructive && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-300/40 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 text-rose-600" /> Outbound Dispatch
                      </span>
                    )}

                    {step.requiresApproval && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-300/40">
                        Authorization Gate
                      </span>
                    )}
                  </div>

                  {/* Step Error Note */}
                  {step.error && (
                    <p className="mt-1 text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-xl border border-rose-200">
                      {step.error}
                    </p>
                  )}

                  {/* Step Warnings */}
                  {step.warnings && step.warnings.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {step.warnings.map((w, wIdx) => (
                        <p
                          key={wIdx}
                          className="text-[11px] text-amber-800 bg-amber-50/70 px-2 py-1 rounded-lg border border-amber-200/50 flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" /> {w}
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
                      className="px-2.5 py-1 rounded-xl text-[10.5px] font-medium bg-bone-100 hover:bg-bone-200 text-charcoal-700 border border-black/10 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                      Retry Step
                    </button>
                  ) : (
                    <span
                      title="Destructive operations cannot be blindly retried without explicit authorization"
                      className="px-2 py-1 rounded-xl text-[10px] font-mono text-charcoal-400 bg-bone-100 border border-black/[0.04] flex items-center gap-1 cursor-help"
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
        <div className="mb-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-300/60 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-950">Execution Transparency Notice: </span>
            {task.warnings.join(". ")}.
            <p className="text-[11px] text-amber-800/90 mt-0.5">
              Prosis guarantees full accounting of partial discrepancies rather than masking them as total success.
            </p>
          </div>
        </div>
      )}

      {/* Waiting for Approval Action Footer */}
      {isWaitingApproval && pendingApproval && (
        <div className="p-3.5 rounded-2xl bg-bone-50 border border-amber-300/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Consequence Review Required</span>
            </div>
            <p className="text-[11px] text-charcoal-600 mt-0.5">
              Say <span className="font-semibold text-charcoal-900">"Prosis, go ahead"</span> or confirm below to dispatch outbound actions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onCancelTask?.(task.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-charcoal-600 hover:text-charcoal-900 bg-white hover:bg-bone-100 border border-black/10 transition-all active:scale-95"
            >
              Cancel Task
            </button>
            <button
              onClick={() => pendingApproval.approvalId && onApproveTask?.(pendingApproval.approvalId)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Approve & Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Explanation */}
      {isCompleted && task.explanation && (
        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-300/40 text-xs text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-emerald-950">Outcome: </span>
            {task.explanation}
          </div>
        </div>
      )}
    </div>
  );
};

