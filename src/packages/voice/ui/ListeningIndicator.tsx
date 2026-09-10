"use client";

import React from "react";
import { Mic } from "lucide-react";
import { VoiceWaveform } from "./VoiceWaveform";

interface ListeningIndicatorProps {
  amplitude: number;
  transcript?: string;
  onStop?: () => void;
}

export const ListeningIndicator: React.FC<ListeningIndicatorProps> = ({
  amplitude,
  transcript,
  onStop,
}) => {
  return (
    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full surface-glass border border-core-cyan/30 text-xs font-mono shadow-sm">
      <div className="relative flex items-center justify-center w-5 h-5">
        <span
          className="absolute inset-0 rounded-full bg-core-cyan/20 animate-ping"
          style={{ transform: `scale(${1 + amplitude * 0.8})` }}
        />
        <Mic className="w-3.5 h-3.5 text-core-cyan relative z-10" />
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] text-core-cyan tracking-wider font-semibold uppercase">
          Listening
        </span>
        {transcript && (
          <span className="text-[11px] text-gray-300 font-sans italic max-w-[200px] truncate">
            &ldquo;{transcript}&rdquo;
          </span>
        )}
      </div>

      <VoiceWaveform amplitude={amplitude} activeSource="mic" barCount={12} />
    </div>
  );
};

