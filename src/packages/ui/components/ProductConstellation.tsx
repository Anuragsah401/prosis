"use client";

import React from "react";
import {
  Layers,
  UtensilsCrossed,
  Users,
  FileText,
  BarChart3,
  Megaphone,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  ChevronRight,
} from "lucide-react";

interface ProductConstellationProps {
  isOpen: boolean;
  onClose: () => void;
  activeProductId: string;
  onSelectProduct: (productId: string) => void;
}

interface ConstellationProduct {
  id: string;
  name: string;
  slug: string;
  version: string;
  status: "active" | "planned";
  category: string;
  description: string;
  capabilities: string[];
  icon: React.ReactNode;
}

const CONSTELLATION_PRODUCTS: ConstellationProduct[] = [
  {
    id: "prod_seatbooking_01",
    name: "Seatbooking",
    slug: "seatbooking",
    version: "2.4.0",
    status: "active",
    category: "Hospitality & Reservations",
    description: "Enterprise table bookings, guest profiles, cover pacing, and capacity telemetry.",
    capabilities: ["Reservations", "Restaurants", "Guest VIP CRM", "Pacing Analytics"],
    icon: <UtensilsCrossed className="w-5 h-5 text-core-cyan" />,
  },
  {
    id: "prod_workforce_02",
    name: "Prosis Workforce",
    slug: "workforce",
    version: "1.0-preview",
    status: "planned",
    category: "Operations & Labor",
    description: "Intelligent shift planning, labor demand forecasting, and team communications.",
    capabilities: ["Shift Scheduling", "Timecards", "Overtime Forecasts"],
    icon: <Users className="w-5 h-5 text-core-violet" />,
  },
  {
    id: "prod_menu_03",
    name: "Prosis Menu",
    slug: "menu",
    version: "1.0-preview",
    status: "planned",
    category: "Culinary & Costing",
    description: "Dynamic menu engineering, ingredient cost telemetry, and dietary pairing models.",
    capabilities: ["Item Pacing", "Ingredient Costing", "Allergen Matrix"],
    icon: <FileText className="w-5 h-5 text-core-emerald" />,
  },
  {
    id: "prod_analytics_04",
    name: "Prosis Analytics",
    slug: "analytics",
    version: "2.0-preview",
    status: "planned",
    category: "Business Intelligence",
    description: "Cross-property revenue pacing, customer lifetime value, and booking trajectories.",
    capabilities: ["Revenue Pacing", "Forecasting", "Executive Dashboards"],
    icon: <BarChart3 className="w-5 h-5 text-core-cyan" />,
  },
  {
    id: "prod_marketing_05",
    name: "Prosis Marketing",
    slug: "marketing",
    version: "1.0-preview",
    status: "planned",
    category: "Guest Growth",
    description: "Automated re-engagement campaigns and VIP dining incentives.",
    capabilities: ["Outbound Dispatch", "Campaign Performance", "VIP Segments"],
    icon: <Megaphone className="w-5 h-5 text-core-amber" />,
  },
];

export const ProductConstellation: React.FC<ProductConstellationProps> = ({
  isOpen,
  onClose,
  activeProductId,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="constellation-title"
    >
      <div className="w-full max-w-2xl surface-glass-elevated rounded-3xl p-6 sm:p-8 space-y-6 relative border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-core-cyan" />
            </div>
            <div>
              <h2
                id="constellation-title"
                className="text-lg font-semibold tracking-tight text-white"
              >
                Product Constellation
              </h2>
              <p className="text-xs font-mono text-gray-400">
                Connected business applications orchestrated by Prosis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close constellation switcher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Constellation Grid */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {CONSTELLATION_PRODUCTS.map((prod) => {
            const isSelected = activeProductId === prod.id;
            const isActive = prod.status === "active";

            return (
              <div
                key={prod.id}
                onClick={() => {
                  if (isActive) {
                    onSelectProduct(prod.id);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/[0.06] border-core-cyan/50 shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                    : isActive
                    ? "bg-white/[0.02] hover:bg-white/[0.04] border-white/10 hover:border-white/20"
                    : "bg-white/[0.01] border-white/5 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {prod.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {prod.name}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400">
                          v{prod.version}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {prod.description}
                      </p>

                      {/* Capabilities pill tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {prod.capabilities.map((cap, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-gray-300"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-core-emerald/10 text-core-emerald border border-core-emerald/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Roadmap
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 text-[11px] font-mono text-gray-500 border-t border-white/5">
          Prosis acts as the unified intelligence layer across all registered applications.
        </div>
      </div>
    </div>
  );
};

