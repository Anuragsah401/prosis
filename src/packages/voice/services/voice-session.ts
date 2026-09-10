/**
 * @prosis/voice - Central Realtime Voice Session State Machine
 * Authoritative single source of truth for the voice pipeline.
 * Manages connection lifecycle, WebRTC realtime audio streaming to OpenAI,
 * sub-50ms barge-in interruptions, and seamless local fallback.
 */

import { AudioTransport } from "./audio-transport";
import { SpeechRecognizer } from "./speech-recognizer";
import { SpeechSynthesizer } from "./speech-synthesizer";
import { RealtimeWebRTCClient, RealtimeVoiceState } from "./realtime-webrtc";
import { ProsisRealtimeSession, ProsisRealtimeState } from "../realtime/prosis-realtime-session";
import { ProsisGeminiLiveSession } from "../gemini/prosis-gemini-session";

export type VoiceState =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "processing"
  | "thinking"
  | "executing"
  | "speaking"
  | "interrupted"
  | "error"
  | "disconnected"
  | "CONFIGURATION_ERROR"
  | "AI_UNAVAILABLE"
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "THINKING"
  | "EXECUTING"
  | "SPEAKING"
  | "INTERRUPTED"
  | "ERROR";

export interface VoiceSessionEvents {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string, isFinal: boolean, role?: "user" | "prosis") => void;
  onAmplitudeChange: (amplitude: number, source: "mic" | "speaker") => void;
  onError: (error: string) => void;
  onToolCall?: (toolName: string, args: Record<string, any>, requestId?: string) => void;
  onToolCallComplete?: (toolName: string, result: any, requestId?: string) => void;
}

export class VoiceSession {
  private state: VoiceState = "idle";
  private activeEngine: "webrtc" | "local" = "local";

  // Realtime Agents SDK Session
  private realtimeSession: ProsisRealtimeSession | null = null;
  private geminiSession: ProsisGeminiLiveSession | null = null;
  private webrtcClient: RealtimeWebRTCClient | null = null;

  // Local fallback components
  private transport: AudioTransport;
  private recognizer: SpeechRecognizer;
  private synthesizer: SpeechSynthesizer;
  private events: VoiceSessionEvents;
  private vadMonitorInterval: NodeJS.Timeout | null = null;
  private conversationId: string;

  constructor(events: VoiceSessionEvents, conversationId = "conv_realtime") {
    this.events = events;
    this.conversationId = conversationId;
    this.transport = new AudioTransport();

    // 1. Configure Local Recognizer
    this.recognizer = new SpeechRecognizer({
      onInterimTranscript: (text) => {
        this.checkBargeIn();
        this.events.onTranscript(text, false, "user");
      },
      onFinalTranscript: (text) => {
        this.checkBargeIn();
        this.events.onTranscript(text, true, "user");
        this.setState("thinking");
      },
      onError: (err) => {
        console.warn("[VoiceSession] Local recognizer notice:", err);
      },
    });

    // 2. Configure Local Synthesizer
    this.synthesizer = new SpeechSynthesizer({
      onStart: () => {
        this.setState("speaking");
      },
      onEnd: () => {
        if (this.state === "speaking") {
          this.setState("listening");
        }
      },
      onInterrupted: () => {
        this.setState("interrupted");
        setTimeout(() => {
          if (this.state === "interrupted") {
            this.setState("listening");
          }
        }, 120);
      },
      onAmplitudeChange: (amp) => {
        if (this.state === "speaking") {
          this.events.onAmplitudeChange(amp, "speaker");
        }
      },
    });
  }

  public getState(): VoiceState {
    return this.state;
  }

  public getActiveEngine(): "webrtc" | "local" {
    return this.activeEngine;
  }

  public setState(nextState: VoiceState): void {
    if (this.state === nextState) return;
    this.state = nextState;
    this.events.onStateChange(nextState);
  }

