"use client";

import React, { useState } from "react";
import { ChevronDown, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  name: string;
  steps: string;
  time: string;
  status: "success" | "running" | "failed" | "paused";
}

const DEFAULT_ITEMS: ActivityItem[] = [
  {
    id: "act-1",
    name: "Lead Qualification Agent",
    steps: "5 steps · OpenAI + HubSpot",
    time: "08:42 PM",
    status: "success",
  },
  {
    id: "act-2",
    name: "Seatbooking Revenue Pacing Sync",
    steps: "4 steps · 5 Venues Analyzed",
    time: "08:30 PM",
    status: "success",
  },
  {
    id: "act-3",
    name: "Customer Outreach Campaign",
    steps: "Staged for Human Approval",
    time: "07:15 PM",
    status: "paused",
  },
];

export const ActivityFeedList: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "success" | "failed" | "paused">("all");

  const filtered = DEFAULT_ITEMS.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <div className="card-neumorphic rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-charcoal-900 tracking-tight">
          Live Activity Feed
        </h3>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-full bg-black/[0.04] border border-black/[0.03] text-xs font-medium">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full transition-all ${
              filter === "all"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-3 py-1 rounded-full transition-all ${
              filter === "success"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-3 py-1 rounded-full transition-all ${
              filter === "failed"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Failed
          </button>
          <button
            onClick={() => setFilter("paused")}
            className={`px-3 py-1 rounded-full transition-all ${
              filter === "paused"
                ? "bg-charcoal-900 text-white shadow-sm"
                : "text-charcoal-600 hover:text-charcoal-900"
            }`}
          >
            Paused
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] flex items-center justify-between hover:border-black/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center font-bold text-xs text-charcoal-900">
                B
              </div>
              <div>
                <h4 className="text-xs font-semibold text-charcoal-900 leading-tight">
                  {item.name}
                </h4>
                <p className="text-[11px] text-charcoal-400 mt-0.5">{item.steps}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-charcoal-400">
                {item.time}
              </span>

              {item.status === "success" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Success
                </span>
              )}
              {item.status === "paused" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Staged
                </span>
              )}

              <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-charcoal-700 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

