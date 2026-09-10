"use client";

import { useState, useCallback, useRef } from "react";
import { MessageTurn } from "@prosis/orchestrator";
import { useVoiceSession } from "./useVoiceSession";

export interface ProsisSessionOptions {
  onWorkspaceAction?: (action: {
    type: "switch_workspace" | "return_to_core";
    targetProduct?: string;
    targetWorkspace?: string;
  }) => void;
}

export function useProsisSession(options?: ProsisSessionOptions) {
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionStatus, setExecutionStatus] = useState("Prosis standby");
  const turnsRef = useRef<MessageTurn[]>([]);

  // Configure unified voice session
  const voice = useVoiceSession({
    onFinalTranscript: (transcript, role = "user") => {
      if (!transcript.trim()) return;

      if (voice.activeEngine === "webrtc") {
        // In WebRTC mode, update turns state from realtime audio transcription
        const turn: MessageTurn = {
          id: `msg_${Date.now()}_${role === "user" ? "u" : "a"}`,
          role: role === "user" ? "user" : "prosis",
          content: transcript.trim(),
          timestamp: new Date().toISOString(),
        };
        setTurns((prev) => {
          const next = [...prev, turn];
          turnsRef.current = next;
          return next;
        });
      }
    },
    onToolCall: (toolName, _args) => {
      setExecutionStatus(`Executing ${toolName}...`);
    },
    onBargeIn: () => {
      console.log("[useProsisSession] Barge-in acknowledged. Playback halted.");
    },
    onError: (err) => {
      console.warn("[useProsisSession] Voice error:", err);
      setExecutionStatus("Voice error encountered");
    },
  });

  const sendDirective = useCallback(
    async (text: string, source: "web" | "voice" = "web") => {
      if (!text.trim() || isProcessing) return;

      setIsProcessing(true);
      setExecutionStatus("Processing directive...");

      // Optimistic user turn
      const userTurn: MessageTurn = {
        id: `msg_${Date.now()}_u`,
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setTurns((prev) => {
        const next = [...prev, userTurn];
        turnsRef.current = next;
        return next;
      });

      try {
        const res = await fetch("/api/v1/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, source }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          const {
            replyText,
            spokenText,
            turns: updatedTurns,
            pendingApproval,
            workspaceAction,
          } = json.data;

          if (workspaceAction && options?.onWorkspaceAction) {
            options.onWorkspaceAction(workspaceAction);
          }

          if (updatedTurns) {
            setTurns(updatedTurns);
            turnsRef.current = updatedTurns;
          }

          // Vocalize response if voice is active or user spoke via voice in local engine
          if (spokenText && (voice.isVoiceActive || source === "voice")) {
            voice.speakText(spokenText);
          }
        } else {
          setExecutionStatus("Failed to process directive");
        }
      } catch (err) {
        console.error("[useProsisSession] Directive error:", err);
        setExecutionStatus("Network or server connection error");
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, voice, options]
  );

  const resolveApproval = useCallback(
    async (approvalId: string, approved: boolean) => {
      setIsProcessing(true);
      setExecutionStatus(
        approved ? "Executing authorized operation..." : "Voiding operation..."
      );

      try {
        const res = await fetch(`/api/v1/approvals/${approvalId}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.spokenText && voice.isVoiceActive) {
            voice.speakText(json.data.spokenText);
          }
        }
      } catch (err) {
        console.error("[useProsisSession] Approval resolution error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [voice]
  );

  return {
    turns,
    isProcessing,
    executionStatus,
    voice,
    sendDirective,
    resolveApproval,
  };
}
