"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { SeatbookingService } from "@/packages/products/seatbooking/data";

interface SeatbookingWorkspaceProps {
  onReturnToCore: () => void;
  onSendDirective: (text: string) => void;
}

export const SeatbookingWorkspace: React.FC<SeatbookingWorkspaceProps> = ({
  onReturnToCore,
  onSendDirective,
}) => {
  const [activeTab, setActiveTab] = useState<"reservations" | "restaurants" | "analytics">("reservations");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");

  const restaurants = SeatbookingService.getAllRestaurants("org_acme_corp");
  const reservations = SeatbookingService.getReservations("org_acme_corp");

  const filteredReservations = reservations.filter((r) => {
    const matchesQuery =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = selectedProperty === "all" || r.restaurantId === selectedProperty;
    return matchesQuery && matchesProperty;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-gray-100 pb-16">
      {/* Workspace Header & Product Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 surface-hud rounded-2xl border border-core-cyan/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-core-cyan/10 border border-core-cyan/30 flex items-center justify-center text-core-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide font-mono">SEATBOOKING WORKSPACE</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/10 border border-core-cyan/30 text-core-cyan font-semibold">
                v2.4.0 ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans">
              Hospitality reservation engine · 5 linked dining venues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendDirective("Show today's reservations for Cantina Bella")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-hud hover:border-core-cyan/50 text-xs font-mono text-gray-300 hover:text-white transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-core-cyan" />
            <span>AI Directive</span>
          </button>
          <button
            onClick={onReturnToCore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-core-cyan to-blue-500 text-xs font-mono font-bold text-obsidian-950 transition-all hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.25)] active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Prosis Core</span>
          </button>
        </div>
      </div>

      {/* Product Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-2 text-xs font-mono rounded-t-lg transition-all ${
            activeTab === "reservations"
              ? "text-core-cyan border-b-2 border-core-cyan font-bold bg-core-cyan/[0.05] shadow-[0_0_12px_rgba(0,240,255,0.1)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Live Reservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab("restaurants")}
          className={`px-4 py-2 text-xs font-mono rounded-t-lg transition-all ${
            activeTab === "restaurants"
              ? "text-core-cyan border-b-2 border-core-cyan font-bold bg-core-cyan/[0.05] shadow-[0_0_12px_rgba(0,240,255,0.1)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Venues & Capacity ({restaurants.length})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 text-xs font-mono rounded-t-lg transition-all ${
            activeTab === "analytics"
              ? "text-core-cyan border-b-2 border-core-cyan font-bold bg-core-cyan/[0.05] shadow-[0_0_12px_rgba(0,240,255,0.1)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Pacing & Trends
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-core-cyan/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">TODAY&apos;S COVERS</div>
          <div className="text-2xl font-bold text-white font-mono">395 <span className="text-xs text-core-cyan font-normal">guests</span></div>
        </div>
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-emerald-500/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">PORTFOLIO OCCUPANCY</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">88.4%</div>
        </div>
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-core-cyan/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">PACED REVENUE</div>
          <div className="text-2xl font-bold text-white font-mono">$14,850</div>
        </div>
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-amber-400/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">AVG CANCELLATION</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">11.8%</div>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by guest name, venue, or reservation ID..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-core-cyan/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none"
              >
                <option value="all" className="bg-obsidian-950">All Properties</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id} className="bg-obsidian-950">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="surface-hud rounded-2xl border border-white/10 hover:border-core-cyan/30 transition-all overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-975/90 text-gray-400 font-mono border-b border-white/10">
                <tr>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">ID</th>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">Guest</th>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">Restaurant</th>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">Party</th>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">Time</th>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">Table</th>
                  <th className="p-3.5 tracking-wider uppercase text-[10px]">Status</th>
                  <th className="p-3.5 text-right tracking-wider uppercase text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-core-cyan/[0.02] transition-colors group">
                    <td className="p-3.5 font-mono text-gray-500 group-hover:text-core-cyan transition-colors">{res.id}</td>
                    <td className="p-3.5 font-medium text-white">
                      {res.customerName}
                      {res.notes && <p className="text-[10px] text-gray-400 font-normal">{res.notes}</p>}
                    </td>
                    <td className="p-3.5 text-gray-300">{res.restaurantName}</td>
                    <td className="p-3.5 font-mono text-gray-300">{res.partySize} guests</td>
                    <td className="p-3.5 font-mono text-core-cyan">{res.timeSlot}</td>
                    <td className="p-3.5 font-mono text-gray-400">T-{res.partySize * 2}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
                          res.status === "confirmed"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : res.status === "seated"
                            ? "bg-core-cyan/15 text-core-cyan border border-core-cyan/30"
                            : "bg-gray-500/10 text-gray-400 border border-white/10"
                        }`}
                      >
                        {res.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onSendDirective(`Cancel reservation ${res.id} for ${res.customerName}`)}
                        className="text-[11px] font-mono text-gray-400 hover:text-amber-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENUES TAB */}
      {activeTab === "restaurants" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((rest) => (
            <div key={rest.id} className="p-4 surface-glass rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">{rest.name}</h3>
                  <p className="text-xs text-gray-400">{rest.cuisine} · {rest.location}</p>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    rest.weeklyTrendPercent >= 0
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {rest.weeklyTrendPercent >= 0 ? `+${rest.weeklyTrendPercent}%` : `${rest.weeklyTrendPercent}%`}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>Capacity Booked</span>
                  <span className="text-white font-medium">{rest.capacityBookedPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      rest.capacityBookedPercent > 85
                        ? "bg-core-cyan"
                        : rest.capacityBookedPercent > 65
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                    style={{ width: `${rest.capacityBookedPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-2 border-t border-white/[0.06]">
                <span>Today: {rest.todayBookings} covers</span>
                <span>Max: {rest.totalTables * 4} seats ({rest.totalTables} tables)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="p-6 surface-glass rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white">Seatbooking Pacing Summary</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            All 5 venue nodes report synchronised reservation status. Cantina Bella (-22.5%) and Verdant Bistro (-18.2%) show pacing decline, while L'Atelier Lumière (+18.4%) and Aura Rooftop Lounge (+12.1%) report high dining demand.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onSendDirective("Show me the restaurants with declining bookings")}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all"
            >
              Analyze Declining Venues
            </button>
            <button
              onClick={() => onSendDirective("Find restaurants with increasing bookings but insufficient staff")}
              className="px-3 py-1.5 rounded-xl bg-core-cyan/20 border border-core-cyan/30 hover:bg-core-cyan/30 text-xs font-mono text-core-cyan transition-all"
            >
              Cross-Check Labor Shortage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
