/**
 * @prosis/voice/gemini - Prosis Gemini Live Session
 * Implements bidirectional audio streaming via Google Gemini 2.0 Flash
 * Multimodal Live API over WebSocket. Drop-in replacement for ProsisRealtimeSession
 * when VOICE_PROVIDER=gemini.
 */

import type { ProsisRealtimeState, ProsisRealtimeSessionEvents } from "../realtime/prosis-realtime-session";

const GEMINI_WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

// PCM audio constants
const INPUT_SAMPLE_RATE = 16000;  // 16kHz mono PCM for input
const OUTPUT_SAMPLE_RATE = 24000; // 24kHz mono PCM for output
const AUDIO_CHUNK_MS = 100;       // Send audio every 100ms

interface GeminiSessionConfig {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  tools?: GeminiToolDeclaration[];
}

interface GeminiToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class ProsisGeminiLiveSession {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputAudioContext: AudioContext | null = null;
  private amplitudeInterval: NodeJS.Timeout | null = null;
  private audioChunkInterval: NodeJS.Timeout | null = null;

  // Audio playback queue
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  private state: ProsisRealtimeState = "idle";
  private events: ProsisRealtimeSessionEvents;
  private conversationId: string;
  private toolExecutionEpoch = 0;
  private config: GeminiSessionConfig | null = null;
  private setupComplete = false;
  private resolveConnect: ((val: any) => void) | null = null;

