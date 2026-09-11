"use client";

import React, { useState } from "react";
import {
  FileText,
  ArrowLeft,
  Search,
  Sparkles,
  DollarSign,
  PieChart,
  Tag,
} from "lucide-react";
import { MENU_ITEMS } from "@/packages/products/menu/tools";

interface MenuWorkspaceProps {
  onReturnToCore: () => void;
  onSendDirective: (text: string) => void;
}

export const MenuWorkspace: React.FC<MenuWorkspaceProps> = ({
  onReturnToCore,
  onSendDirective,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "margins">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const avgMargin = +(
    MENU_ITEMS.reduce((acc, i) => acc + i.grossMarginPercent, 0) / MENU_ITEMS.length
  ).toFixed(1);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-gray-100 pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 surface-hud rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-core-emerald/10 border border-core-emerald/30 flex items-center justify-center text-core-emerald shadow-[0_0_20px_rgba(52,211,153,0.25)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-wide">Prosis Menu Workspace</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-emerald/15 border border-core-emerald/30 text-core-emerald font-medium tracking-wider">
                ● v1.0.0 ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Recipe engineering, ingredient cost telemetry &amp; gross margin optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendDirective("Analyze food cost and item profit margins in Prosis Menu")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-hud hover:border-core-emerald/40 text-xs font-mono text-gray-300 hover:text-white transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-core-emerald" />
            <span>Costing Analysis</span>
          </button>
          <button
            onClick={onReturnToCore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all active:scale-95 border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Prosis Core</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all ${
            activeTab === "catalog"
              ? "text-core-emerald border-b-2 border-core-emerald font-medium bg-core-emerald/[0.06] shadow-[0_0_12px_rgba(52,211,153,0.15)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Menu Catalog ({MENU_ITEMS.length})
        </button>
        <button
          onClick={() => setActiveTab("margins")}
          className={`px-4 py-2 text-xs font-mono rounded-t-xl transition-all ${
            activeTab === "margins"
              ? "text-core-emerald border-b-2 border-core-emerald font-medium bg-core-emerald/[0.06] shadow-[0_0_12px_rgba(52,211,153,0.15)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Margin Intelligence
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-core-emerald/30 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">ACTIVE MENU ITEMS</div>
          <div className="text-xl font-bold text-white font-mono">{MENU_ITEMS.length} <span className="text-xs text-core-emerald font-normal">dishes</span></div>
        </div>
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-core-emerald/30 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">AVG GROSS MARGIN</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{avgMargin}%</div>
        </div>
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-core-emerald/30 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">HIGHEST MARGIN</div>
          <div className="text-xl font-bold text-core-cyan font-mono">85.9% <span className="text-xs text-gray-400 font-normal">Cocktail</span></div>
        </div>
        <div className="p-4 surface-hud rounded-xl space-y-1 border border-white/10 hover:border-core-emerald/30 transition-all">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">AVG FOOD COST</div>
          <div className="text-xl font-bold text-white font-mono">{(100 - avgMargin).toFixed(1)}%</div>
        </div>
      </div>

      {/* TAB: CATALOG */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish or beverage name..."
                className="w-full bg-obsidian-975 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-core-emerald/50"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-obsidian-975 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-core-emerald/50"
            >
              <option value="all" className="bg-obsidian-950">All Categories</option>
              <option value="entree" className="bg-obsidian-950">Entrees</option>
              <option value="appetizer" className="bg-obsidian-950">Appetizers</option>
              <option value="dessert" className="bg-obsidian-950">Desserts</option>
              <option value="cocktail" className="bg-obsidian-950">Cocktails</option>
            </select>
          </div>

          <div className="surface-hud rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-975/90 text-gray-400 font-mono border-b border-white/10">
                <tr>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">ID</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Item Name</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Category</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Price</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Food Cost</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Margin %</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Allergens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-core-emerald/[0.03] transition-colors group">
                    <td className="p-3.5 font-mono text-gray-500 group-hover:text-core-emerald transition-colors">{item.id}</td>
                    <td className="p-3.5 font-medium text-white">{item.name}</td>
                    <td className="p-3.5 capitalize text-gray-300">{item.category}</td>
                    <td className="p-3.5 font-mono font-medium text-white">${item.priceUsd}</td>
                    <td className="p-3.5 font-mono text-gray-400">${item.foodCostUsd}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-emerald-400 font-semibold">{item.grossMarginPercent}%</span>
                    </td>
                    <td className="p-3.5">
                      {item.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.map((alg) => (
                            <span key={alg} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {alg}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-600">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MARGINS */}
      {activeTab === "margins" && (
        <div className="p-6 surface-hud rounded-2xl border border-white/10 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-core-emerald font-mono text-xs">
            <PieChart className="w-4 h-4" />
            <span>// MENU PROFITABILITY TELEMETRY MATRIX</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            The culinary portfolio averages 77.5% gross margin. High margin leaders include <strong className="text-white">Yuzu Shiso Highball (85.9%)</strong> and <strong className="text-white">Smoked Dark Chocolate Fondant (81.1%)</strong>.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onSendDirective("What are the highest margin items on the menu?")}
              className="px-3.5 py-2 rounded-xl bg-core-emerald/15 hover:bg-core-emerald/25 border border-core-emerald/30 text-xs font-mono text-emerald-200 transition-all flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-core-emerald" />
              <span>Analyze High Margin Pairings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

