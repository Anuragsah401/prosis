"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceSession, VoiceState } from "../services/voice-session";
import { useMicrophone } from "./useMicrophone";
import { useAudioVisualizer } from "./useAudioVisualizer";

export interface UseVoiceSessionOptions {
  onFinalTranscript?: (transcript: string, role?: "user" | "prosis") => void;
  onInterimTranscript?: (transcript: string, role?: "user" | "prosis") => void;
  onBargeIn?: () => void;
  onError?: (error: string) => void;
  onToolCall?: (toolName: string, args: Record<string, any>, requestId?: string) => void;
  onToolCallComplete?: (toolName: string, result: any, requestId?: string) => void;
}

export interface ToolActivityState {
  status: "running" | "success" | "error";
  toolName: string;
  requestId?: string;
}

export function useVoiceSession(options?: UseVoiceSessionOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<"webrtc" | "local">("local");
  const [toolActivity, setToolActivity] = useState<ToolActivityState | null>(null);

  const { permission, requestPermission, isSupported } = useMicrophone();
  const { amplitude, activeSource, updateAmplitude, resetAmplitude } = useAudioVisualizer();

  const sessionRef = useRef<VoiceSession | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const session = new VoiceSession({
      onStateChange: (nextState) => {
        setVoiceState(nextState);
        if (nextState === "interrupted" || nextState === "INTERRUPTED") {
          setToolActivity(null);
          optionsRef.current?.onBargeIn?.();
        } else if (nextState === "speaking" || nextState === "SPEAKING") {
          // Clear successful tool status when speaking starts
          setTimeout(() => setToolActivity(null), 2500);
        }
      },
      onTranscript: (text, isFinal, role = "user") => {
        setCurrentTranscript(text);
        if (isFinal) {
          optionsRef.current?.onFinalTranscript?.(text, role);
        } else {
          optionsRef.current?.onInterimTranscript?.(text, role);
        }
      },
      onAmplitudeChange: (amp, src) => {
        updateAmplitude(amp, src);
      },
      onError: (err) => {
        setErrorMessage(err);
        setToolActivity({ status: "error", toolName: "error" });
        optionsRef.current?.onError?.(err);
      },
      onToolCall: (toolName, args, requestId) => {
        setToolActivity({ status: "running", toolName, requestId });
        optionsRef.current?.onToolCall?.(toolName, args, requestId);
      },
      onToolCallComplete: (toolName, result, requestId) => {
        const isSuccess = result?.success !== false && !result?.error;
        setToolActivity({ status: isSuccess ? "success" : "error", toolName, requestId });
        optionsRef.current?.onToolCallComplete?.(toolName, result, requestId);
      },
    });

    sessionRef.current = session;

    return () => {
      session.stop();
      resetAmplitude();
    };
  }, [updateAmplitude, resetAmplitude]);

  const startVoice = useCallback(async () => {
    setErrorMessage(null);

    // Verify or request microphone permission on demand
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        setErrorMessage("Microphone permission was denied. Text input is active.");
        setVoiceState("error");
        return false;
      }
    }

    if (!sessionRef.current) return false;
    const ok = await sessionRef.current.start();
    if (ok) {
      setActiveEngine(sessionRef.current.getActiveEngine());
    }
    return ok;
  }, [permission, requestPermission]);

  const stopVoice = useCallback(() => {
    sessionRef.current?.stop();
    resetAmplitude();
    setCurrentTranscript("");
    setVoiceState("idle");
  }, [resetAmplitude]);

  const toggleVoice = useCallback(async () => {
    const isInactive =
      voiceState === "idle" ||
      voiceState === "IDLE" ||
      voiceState === "error" ||
      voiceState === "ERROR" ||
      voiceState === "disconnected" ||
      voiceState === "CONFIGURATION_ERROR" ||
      voiceState === "AI_UNAVAILABLE";

    if (isInactive) {
      return await startVoice();
    } else {
      stopVoice();
      return true;
    }
  }, [voiceState, startVoice, stopVoice]);

  const interruptVoice = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);

  const speakText = useCallback((text: string) => {
    sessionRef.current?.speak(text);
  }, []);

  const setManualState = useCallback((state: VoiceState) => {
    sessionRef.current?.setState(state);
  }, []);

  const isVoiceActive =
    voiceState !== "idle" &&
    voiceState !== "IDLE" &&
    voiceState !== "disconnected" &&
    voiceState !== "error" &&
    voiceState !== "CONFIGURATION_ERROR" &&
    voiceState !== "AI_UNAVAILABLE";

  return {
    voiceState,
    isVoiceActive,
    activeEngine,
    currentTranscript,
    amplitude,
    activeSource,
    permission,
    isSupported,
    errorMessage,
    toolActivity,
    startVoice,
    stopVoice,
    toggleVoice,
    interruptVoice,
    speakText,
    setManualState,
  };
}