  // Pending input audio buffer (accumulated PCM samples)
  private pendingAudioChunks: Int16Array[] = [];

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
   * Connect to Gemini Live API via WebSocket.
   * The apiKey and model are passed from the session route response.
   */
  public async connect(config: GeminiSessionConfig): Promise<{
    success: boolean;
    provider: "gemini" | "unconfigured";
    code?: string;
    message?: string;
  }> {
    try {
      this.setState("connecting");
      this.config = config;

      if (typeof window === "undefined" || !navigator.mediaDevices) {
        const msg = "Microphone environment is not supported in this browser context.";
        this.setState("error");
        this.events.onError(msg);
        return { success: false, provider: "unconfigured", code: "ENVIRONMENT_UNSUPPORTED", message: msg };
      }

      // 1. Acquire microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: INPUT_SAMPLE_RATE,
        },
      });

      // 2. Set up audio capture pipeline
      this.setupAudioCapture(this.mediaStream);

      // 3. Set up output audio context for playback
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioContext = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });

      // 4. Connect WebSocket to Gemini
      const wsUrl = `${GEMINI_WS_BASE}?key=${config.apiKey}`;
      
      return new Promise((resolve) => {
        this.resolveConnect = resolve;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[ProsisGeminiLiveSession] WebSocket connected. Sending setup...");
          this.sendSetupMessage();
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onerror = (err) => {
          console.error("[ProsisGeminiLiveSession] WebSocket error:", err);
          if (!this.setupComplete) {
            this.setState("error");
            this.events.onError("Failed to connect to Gemini Live API.");
            if (this.resolveConnect) {
              this.resolveConnect({
                success: false,
                provider: "unconfigured",
                code: "CONNECTION_FAILED",
                message: "Failed to connect to Gemini Live API WebSocket.",
              });
              this.resolveConnect = null;
            }
          }
        };

        this.ws.onclose = (event) => {
          console.log(`[ProsisGeminiLiveSession] WebSocket closed: code=${event.code} reason=${event.reason}`);
          const reasonMsg = event.reason || (event.code === 1008 ? "Model or policy validation failed" : "Session ended");
          if (!this.setupComplete) {
            this.setState("error");
            this.events.onError(`Gemini connection closed (${event.code}): ${reasonMsg}`);
            if (this.resolveConnect) {
              this.resolveConnect({
                success: false,
                provider: "unconfigured",
                code: "CONNECTION_CLOSED",
                message: reasonMsg,
              });
              this.resolveConnect = null;
            }
          } else if (this.state !== "idle" && this.state !== "disconnected") {
            this.setState("disconnected");
            this.events.onError(`Gemini Live session ended (${event.code}): ${reasonMsg}`);
          }
        };

        // Timeout: if no setup response in 10s, fail
        setTimeout(() => {
          if (!this.setupComplete) {
            this.ws?.close();
            this.setState("error");
            this.events.onError("Gemini Live API connection timed out.");
            if (this.resolveConnect) {
              this.resolveConnect({
                success: false,
                provider: "unconfigured",
                code: "TIMEOUT",
                message: "Connection timed out after 10 seconds.",
              });
              this.resolveConnect = null;
            }
          }
        }, 10000);
      });
    } catch (err: any) {
      console.error("[ProsisGeminiLiveSession] Connection exception:", err);
      this.setState("error");
      this.events.onError(err.message || "Failed to initialize Gemini Live connection.");
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
   * Send the BidiGenerateContentSetup message as the first WS message.
   */
  private sendSetupMessage(): void {
    if (!this.ws || !this.config) return;

    const toolDeclarations = (this.config.tools || []).map((t) => ({
      functionDeclarations: [{
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }],
    }));

    const modelPath = this.config.model.startsWith("models/")
      ? this.config.model
      : `models/${this.config.model}`;

    const setupMsg = {
      setup: {
        model: modelPath,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
        systemInstruction: this.config.systemInstruction
          ? {
              parts: [{ text: this.config.systemInstruction }],
            }
          : undefined,
        tools: toolDeclarations.length > 0 ? toolDeclarations : undefined,
      },
    };

    this.ws.send(JSON.stringify(setupMsg));
    console.log("[ProsisGeminiLiveSession] Setup message sent.");
  }

  /**
   * Handle incoming server messages from Gemini Live API.
   */
  private async handleServerMessage(rawData: string | ArrayBuffer | Blob): Promise<void> {
    try {
      let text = "";
      if (typeof rawData === "string") {
        text = rawData;
      } else if (rawData instanceof Blob) {
        text = await rawData.text();
      } else if (rawData instanceof ArrayBuffer) {
        text = new TextDecoder().decode(rawData);
      } else {
        return;
      }

      const msg = JSON.parse(text);
      this.processGeminiMessage(msg);
    } catch (e) {
      console.warn("[ProsisGeminiLiveSession] Message parse error:", e);
    }
  }

  /**
   * Process parsed Gemini server message.
   */
  private processGeminiMessage(msg: any): void {
    // Setup complete acknowledgment from Gemini
    if (msg.setupComplete) {
      console.log("[ProsisGeminiLiveSession] Setup acknowledged by Gemini server.");
      if (!this.setupComplete) {
        this.setupComplete = true;
        this.setState("connected");
        setTimeout(() => {
          if (this.state === "connected") {
            this.setState("listening");
            this.startAudioStreaming();
          }
        }, 120);
        if (this.resolveConnect) {
          this.resolveConnect({ success: true, provider: "gemini" });
          this.resolveConnect = null;
        }
      }
      return;
    }

    // Server content (model turn with audio/text)
    if (msg.serverContent) {
      const sc = msg.serverContent;

      // Barge-in / interruption
      if (sc.interrupted) {
        console.log("[ProsisGeminiLiveSession] Server signaled interruption (barge-in).");
        this.handleInterruption();
        return;
      }

      // Model turn parts
      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          // Audio data
          if (part.inlineData?.mimeType?.startsWith("audio/") && part.inlineData.data) {
            this.setState("speaking");
            this.enqueueAudioChunk(part.inlineData.data);
          }
          // Text response
          if (part.text) {
            this.events.onTranscript(part.text, false, "prosis");
          }
        }
      }

      // Turn complete
      if (sc.turnComplete) {
        // Emit final transcript if there was text
        if (this.state === "speaking") {
          // Audio will finish playing via the queue
        } else {
          this.setState("listening");
        }
      }
      return;
    }

    // Tool calls from model
    if (msg.toolCall) {
      this.handleToolCalls(msg.toolCall);
      return;
    }

    // Tool call cancellation
    if (msg.toolCallCancellation) {
      console.log("[ProsisGeminiLiveSession] Tool call cancelled by server.");
      this.toolExecutionEpoch++;
      return;
    }
  }

  /**
   * Handle tool function calls from Gemini.
   * Dispatches to the server tool-call gateway and sends responses back.
   */
  private async handleToolCalls(toolCall: any): Promise<void> {
    const functionCalls = toolCall.functionCalls || [];
    if (functionCalls.length === 0) return;

    this.setState("executing");
    const currentEpoch = ++this.toolExecutionEpoch;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const responses: any[] = [];

    for (const fc of functionCalls) {
      const toolName = fc.name;
      const args = fc.args || {};

      this.events.onToolCallStart?.(toolName, args, requestId);

      try {
        // Dispatch through server tool gateway
        const res = await fetch("/api/v1/realtime/tool-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName,
            arguments: args,
            requestId,
            sessionId: this.conversationId,
            conversationId: this.conversationId,
            interruptionEpoch: currentEpoch,
          }),
        });

        const result = await res.json();

        // Check epoch staleness
        if (currentEpoch !== this.toolExecutionEpoch) {
          console.log(`[ProsisGeminiLiveSession] Discarding stale tool result for ${toolName}.`);
          return;
        }

        this.events.onToolCallComplete?.(toolName, result, requestId);

        responses.push({
          name: fc.name,
          id: fc.id,
          response: {
            result: result.success ? result.data : { error: result.error?.message || "Tool execution failed" },
          },
        });
      } catch (err: any) {
        console.error(`[ProsisGeminiLiveSession] Tool ${toolName} error:`, err);

        if (currentEpoch !== this.toolExecutionEpoch) return;

        this.events.onToolCallComplete?.(toolName, { error: err.message }, requestId);

        responses.push({
          name: fc.name,
          id: fc.id,
          response: {
            error: err.message || "Tool execution failed",
          },
        });
      }
    }

    // Send tool responses back to Gemini
    if (this.ws && this.ws.readyState === WebSocket.OPEN && responses.length > 0) {
      const toolResponseMsg = {
        toolResponse: {
          functionResponses: responses,
        },
      };
      this.ws.send(JSON.stringify(toolResponseMsg));
      console.log(`[ProsisGeminiLiveSession] Sent ${responses.length} tool response(s).`);
    }

    if (this.state === "executing") {
      this.setState("thinking");
    }
  }

  /**
   * Handle barge-in interruption.
   */
  private handleInterruption(): void {
    this.toolExecutionEpoch++;
    this.setState("interrupted");

    // Flush audio playback queue
    this.audioQueue = [];
    this.isPlaying = false;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }

    setTimeout(() => {
      if (this.state === "interrupted") {
        this.setState("listening");
      }
    }, 80);
  }

  /**
   * Interrupt: callable externally for barge-in.
   */
  public interrupt(): void {
    this.handleInterruption();
  }

  /**
   * Mute/unmute microphone.
   */
  public mute(muted: boolean): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
  }

  /**
   * Disconnect and clean up all resources.
   */
  public disconnect(): void {
    this.toolExecutionEpoch++;
    this.setupComplete = false;

    // Stop audio streaming
    if (this.audioChunkInterval) {
      clearInterval(this.audioChunkInterval);
      this.audioChunkInterval = null;
    }

    if (this.amplitudeInterval) {
      clearInterval(this.amplitudeInterval);
      this.amplitudeInterval = null;
    }

    // Close script processor
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    // Close WebSocket
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    // Close audio contexts
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
    }
    this.audioContext = null;
    this.inputAnalyser = null;

    if (this.outputAudioContext && this.outputAudioContext.state !== "closed") {
      try {
        this.outputAudioContext.close();
      } catch {}
    }
    this.outputAudioContext = null;

    // Flush audio queue
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentSource = null;
    this.pendingAudioChunks = [];

    if (this.state !== "CONFIGURATION_ERROR") {
      this.setState("disconnected");
      setTimeout(() => {
        if (this.state === "disconnected") {
          this.setState("idle");
        }
      }, 150);
    }
  }

  // ─── Audio Capture Pipeline ──────────────────────────────────────

  /**
   * Set up microphone capture → PCM 16-bit → base64 chunks.
   */
  private setupAudioCapture(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx({ sampleRate: INPUT_SAMPLE_RATE });
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = 128;
      this.inputAnalyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.inputAnalyser);

      // ScriptProcessor to capture raw PCM samples
      // Note: ScriptProcessorNode is deprecated but universally supported;
      // AudioWorklet requires a separate file which complicates bundling.
      const bufferSize = 4096;
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert float32 [-1,1] to int16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.pendingAudioChunks.push(pcm16);
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      // Amplitude monitoring for visual ripples
      const freqBuffer = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      this.amplitudeInterval = setInterval(() => {
        if (!this.inputAnalyser) return;
        this.inputAnalyser.getByteFrequencyData(freqBuffer);
        let sum = 0;
        for (let i = 0; i < freqBuffer.length; i++) sum += freqBuffer[i];
        const avg = sum / freqBuffer.length;
        const normalized = Math.min(avg / 128, 1.0);
        this.events.onAmplitudeChange(normalized, "mic");
      }, 60);
    } catch (e) {
      console.warn("[ProsisGeminiLiveSession] Audio capture setup failed:", e);
    }
  }

  /**
   * Start streaming accumulated audio chunks to Gemini via WebSocket.
   */
  private startAudioStreaming(): void {
    this.audioChunkInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      if (this.pendingAudioChunks.length === 0) return;

      // Merge all pending chunks
      const totalLen = this.pendingAudioChunks.reduce((s, c) => s + c.length, 0);
      const merged = new Int16Array(totalLen);
      let offset = 0;
      for (const chunk of this.pendingAudioChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      this.pendingAudioChunks = [];

      // Convert to base64
      const bytes = new Uint8Array(merged.buffer);
      const base64 = this.uint8ArrayToBase64(bytes);

      // Send as realtimeInput (Gemini Live API current audio format)
      const msg = {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        },
      };

      this.ws.send(JSON.stringify(msg));
    }, AUDIO_CHUNK_MS);
  }

  // ─── Audio Playback Pipeline ─────────────────────────────────────

  /**
   * Enqueue a base64-encoded PCM audio chunk for playback.
   */
  private enqueueAudioChunk(base64Data: string): void {
    try {
      const bytes = this.base64ToUint8Array(base64Data);
      // Convert int16 PCM to float32
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }
      this.audioQueue.push(float32);

      if (!this.isPlaying) {
        this.playNextChunk();
      }
    } catch (e) {
      console.warn("[ProsisGeminiLiveSession] Audio enqueue error:", e);
    }
  }

  /**
   * Play the next audio chunk from the queue.
   */
  private playNextChunk(): void {
    if (!this.outputAudioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      if (this.state === "speaking") {
        this.setState("listening");
      }
      // Emit speaker amplitude reset
      this.events.onAmplitudeChange(0, "speaker");
      return;
    }

    this.isPlaying = true;
    const samples = this.audioQueue.shift()!;

    const buffer = this.outputAudioContext.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);

    // Emit approximate speaker amplitude
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += Math.abs(samples[i]);
    const avgAmp = Math.min((sum / samples.length) * 3, 1.0);
    this.events.onAmplitudeChange(avgAmp, "speaker");

    source.onended = () => {
      this.currentSource = null;
      this.playNextChunk();
    };

    this.currentSource = source;
    source.start();
  }

  // ─── Utility ─────────────────────────────────────────────────────

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
