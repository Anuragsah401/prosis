"use client";

import React from "react";

interface VoiceWaveformProps {
  amplitude: number; // 0.0 - 1.0
  activeSource?: "mic" | "speaker" | "none";
  barCount?: number;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  amplitude,
  activeSource = "none",
  barCount = 18,
  className = "",
}) => {
  const isMic = activeSource === "mic";
  const isSpeaker = activeSource === "speaker";

  const color = isMic
    ? "#38bdf8" // Titanium Cyan
    : isSpeaker
    ? "#818cf8" // Soft Violet
    : "rgba(255, 255, 255, 0.2)";

  return (
    <div
      className={`flex items-center gap-[2px] h-5 select-none ${className}`}
      aria-label="Audio Waveform"
    >
      {Array.from({ length: barCount }).map((_, idx) => {
        // Compute harmonic bar height from amplitude and position
        const centerOffset = Math.abs(idx - barCount / 2) / (barCount / 2);
        const curve = 1 - centerOffset * 0.6;
        const waveHarmonic = Math.sin(idx * 0.8 + Date.now() / 200) * 0.2;
        const barHeight = Math.max(
          4,
          (amplitude * curve + waveHarmonic) * 18
        );

        return (
          <span
            key={idx}
            className="w-[2px] rounded-full transition-all duration-75"
            style={{
              height: `${barHeight}px`,
              backgroundColor: amplitude > 0.03 ? color : "rgba(255, 255, 255, 0.15)",
            }}
          />
        );
      })}
    </div>
  );
};

