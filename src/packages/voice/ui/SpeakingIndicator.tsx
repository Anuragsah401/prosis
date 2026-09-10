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
    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full surface-glass border border-core-violet/30 text-xs font-mono shadow-sm">
      <Volume2 className="w-3.5 h-3.5 text-core-violet animate-pulse" />

      <span className="text-[10px] text-core-violet tracking-wider font-semibold uppercase">
        Speaking
      </span>

      <VoiceWaveform amplitude={amplitude} activeSource="speaker" barCount={12} />

      <button
        onClick={onInterrupt}
        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
        title="Interrupt speaking"
        aria-label="Interrupt speech"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

