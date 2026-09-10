"use client";

import React, { useState, useEffect } from "react";
import { Send, Sparkles, Terminal, ArrowUpRight } from "lucide-react";
import { VoiceDuplexController } from "../voice/VoiceDuplexController";
import { AICoreState } from "@prosis/orchestrator";

interface CommandBarProps {
  coreState: AICoreState;
  onSend: (text: string) => void;
  onBargeIn: () => void;
  onAudioLevelChange?: (level: number) => void;
  spokenTextToPlay?: string;
  onSpeechEnd?: () => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  "Prosis, what's happening today?",
  "Show me the restaurants with declining bookings",
  "Prepare emails for those restaurants",
  "Cancel John Smith's reservation",
];

export const CommandBar: React.FC<CommandBarProps> = ({
  coreState,
  onSend,
  onBargeIn,
  onAudioLevelChange,
  spokenTextToPlay,
  onSpeechEnd,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState("");

  const handleVoiceTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim().length > 0) {
      setInputVal("");
      onSend(transcript.trim());
    } else if (!isFinal) {
      setInputVal(transcript);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || disabled) return;
    const text = inputVal.trim();
    setInputVal("");
    onSend(text);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-3">
      {/* Quick Contextual Triggers */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500 pl-1 shrink-0">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>DIRECTIVES:</span>
        </div>
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onSend(action)}
            disabled={disabled}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-obsidian-900/80 hover:bg-obsidian-800 text-gray-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 text-xs font-mono transition-all flex items-center gap-1.5 group active:scale-95 disabled:opacity-40"
          >
            <span>{action}</span>
            <ArrowUpRight className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* Main Omnibar Input */}
      <form
        onSubmit={handleFormSubmit}
        className="relative flex items-center p-2 rounded-2xl bg-obsidian-900/90 border border-white/10 hover:border-white/20 focus-within:border-cyan-500/50 shadow-[0_4px_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all"
      >
        <div className="pl-3 pr-2 text-gray-500">
          <Sparkles className="w-5 h-5 text-cyan-400/80" />
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Direct Prosis or start voice duplex stream..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none py-2 font-sans tracking-wide"
        />

        {/* Voice and Submit Controls */}
        <div className="flex items-center gap-2 pr-1">
          <VoiceDuplexController
            coreState={coreState}
            onTranscriptReady={handleVoiceTranscript}
            onBargeIn={onBargeIn}
            onAudioLevelChange={onAudioLevelChange}
            spokenTextToPlay={spokenTextToPlay}
            onSpeechEnd={onSpeechEnd}
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || disabled}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-medium transition-all transform active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            title="Dispatch Directive"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

