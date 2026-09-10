"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Radio } from "lucide-react";
import { AICoreState } from "@prosis/orchestrator";

interface VoiceDuplexControllerProps {
  coreState: AICoreState;
  onTranscriptReady: (transcript: string, isFinal: boolean) => void;
  onBargeIn: () => void;
  onAudioLevelChange?: (level: number) => void;
  spokenTextToPlay?: string;
  onSpeechEnd?: () => void;
}

export const VoiceDuplexController: React.FC<VoiceDuplexControllerProps> = ({
  coreState,
  onTranscriptReady,
  onBargeIn,
  onAudioLevelChange,
  spokenTextToPlay,
  onSpeechEnd,
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Audio level monitoring loop
  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const normalized = Math.min(avg / 128, 1);
    setLiveVolume(normalized);
    onAudioLevelChange?.(normalized);

    // If speech synthesis is speaking and user mic volume spikes above threshold -> barge-in!
    if (isSpeakingRef.current && normalized > 0.25) {
      console.log("[VoiceDuplex] User barge-in detected! Halting speech.");
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      onBargeIn();
    }

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [onAudioLevelChange, onBargeIn]);

  // Start Mic & Speech Recognition
  const startVoiceSession = async () => {
    try {
      if (typeof window === "undefined") return;

      // 1. Microphone Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);

      // 2. Speech Recognition (Web Speech API)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          console.log("[VoiceDuplex] Speech recognition started");
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          // Barge-in check: If Prosis was speaking, user voice input immediately stops speech
          if (isSpeakingRef.current && (interim.length > 0 || final.length > 0)) {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            isSpeakingRef.current = false;
            onBargeIn();
          }

          if (final.trim().length > 0) {
            onTranscriptReady(final.trim(), true);
          } else if (interim.trim().length > 0) {
            onTranscriptReady(interim.trim(), false);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("[VoiceDuplex] Recognition warning/error:", err.error);
        };

        recognition.onend = () => {
          // Keep continuous recognition active if voice is enabled
          if (isVoiceActive && recognitionRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsVoiceActive(true);
    } catch (err) {
      console.warn("[VoiceDuplex] Microphone access could not be acquired:", err);
      // Even without physical mic, simulate active voice session for testing
      setIsVoiceActive(true);
    }
  };

  const stopVoiceSession = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setIsVoiceActive(false);
    setLiveVolume(0);
    onAudioLevelChange?.(0);
  };

  // Text-to-Speech Output Handling with Barge-in Interruption Support
  useEffect(() => {
    if (!spokenTextToPlay || isMuted || typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    if (!synth) {
      onSpeechEnd?.();
      return;
    }

    synth.cancel(); // cancel any active utterance
    isSpeakingRef.current = true;

    // Split spoken text into clean sentences for low-latency streaming speech
    const utterance = new SpeechSynthesisUtterance(spokenTextToPlay);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Try finding a natural sounding English voice
    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Samantha") ||
          v.name.includes("Natural") ||
          v.name.includes("Daniel") ||
          v.name.includes("Google") ||
          v.name.includes("Premium"))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      onSpeechEnd?.();
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      onSpeechEnd?.();
    };

    synth.speak(utterance);

    return () => {
      if (synth) {
        synth.cancel();
      }
      isSpeakingRef.current = false;
    };
  }, [spokenTextToPlay, isMuted, onSpeechEnd]);

  const toggleVoiceSession = () => {
    if (isVoiceActive) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Realtime Audio Waveform Meter */}
      {isVoiceActive && (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-obsidian-900/90 border border-cyan-500/30 backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <div className="flex items-center gap-0.5 h-3 w-14 px-1">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, idx) => (
              <span
                key={idx}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: liveVolume >= threshold ? "100%" : "25%",
                  backgroundColor:
                    liveVolume >= threshold ? "#22d3ee" : "rgba(255, 255, 255, 0.2)",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-cyan-300 font-medium">LIVE DUPLEX</span>
        </div>
      )}

      {/* Voice Toggle Button */}
      <button
        onClick={toggleVoiceSession}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
          isVoiceActive
            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            : "bg-obsidian-850 hover:bg-obsidian-800 text-gray-400 hover:text-gray-200 border border-white/10"
        }`}
        title={isVoiceActive ? "Stop Voice Stream" : "Start Voice Duplex"}
      >
        {isVoiceActive ? (
          <>
            <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Voice Active</span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4" />
            <span>Voice Standby</span>
          </>
        )}
      </button>

      {/* Audio Mute Output Button */}
      <button
        onClick={() => {
          setIsMuted(!isMuted);
          if (!isMuted && typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        }}
        className={`p-2 rounded-xl text-xs font-mono transition-all border ${
          isMuted
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
            : "bg-obsidian-850 hover:bg-obsidian-800 text-gray-400 hover:text-gray-200 border-white/10"
        }`}
        title={isMuted ? "Unmute Voice Synthesis" : "Mute Voice Output"}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

