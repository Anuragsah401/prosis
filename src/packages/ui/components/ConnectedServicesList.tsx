"use client";

import React, { useState } from "react";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Language models & AI assistants",
    icon: "❇️",
    enabled: true,
  },
  {
    id: "seatbooking",
    name: "Seatbooking",
    description: "Enterprise hospitality & cover pacing",
    icon: "🍽️",
    enabled: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments, billing & subscriptions",
    icon: "💳",
    enabled: false,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Customer CRM & marketing automation",
    icon: "🎯",
    enabled: true,
  },
];

export const ConnectedServicesList: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <div className="card-neumorphic rounded-3xl p-6 space-y-4">
      <h3 className="text-base font-semibold text-charcoal-900 tracking-tight">
        Connected tools and services
      </h3>

      <div className="space-y-3 pt-1">
        {services.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.03] hover:border-black/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center text-sm">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-charcoal-900 leading-tight">
                  {item.name}
                </h4>
                <p className="text-[11px] text-charcoal-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            {/* iOS-Style Pill Toggle Switch */}
            <button
              onClick={() => toggleService(item.id)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                item.enabled ? "bg-charcoal-900" : "bg-black/15"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
                  item.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

