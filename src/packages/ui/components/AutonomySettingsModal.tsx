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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06] bg-bone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-charcoal-900 text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">
                Proactive Intelligence & Autonomy Control
              </h3>
              <p className="text-[11px] text-charcoal-500">
                Configure proactive agency, sensitivity filters, and quiet hours.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 hover:bg-black/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto text-xs text-charcoal-800">
          {/* Autonomy Level Radio Group */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-charcoal-500 block mb-2">
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
                        ? "bg-indigo-50/70 border-indigo-500/40 shadow-sm"
                        : "bg-bone-50/50 border-black/[0.04] hover:border-black/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-charcoal-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-semibold text-charcoal-900">
                          {info.name}
                        </span>
                        {lvl === 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-bone-200 text-charcoal-700">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      {isLevel4 && (
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-300/40 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> Admin Opt-in
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-600 mt-1 pl-6 leading-relaxed">
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div className="p-4 rounded-2xl bg-bone-50/70 border border-black/[0.04] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-charcoal-700" />
                <span className="font-semibold text-charcoal-900">Quiet Hours</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-charcoal-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-charcoal-900" />
              </label>
            </div>
            <p className="text-[11px] text-charcoal-500">
              Suppresses unprompted proactive audio and conversational alerts during quiet hours.
            </p>
            {quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-mono uppercase text-charcoal-400 block mb-1">
                    Start (UTC)
                  </label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-black/10 bg-white font-mono text-xs text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-charcoal-400 block mb-1">
                    End (UTC)
                  </label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-black/10 bg-white font-mono text-xs text-charcoal-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Monitored Products Checklist */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-charcoal-500 block mb-2">
              Monitored Products
            </label>
            <div className="space-y-1.5">
              {allAvailableProducts.map((p) => {
                const isChecked = monitoredProducts.includes(p.slug);
                return (
                  <div
                    key={p.slug}
                    onClick={() => handleProductToggle(p.slug)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-bone-50/50 border border-black/[0.04] cursor-pointer hover:bg-bone-100/60 transition-all"
                  >
                    <span className="font-medium text-charcoal-800">{p.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-charcoal-900 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Importance Threshold Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-charcoal-500">
                Importance Sensitivity Threshold
              </label>
              <span className="font-mono text-[11px] font-semibold text-charcoal-900">
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
              className="w-full accent-charcoal-900 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-charcoal-400 font-mono mt-1">
              <span>More Frequent (30%)</span>
              <span>Balanced (60%)</span>
              <span>Critical Only (95%)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/[0.06] bg-bone-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-charcoal-600 hover:text-charcoal-900 bg-white hover:bg-bone-100 border border-black/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 shadow-sm transition-all active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

