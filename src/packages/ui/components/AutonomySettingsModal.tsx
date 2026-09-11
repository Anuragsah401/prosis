"use client";

import React, { useState } from "react";
import {
  X,
  Sliders,
  ShieldAlert,
  Moon,
  Bell,
  Layers,
  Gauge,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  AutonomyLevel,
  AUTONOMY_LEVEL_LABELS,
  ProactiveSettings,
} from "@prosis/proactive";

interface AutonomySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProactiveSettings;
  onSaveSettings: (updated: Partial<ProactiveSettings>) => void;
}

export const AutonomySettingsModal: React.FC<AutonomySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(settings.autonomyLevel);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(settings.quietHours.enabled);
  const [quietStart, setQuietStart] = useState(settings.quietHours.start);
  const [quietEnd, setQuietEnd] = useState(settings.quietHours.end);
  const [importanceThreshold, setImportanceThreshold] = useState(settings.importanceThreshold);
  const [monitoredProducts, setMonitoredProducts] = useState<string[]>(settings.monitoredProducts);

  if (!isOpen) return null;

  const handleProductToggle = (slug: string) => {
    setMonitoredProducts((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const handleSave = () => {
    onSaveSettings({
      autonomyLevel,
      notificationsEnabled,
      quietHours: {
        enabled: quietHoursEnabled,
        start: quietStart,
        end: quietEnd,
        timezone: "UTC",
      },
      importanceThreshold,
      monitoredProducts,
    });
    onClose();
  };

  const allAvailableProducts = [
    { slug: "seatbooking", label: "Seatbooking (Reservations & Capacity)" },
    { slug: "workforce", label: "Prosis Workforce (Rosters & Compliance)" },
    { slug: "marketing", label: "Prosis Marketing (Campaigns & VIP Leads)" },
    { slug: "menu", label: "Prosis Menu (Food Costing & Margin)" },
    { slug: "analytics", label: "Prosis Analytics (Revenue Pacing)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-xl surface-hud rounded-3xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] relative bg-obsidian-975">
        {/* Top Specular Neon Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-core-cyan" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-obsidian-975/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-core-cyan/10 border border-core-cyan/30 text-core-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Proactive Intelligence &amp; Autonomy Control
              </h3>
              <p className="text-[11px] text-gray-400 font-sans">
                Configure proactive agency, sensitivity filters, and quiet hours.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto text-xs text-gray-200">
          {/* Autonomy Level Radio Group */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400 block mb-2">
              Autonomy Level (Agency Scope)
            </label>
            <div className="space-y-2">
              {([0, 1, 2, 3, 4] as AutonomyLevel[]).map((lvl) => {
                const info = AUTONOMY_LEVEL_LABELS[lvl];
                const isSelected = autonomyLevel === lvl;
                const isLevel4 = lvl === 4;

                return (
                  <div
                    key={lvl}
                    onClick={() => setAutonomyLevel(lvl)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-core-cyan/10 border-core-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-core-cyan bg-core-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                              : "border-white/30 bg-black/40"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <span className="font-semibold text-white">
                          {info.name}
                        </span>
                        {lvl === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-white/10 text-core-cyan border border-core-cyan/30">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      {isLevel4 && (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-400" /> Admin Opt-in
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 pl-6 leading-relaxed font-sans">
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-core-cyan" />
                <span className="font-semibold text-white">Quiet Hours</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-core-cyan" />
              </label>
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              Suppresses unprompted proactive audio and conversational alerts during quiet hours.
            </p>
            {quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                    Start (UTC)
                  </label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-white/10 bg-obsidian-975 font-mono text-xs text-white focus:outline-none focus:border-core-cyan/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                    End (UTC)
                  </label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-white/10 bg-obsidian-975 font-mono text-xs text-white focus:outline-none focus:border-core-cyan/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Monitored Products Checklist */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400 block mb-2">
              Monitored Products
            </label>
            <div className="space-y-1.5">
              {allAvailableProducts.map((p) => {
                const isChecked = monitoredProducts.includes(p.slug);
                return (
                  <div
                    key={p.slug}
                    onClick={() => handleProductToggle(p.slug)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-white/[0.04] border-core-cyan/30 text-white"
                        : "bg-white/[0.01] border-white/5 hover:border-white/10 text-gray-400"
                    }`}
                  >
                    <span className="font-medium text-xs">{p.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded accent-core-cyan cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Importance Threshold Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400">
                Importance Sensitivity Threshold
              </label>
              <span className="font-mono text-xs font-semibold text-core-cyan">
                {(importanceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              value={importanceThreshold}
              onChange={(e) => setImportanceThreshold(parseFloat(e.target.value))}
              className="w-full accent-core-cyan cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1">
              <span>More Frequent (30%)</span>
              <span>Balanced (60%)</span>
              <span>Critical Only (95%)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-obsidian-975/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-mono font-semibold text-black bg-gradient-to-r from-core-cyan to-core-emerald hover:opacity-90 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

