/**
 * @prosis/voice - Audio Transport & Voice Activity Detection (VAD)
 * Web Audio API wrapper providing low-latency audio capture, frequency analysis,
 * and energy-threshold VAD for instant barge-in detection.
 */

export interface AudioTransportConfig {
  fftSize?: number;
  vadThreshold?: number; // 0.0 - 1.0 energy threshold for speech detection
  smoothingTimeConstant?: number;
}

export class AudioTransport {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private config: Required<AudioTransportConfig>;
  private isCapturing = false;

  constructor(config?: AudioTransportConfig) {
    this.config = {
      fftSize: config?.fftSize ?? 128,
      vadThreshold: config?.vadThreshold ?? 0.22,
      smoothingTimeConstant: config?.smoothingTimeConstant ?? 0.8,
    };
  }

  /**
   * Initialize AudioContext and acquire user microphone
   */
  public async startCapture(): Promise<MediaStream> {
    if (typeof window === "undefined") {
      throw new Error("AudioTransport requires a browser environment");
    }

    if (this.isCapturing && this.mediaStream) {
      return this.mediaStream;
    }

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser");
    }

    this.audioContext = new AudioContextClass();
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Acquire microphone with AEC (Acoustic Echo Cancellation)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.mediaStream = stream;

    // Create AnalyserNode
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.config.fftSize;
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.sourceNode.connect(this.analyser);
    this.isCapturing = true;

    return stream;
  }

  /**
   * Stop audio capture and release audio hardware cleanly
   */
  public stopCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    this.analyser = null;
    this.isCapturing = false;
  }

  /**
   * Get normalized amplitude (0.0 to 1.0) for visualizers and VAD
   */
  public getAmplitude(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }

    const average = sum / bufferLength;
    return Math.min(average / 128, 1.0);
  }

  /**
   * Voice Activity Detection (VAD) check
   * Returns true if audio energy exceeds the configured threshold
   */
  public isSpeechDetected(): boolean {
    return this.getAmplitude() >= this.config.vadThreshold;
  }

  public isActive(): boolean {
    return this.isCapturing;
  }
}

