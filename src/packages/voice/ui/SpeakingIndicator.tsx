"use client";

import React from "react";
import { Volume2, X } from "lucide-react";
import { VoiceWaveform } from "./VoiceWaveform";

interface SpeakingIndicatorProps {
  amplitude: number;
  onInterrupt: () => void;
}

export const SpeakingIndicator: React.FC<SpeakingIndicatorProps> = ({
  amplitude,
  onInterrupt,
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full surface-hud-glow border border-core-violet/50 text-xs font-mono shadow-[0_0_25px_rgba(139,92,246,0.25)] bg-obsidian-975/90 backdrop-blur-xl">
      <Volume2 className="w-3.5 h-3.5 text-core-violet animate-pulse" />

      <span className="text-[10px] text-core-violet tracking-widest font-semibold uppercase">
        ● Speaking
      </span>

      <VoiceWaveform amplitude={amplitude} activeSource="speaker" barCount={12} />

      <button
        onClick={onInterrupt}
        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1 active:scale-95"
        title="Interrupt speaking"
        aria-label="Interrupt speech"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

