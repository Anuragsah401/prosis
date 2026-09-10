/**
 * @prosis/voice - Speech Recognizer Service
 * Low-latency streaming speech recognition using the Web Speech API with interim results.
 */

export interface SpeechRecognizerCallbacks {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private shouldRestart = false;
  private callbacks: SpeechRecognizerCallbacks;

  constructor(callbacks?: SpeechRecognizerCallbacks) {
    this.callbacks = callbacks || {};
  }

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start(): boolean {
    if (!this.isSupported()) {
      this.callbacks.onError?.("Speech recognition is not supported in this browser.");
      return false;
    }

    if (this.isListening) return true;

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onSpeechStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalText.trim().length > 0) {
          this.callbacks.onFinalTranscript?.(finalText.trim());
        } else if (interimText.trim().length > 0) {
          this.callbacks.onInterimTranscript?.(interimText.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        // "no-speech" is a non-fatal timeout
        if (event.error === "no-speech") return;
        this.callbacks.onError?.(event.error || "Speech recognition error");
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onSpeechEnd?.();

        // Auto-restart if session is still active
        if (this.shouldRestart) {
          try {
            this.recognition?.start();
          } catch {}
        }
      };

      this.shouldRestart = true;
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.callbacks.onError?.(err.message || "Failed to initialize speech recognition");
      return false;
    }
  }

  public stop(): void {
    this.shouldRestart = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public updateCallbacks(callbacks: Partial<SpeechRecognizerCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