  /**
   * Start or resume voice session.
   * Attempts WebRTC connection with @openai/agents/realtime first;
   * falls back cleanly to local engine if OpenAI is not configured.
   */
  public async start(): Promise<boolean> {
    this.setState("connecting");

    // 1. Fetch session config from server to determine provider
    let sessionConfig: any;
    try {
      const sessionRes = await fetch("/api/v1/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      sessionConfig = await sessionRes.json().catch(() => ({}));

      if (!sessionRes.ok || sessionConfig.code === "CONFIGURATION_ERROR") {
        const errorMessage =
          sessionConfig.message ||
          "Realtime AI is not configured. Add GEMINI_API_KEY or OPENAI_API_KEY to the server environment.";
        console.warn("[VoiceSession] AI configuration missing:", errorMessage);
        this.setState("CONFIGURATION_ERROR");
        this.events.onError(errorMessage);
        return false;
      }
    } catch (err: any) {
      const errorMessage = "Failed to connect to session endpoint: " + (err.message || "Network error");
      console.error("[VoiceSession]", errorMessage);
      this.setState("CONFIGURATION_ERROR");
      this.events.onError(errorMessage);
      return false;
    }

    const sessionEvents = {
      onStateChange: (rtcState: ProsisRealtimeState) => {
        this.setState(rtcState);
      },
      onTranscript: (text: string, isFinal: boolean, role: "user" | "prosis") => {
        this.events.onTranscript(text, isFinal, role);
      },
      onAmplitudeChange: (amp: number, src: "mic" | "speaker") => {
        this.events.onAmplitudeChange(amp, src);
      },
      onError: (err: string) => {
        this.events.onError(err);
      },
      onToolCallStart: (toolName: string, args: Record<string, any>, requestId?: string) => {
        this.events.onToolCall?.(toolName, args, requestId);
      },
      onToolCallComplete: (toolName: string, result: any, requestId?: string) => {
        this.events.onToolCallComplete?.(toolName, result, requestId);
      },
    };

    // 2. Route to provider
    if (sessionConfig.provider === "gemini") {
      // ─── Gemini Live API ─────────────────────────────────────
      console.log("[VoiceSession] Connecting via Gemini Live API...");
      this.geminiSession = new ProsisGeminiLiveSession(sessionEvents, this.conversationId);

      const geminiResult = await this.geminiSession.connect({
        apiKey: sessionConfig.geminiApiKey,
        model: sessionConfig.model || "gemini-3.1-flash-live-preview",
        systemInstruction: sessionConfig.systemInstruction,
        tools: sessionConfig.tools,
      });

      if (geminiResult.success) {
        console.log("[VoiceSession] Gemini Live session established.");
        this.activeEngine = "webrtc";
        return true;
      }

      // Gemini failed
      this.geminiSession.disconnect();
      this.geminiSession = null;

      const errorMessage = geminiResult.message || "Failed to connect to Gemini Live API.";
      console.warn("[VoiceSession] Gemini connection failed:", errorMessage);
      this.setState("CONFIGURATION_ERROR");
      this.events.onError(errorMessage);
      return false;
    }

    // ─── OpenAI WebRTC Provider ──────────────────────────────────
    this.realtimeSession = new ProsisRealtimeSession(sessionEvents, this.conversationId);

    const rtcResult = await this.realtimeSession.connect();

    if (rtcResult.success && rtcResult.provider === "openai_webrtc") {
      console.log("[VoiceSession] Native OpenAI Realtime session established via @openai/agents/realtime.");
      this.activeEngine = "webrtc";
      return true;
    }

    // Clean up session instance
    this.realtimeSession.disconnect();
    this.realtimeSession = null;

    // Strict AI Readiness: Reject silent fake fallback to browser speech synthesis
    const errorMessage =
      rtcResult.message ||
      "Realtime AI is not configured. Add OPENAI_API_KEY to the server environment.";
    console.warn("[VoiceSession] AI configuration missing or rejected:", errorMessage);

    this.setState("CONFIGURATION_ERROR");
    this.events.onError(errorMessage);
    return false;
  }

  /**
   * Stop voice session cleanly and release all media hardware.
   */
  public stop(): void {
    if (this.activeEngine === "webrtc" && this.geminiSession) {
      this.geminiSession.disconnect();
      this.geminiSession = null;
    } else if (this.activeEngine === "webrtc" && this.realtimeSession) {
      this.realtimeSession.disconnect();
      this.realtimeSession = null;
    } else if (this.webrtcClient) {
      this.webrtcClient.disconnect();
      this.webrtcClient = null;
    }

    this.stopVadMonitor();
    this.recognizer.stop();
    this.synthesizer.cancel();
    this.transport.stopCapture();

    this.setState("disconnected");
    setTimeout(() => {
      this.setState("idle");
    }, 100);
  }

  /**
   * Vocalize AI response text (used by local engine or REST flow).
   */
  public speak(text: string): void {
    if (this.activeEngine === "webrtc") {
      // In WebRTC mode, OpenAI streams audio natively through WebRTC.
      return;
    }
    this.synthesizer.speak(text);
  }

  /**
   * Instant Barge-in Interruption.
   */
  public interrupt(): void {
    if (this.activeEngine === "webrtc" && this.geminiSession) {
      this.geminiSession.interrupt();
    } else if (this.activeEngine === "webrtc" && this.realtimeSession) {
      this.realtimeSession.interrupt();
    } else if (this.webrtcClient) {
      this.webrtcClient.interrupt();
    } else if (this.state === "speaking" || this.synthesizer.getIsSpeaking()) {
      this.synthesizer.cancel();
      this.setState("interrupted");
      setTimeout(() => {
        if (this.state === "interrupted") {
          this.setState("listening");
        }
      }, 100);
    }
  }

  private checkBargeIn(): void {
    if (this.state === "speaking") {
      this.interrupt();
    }
  }

  private startVadMonitor(): void {
    this.stopVadMonitor();
    this.vadMonitorInterval = setInterval(() => {
      if (!this.transport.isActive()) return;

      const amp = this.transport.getAmplitude();
      if (this.state === "listening") {
        this.events.onAmplitudeChange(amp, "mic");
      }

      if (this.state === "speaking" && this.transport.isSpeechDetected()) {
        this.interrupt();
      }
    }, 50);
  }

  private stopVadMonitor(): void {
    if (this.vadMonitorInterval) {
      clearInterval(this.vadMonitorInterval);
      this.vadMonitorInterval = null;
    }
  }
}
