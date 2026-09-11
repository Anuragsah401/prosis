/**
 * @prosis/voice/realtime - Prosis Realtime Session Manager
 * Wraps @openai/agents/realtime to provide an authoritative WebRTC
 * realtime session with sub-50ms barge-in interruption and event-driven states.
 */

import { RealtimeSession, OpenAIRealtimeWebRTC } from "@openai/agents/realtime";
import { createProsisRealtimeAgent } from "./prosis-realtime-agent";

export type ProsisRealtimeState =
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
  | "AI_UNAVAILABLE";

export interface ProsisRealtimeSessionEvents {
  onStateChange: (state: ProsisRealtimeState) => void;
  onTranscript: (text: string, isFinal: boolean, role: "user" | "prosis") => void;
  onAmplitudeChange: (amplitude: number, source: "mic" | "speaker") => void;
  onError: (error: string) => void;
  onToolCallStart?: (toolName: string, args: Record<string, any>, requestId?: string) => void;
  onToolCallComplete?: (toolName: string, result: any, requestId?: string) => void;
}

export class ProsisRealtimeSession {
  private session: RealtimeSession | null = null;
  private transport: OpenAIRealtimeWebRTC | null = null;
  private mediaStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private amplitudeInterval: NodeJS.Timeout | null = null;

  private state: ProsisRealtimeState = "idle";
  private events: ProsisRealtimeSessionEvents;
  private conversationId: string;
  private toolExecutionEpoch = 0;

  constructor(events: ProsisRealtimeSessionEvents, conversationId = "conv_realtime") {
    this.events = events;
    this.conversationId = conversationId;
  }

  public getState(): ProsisRealtimeState {
    return this.state;
  }

  private setState(next: ProsisRealtimeState): void {
    if (this.state === next) return;
    this.state = next;
    this.events.onStateChange(next);
  }

