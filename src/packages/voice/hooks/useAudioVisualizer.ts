"use client";

import { useState, useCallback, useRef } from "react";

export function useAudioVisualizer() {
  const [amplitude, setAmplitude] = useState<number>(0);
  const [activeSource, setActiveSource] = useState<"mic" | "speaker" | "none">("none");
  const smoothedRef = useRef<number>(0);

  const updateAmplitude = useCallback(
    (rawAmp: number, source: "mic" | "speaker") => {
      // Exponential moving average smoothing (alpha = 0.3)
      smoothedRef.current = smoothedRef.current * 0.7 + rawAmp * 0.3;
      setAmplitude(Math.min(Math.max(smoothedRef.current, 0), 1));
      setActiveSource(rawAmp > 0.02 ? source : "none");
    },
    []
  );

  const resetAmplitude = useCallback(() => {
    smoothedRef.current = 0;
    setAmplitude(0);
    setActiveSource("none");
  }, []);

  return {
    amplitude,
    activeSource,
    updateAmplitude,
    resetAmplitude,
  };
}

