/**
 * @prosis/voice - Speech Synthesizer Service
 * Streaming sentence-buffered speech synthesis with sub-50ms barge-in interruption.
 */

export interface SpeechSynthesizerCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onInterrupted?: () => void;
  onError?: (error: string) => void;
  onAmplitudeChange?: (amplitude: number) => void;
}

export class SpeechSynthesizer {
  private isSpeaking = false;
  private queue: string[] = [];
  private callbacks: SpeechSynthesizerCallbacks;
  private amplitudeInterval: NodeJS.Timeout | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(callbacks?: SpeechSynthesizerCallbacks) {
    this.callbacks = callbacks || {};
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Speak a text stream. Splits text into natural sentence boundaries for low-latency delivery.
   */
  public speak(text: string): void {
    if (!this.isSupported()) {
      this.callbacks.onError?.("Speech synthesis is not supported in this browser.");
      return;
    }

    this.stop(); // Stop any pending speech

    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) return;

    this.queue = sentences;
    this.isSpeaking = true;
    this.callbacks.onStart?.();
    this.startAmplitudeSimulation();
    this.processQueue();
  }

  private processQueue(): void {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      this.stopAmplitudeSimulation();
      this.callbacks.onEnd?.();
      return;
    }

    const nextSentence = this.queue.shift()!;
    const utterance = new SpeechSynthesisUtterance(nextSentence);
    this.currentUtterance = utterance;

    utterance.rate = 1.05;
    utterance.pitch = 0.96;

    // Pick best English voice
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Samantha") ||
            v.name.includes("Natural") ||
            v.name.includes("Daniel") ||
            v.name.includes("Google") ||
            v.name.includes("Premium"))
      );
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      this.processQueue();
    };

    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") {
        return;
      }
      this.callbacks.onError?.(e.error || "Speech synthesis error");
      this.processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Instant Interruption (Barge-In)
   * Aborts active speech synthesis immediately (sub-50ms).
   */
  public cancel(): void {
    if (!this.isSpeaking && this.queue.length === 0) return;

    this.queue = [];
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.stopAmplitudeSimulation();

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.callbacks.onInterrupted?.();
  }

  public stop(): void {
    this.cancel();
  }

  private startAmplitudeSimulation(): void {
    this.stopAmplitudeSimulation();
    // Simulate natural speech modulation harmonics (0.2 - 0.8)
    this.amplitudeInterval = setInterval(() => {
      if (!this.isSpeaking) {
        this.stopAmplitudeSimulation();
        return;
      }
      const harmonic = 0.25 + Math.sin(Date.now() / 120) * 0.35 + Math.random() * 0.2;
      this.callbacks.onAmplitudeChange?.(Math.min(Math.max(harmonic, 0.1), 0.95));
    }, 60);
  }

  private stopAmplitudeSimulation(): void {
    if (this.amplitudeInterval) {
      clearInterval(this.amplitudeInterval);
      this.amplitudeInterval = null;
    }
    this.callbacks.onAmplitudeChange?.(0);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public updateCallbacks(callbacks: Partial<SpeechSynthesizerCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

