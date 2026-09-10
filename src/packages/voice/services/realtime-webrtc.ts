/**
 * @prosis/voice - Realtime WebRTC Audio Client
 * Direct browser-to-OpenAI WebRTC transport with ephemeral session tokens,
 * bidirectional audio streaming, sub-50ms barge-in interruption, and tool calling.
 */

export type RealtimeVoiceState =
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
  | "disconnected";

export interface RealtimeWebRTCEvents {
  onStateChange: (state: RealtimeVoiceState) => void;
  onTranscript: (text: string, isFinal: boolean, role: "user" | "prosis") => void;
  onAmplitudeChange: (amplitude: number, source: "mic" | "speaker") => void;
  onError: (error: string) => void;
  onToolCallStart?: (toolName: string, args: Record<string, any>) => void;
  onToolCallComplete?: (toolName: string, result: any) => void;
}

export class RealtimeWebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private amplitudeInterval: NodeJS.Timeout | null = null;

  private state: RealtimeVoiceState = "idle";
  private events: RealtimeWebRTCEvents;
  private conversationId: string;

  constructor(events: RealtimeWebRTCEvents, conversationId = "conv_realtime") {
    this.events = events;
    this.conversationId = conversationId;
  }

  public getState(): RealtimeVoiceState {
    return this.state;
  }

  private setState(next: RealtimeVoiceState): void {
    if (this.state === next) return;
    this.state = next;
    this.events.onStateChange(next);
  }

  /**
   * Connects to the OpenAI Realtime WebRTC API using a server-minted ephemeral token.
   */
  public async connect(): Promise<{ success: boolean; provider: "openai_webrtc" | "local_fallback" }> {
    try {
      this.setState("connecting");

      // 1. Acquire user microphone
      if (typeof window === "undefined" || !navigator.mediaDevices) {
        throw new Error("Microphone requires a secure browser context.");
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Set up local microphone audio analysis for visual amplitude
      this.setupLocalAudioAnalysis(this.mediaStream);

      // 3. Request ephemeral session token from Prosis server
      const sessionRes = await fetch("/api/v1/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!sessionRes.ok) {
        throw new Error(`Failed to initialize session: HTTP ${sessionRes.status}`);
      }

      const sessionJson = await sessionRes.json();

      // If server does not have OPENAI_API_KEY configured, notify caller to route to local engine
      if (sessionJson.provider === "local_fallback" || !sessionJson.client_secret) {
        this.disconnect();
        return { success: false, provider: "local_fallback" };
      }

      const ephemeralKey = sessionJson.client_secret;
      const model = sessionJson.model || "gpt-realtime";

      // 4. Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      this.peerConnection = pc;

      // 5. Audio element for remote assistant voice
      if (!this.audioEl) {
        const el = document.createElement("audio");
        el.autoplay = true;
        el.style.display = "none";
        document.body.appendChild(el);
        this.audioEl = el;
      }

      pc.ontrack = (event) => {
        if (this.audioEl) {
          this.audioEl.srcObject = event.streams[0];
          this.audioEl.play().catch((err) => {
            console.warn("[RealtimeWebRTC] Audio autoplay blocked:", err);
          });
        }
      };

      // 6. Add local microphone audio track to peer connection
      this.mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.mediaStream!);
      });

      // 7. Create Data Channel for bidirectional Realtime events
      const dc = pc.createDataChannel("oai-events");
      this.dataChannel = dc;
      this.setupDataChannel(dc);

      // 8. Create and set local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 9. Exchange SDP offer with OpenAI Realtime API using ephemeral token
      const baseUrl = "https://api.openai.com/v1/realtime";
      const sdpRes = await fetch(`${baseUrl}?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const errorDetail = await sdpRes.text();
        throw new Error(`OpenAI WebRTC negotiation failed: ${errorDetail}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      this.setState("connected");
      setTimeout(() => {
        if (this.state === "connected") {
          this.setState("listening");
        }
      }, 200);

      return { success: true, provider: "openai_webrtc" };
    } catch (err: any) {
      console.error("[RealtimeWebRTC] Connection error:", err);
      this.setState("error");
      this.events.onError(err.message || "Failed to establish Realtime WebRTC connection.");
      this.disconnect();
      return { success: false, provider: "local_fallback" };
    }
  }

  /**
   * Sets up real-time event routing from OpenAI data channel.
   */
  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      console.log("[RealtimeWebRTC] Data channel open. Realtime session operational.");
    };

    dc.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this.handleRealtimeEvent(msg);
      } catch (err) {
        console.warn("[RealtimeWebRTC] Error parsing message:", err);
      }
    };

    dc.onerror = (err) => {
      console.error("[RealtimeWebRTC] Data channel error:", err);
      this.setState("error");
    };

    dc.onclose = () => {
      console.log("[RealtimeWebRTC] Data channel closed.");
      if (this.state !== "idle") {
        this.setState("disconnected");
      }
    };
  }

  /**
   * Processes realtime events strictly from OpenAI server.
   */
  private async handleRealtimeEvent(msg: any): Promise<void> {
    switch (msg.type) {
      // 1. User speech started (Acoustic intake or barge-in interruption)
      case "input_audio_buffer.speech_started":
        if (this.state === "speaking") {
          this.setState("interrupted");
          setTimeout(() => this.setState("listening"), 80);
        } else {
          this.setState("listening");
        }
        break;

      // 2. User speech stopped
      case "input_audio_buffer.speech_stopped":
        this.setState("thinking");
        break;

      // 3. Assistant starts emitting audio
      case "response.audio.delta":
        if (this.state !== "speaking") {
          this.setState("speaking");
        }
        break;

      // 4. Assistant completed audio output
      case "response.done":
        this.setState("listening");
        break;

      // 5. User speech transcription completed
      case "conversation.item.input_audio_transcription.completed":
        if (msg.transcript) {
          this.events.onTranscript(msg.transcript.trim(), true, "user");
        }
        break;

      // 6. Assistant speech transcription
      case "response.audio_transcript.delta":
        if (msg.delta) {
          this.events.onTranscript(msg.delta, false, "prosis");
        }
        break;

      case "response.audio_transcript.done":
        if (msg.transcript) {
          this.events.onTranscript(msg.transcript.trim(), true, "prosis");
        }
        break;

      // 7. Function / Tool Calling from model
      case "response.function_call_arguments.done":
        await this.handleFunctionCall(msg);
        break;

      // 8. Explicit error message from OpenAI
      case "error":
        console.error("[RealtimeWebRTC] Server error:", msg.error);
        this.setState("error");
        this.events.onError(msg.error?.message || "Realtime server error occurred.");
        break;

      default:
        break;
    }
  }

  /**
   * Handles tool call execution and feeds result back to model.
   */
  private async handleFunctionCall(msg: { call_id: string; name: string; arguments: string }): Promise<void> {
    this.setState("executing");
    const { call_id, name, arguments: rawArgs } = msg;

    let parsedArgs: Record<string, any> = {};
    try {
      parsedArgs = JSON.parse(rawArgs);
    } catch {
      parsedArgs = {};
    }

    this.events.onToolCallStart?.(name, parsedArgs);

    try {
      const res = await fetch("/api/v1/realtime/tool-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: name,
          parameters: parsedArgs,
          conversationId: this.conversationId,
        }),
      });

      const json = await res.json();
      const toolOutput = json.data || json.error || { status: "executed" };

      this.events.onToolCallComplete?.(name, toolOutput);

      // Send function output back to OpenAI
      this.sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id,
          output: JSON.stringify(toolOutput),
        },
      });

      // Request model to vocalize explanation of tool result
      this.sendEvent({
        type: "response.create",
      });
    } catch (err: any) {
      console.error(`[RealtimeWebRTC] Tool execution failed for ${name}:`, err);
      this.sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id,
          output: JSON.stringify({ error: err.message || "Execution error" }),
        },
      });
      this.sendEvent({ type: "response.create" });
    }
  }

  /**
   * Send client event across data channel
   */
  public sendEvent(eventObj: Record<string, any>): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(eventObj));
    }
  }

  /**
   * Instant Barge-in Interruption: Cancels current model response in progress.
   */
  public interrupt(): void {
    if (this.state === "speaking") {
      this.setState("interrupted");
      this.sendEvent({ type: "response.cancel" });
      setTimeout(() => {
        if (this.state === "interrupted") {
          this.setState("listening");
        }
      }, 100);
    }
  }

  /**
   * Disconnects cleanly, halting audio tracks and closing peer connections.
   */
  public disconnect(): void {
    if (this.amplitudeInterval) {
      clearInterval(this.amplitudeInterval);
      this.amplitudeInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
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
    this.setState("disconnected");
    setTimeout(() => {
      this.setState("idle");
    }, 150);
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
      console.warn("[RealtimeWebRTC] Local analysis setup bypassed:", e);
    }
  }
}