  /**
   * Initializes and connects the OpenAI Realtime Session over WebRTC.
   * If server OPENAI_API_KEY is missing, transitions to CONFIGURATION_ERROR.
   * Does NOT silently fall back to synthetic speech.
   */
  public async connect(): Promise<{
    success: boolean;
    provider: "openai_webrtc" | "unconfigured";
    code?: string;
    message?: string;
  }> {
    try {
      this.setState("connecting");

      if (typeof window === "undefined" || !navigator.mediaDevices || typeof RTCPeerConnection === "undefined") {
        const msg = "WebRTC microphone environment is not supported in this browser context.";
        this.setState("error");
        this.events.onError(msg);
        return { success: false, provider: "unconfigured", code: "ENVIRONMENT_UNSUPPORTED", message: msg };
      }

      // 1. Request ephemeral token from Prosis server
      const sessionRes = await fetch("/api/v1/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const sessionJson = await sessionRes.json().catch(() => ({}));

      // Strict Validation: If OPENAI_API_KEY is not configured on server
      if (!sessionRes.ok || sessionJson.code === "CONFIGURATION_ERROR" || !sessionJson.client_secret) {
        const isConfigError = sessionJson.code === "CONFIGURATION_ERROR";
        const errorMsg =
          sessionJson.message ||
          sessionJson.error ||
          (isConfigError
            ? "Realtime AI is not configured. Add OPENAI_API_KEY to the server environment."
            : "Failed to establish Realtime AI session with upstream server.");
        console.warn("[ProsisRealtimeSession] Server session error:", errorMsg);
        this.setState(isConfigError ? "CONFIGURATION_ERROR" : "error");
        this.events.onError(errorMsg);
        this.disconnect();
        return {
          success: false,
          provider: "unconfigured",
          code: sessionJson.code || "CONNECTION_FAILED",
          message: errorMsg,
        };
      }

      const ephemeralKey: string = sessionJson.client_secret;
      const model = sessionJson.model || "gpt-realtime";

      // 2. Acquire microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 3. Audio analysis for visual ripples
      this.setupLocalAudioAnalysis(this.mediaStream);

      // 4. Remote audio playback element
      if (!this.audioEl) {
        const el = document.createElement("audio");
        el.autoplay = true;
        el.style.display = "none";
        document.body.appendChild(el);
        this.audioEl = el;
      }

      // 5. Create Agent with safe operational and repository intelligence tools
      let lastRequestId: string | undefined;
      const agent = createProsisRealtimeAgent({
        sessionId: this.conversationId,
        instructions: sessionJson.systemInstruction,
        getEpoch: () => this.toolExecutionEpoch,
        onToolCall: (name, args, reqId) => {
          lastRequestId = reqId;
          this.events.onToolCallStart?.(name, args, reqId);
        },
      });

      // 6. Create Transport & RealtimeSession
      this.transport = new OpenAIRealtimeWebRTC({
        audioElement: this.audioEl,
        mediaStream: this.mediaStream,
      });

      this.session = new RealtimeSession(agent, {
        transport: this.transport,
        model,
      });

      // 7. Subscribe to RealtimeSession lifecycle events
      this.session.on("audio_start", () => {
        this.setState("speaking");
      });

      this.session.on("audio_stopped", () => {
        if (this.state === "speaking") {
          this.setState("listening");
        }
      });

      this.session.on("audio_interrupted", () => {
        this.setState("interrupted");
        this.toolExecutionEpoch++; // Invalidate stale tool execution on interruption
        setTimeout(() => {
          if (this.state === "interrupted") {
            this.setState("listening");
          }
        }, 80);
      });

      this.session.on("agent_start", () => {
        if (this.state !== "speaking") {
          this.setState("thinking");
        }
      });

      this.session.on("agent_tool_start", (_ctx, _agent, tool, details) => {
        this.setState("executing");
        const currentEpoch = ++this.toolExecutionEpoch;
        const toolName = tool.name;
        let args: Record<string, any> = {};
        try {
          if (details?.toolCall && "arguments" in details.toolCall) {
            args = JSON.parse((details.toolCall as any).arguments || "{}");
          }
        } catch {}

        this.events.onToolCallStart?.(toolName, args, lastRequestId);

        // Track epoch on tool completion listener
        const onEndCleanup = (_endCtx: any, _endAgent: any, endTool: any, result: any) => {
          if (endTool.name === toolName) {
            if (currentEpoch !== this.toolExecutionEpoch) {
              console.log(`[ProsisRealtimeSession] Discarding stale tool result for ${toolName} due to interruption.`);
              return;
            }
            this.events.onToolCallComplete?.(toolName, result, lastRequestId);
          }
        };

        this.session?.once("agent_tool_end", onEndCleanup);
      });

      this.session.on("history_added", (item) => {
        if (item.type === "message") {
          const role = item.role === "assistant" ? "prosis" : "user";
          let text = "";
          if (Array.isArray(item.content)) {
            text = item.content
              .map((c: any) => c.text || c.transcript || "")
              .filter(Boolean)
              .join(" ");
          }
          if (text.trim()) {
            this.events.onTranscript(text.trim(), true, role);
          }
        }
      });

      this.session.on("transport_event", (event: any) => {
        if (event?.type === "input_audio_buffer.speech_started") {
          if (this.state === "speaking") {
            this.interrupt();
          } else {
            this.setState("listening");
          }
        } else if (event?.type === "input_audio_buffer.speech_stopped") {
          this.setState("thinking");
        } else if (event?.type === "response.audio_transcript.delta" && event.delta) {
          this.events.onTranscript(event.delta, false, "prosis");
        } else if (event?.type === "conversation.item.input_audio_transcription.completed" && event.transcript) {
          this.events.onTranscript(event.transcript.trim(), true, "user");
        }
      });

      this.session.on("error", (err: any) => {
        console.error("[ProsisRealtimeSession] SDK error:", err);
        this.setState("error");
        this.events.onError(err.error?.message || "Realtime session encountered an error.");
      });

      // 8. Connect to OpenAI Realtime API using ephemeral token
      await this.session.connect({
        apiKey: ephemeralKey,
        model,
      });

      this.setState("connected");
      setTimeout(() => {
        if (this.state === "connected") {
          this.setState("listening");
        }
      }, 150);

      return { success: true, provider: "openai_webrtc" };
    } catch (err: any) {
      console.error("[ProsisRealtimeSession] Connection exception:", err);
      this.setState("error");
      this.events.onError(err.message || "Failed to initialize Realtime WebRTC connection.");
      this.disconnect();
      return {
        success: false,
        provider: "unconfigured",
        code: "CONNECTION_FAILED",
        message: err.message || "Failed to connect",
      };
    }
  }

  /**
   * Barge-in interruption: immediately halts model audio playback and switches to listening.
   */
  public interrupt(): void {
    this.toolExecutionEpoch++; // Discard any executing tool outputs
    if (this.state === "speaking" || this.state === "executing") {
      this.setState("interrupted");
      try {
        this.session?.interrupt();
      } catch (err) {
        console.warn("[ProsisRealtimeSession] Session interrupt warning:", err);
      }
      try {
        this.transport?.interrupt();
      } catch (err) {
        console.warn("[ProsisRealtimeSession] Transport interrupt warning:", err);
      }
      setTimeout(() => {
        if (this.state === "interrupted") {
          this.setState("listening");
        }
      }, 80);
    }
  }

  /**
   * Mutes or unmutes the local microphone stream.
   */
  public mute(muted: boolean): void {
    try {
      this.session?.mute(muted);
    } catch {}
  }

  /**
   * Closes the session and frees all media hardware.
   */
  public disconnect(): void {
    this.toolExecutionEpoch++;

    if (this.amplitudeInterval) {
      clearInterval(this.amplitudeInterval);
      this.amplitudeInterval = null;
    }

    try {
      this.session?.close();
    } catch {}
    this.session = null;

    try {
      this.transport?.close();
    } catch {}
    this.transport = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioEl) {
      this.audioEl.srcObject = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    this.analyser = null;
    if (this.state !== "CONFIGURATION_ERROR") {
      this.setState("disconnected");
      setTimeout(() => {
        if (this.state === "disconnected") {
          this.setState("idle");
        }
      }, 150);
    }
  }

  private setupLocalAudioAnalysis(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);

      this.amplitudeInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        const normalized = Math.min(avg / 128, 1.0);
        this.events.onAmplitudeChange(normalized, "mic");
      }, 60);
    } catch (e) {
      console.warn("[ProsisRealtimeSession] Local analysis bypassed:", e);
    }
  }
}
