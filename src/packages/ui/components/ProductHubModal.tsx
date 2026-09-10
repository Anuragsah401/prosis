"use client";

import React from "react";
import {
  X,
  Layers,
  UtensilsCrossed,
  Users,
  FileText,
  BarChart3,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { ProductManifest } from "@prosis/sdk";

interface ProductHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductManifest[];
  activeWorkspace: string;
  onSelectWorkspace: (slug: string) => void;
  onSendDirective: (text: string) => void;
}

const getProductIcon = (slug: string) => {
  switch (slug) {
    case "seatbooking":
      return <UtensilsCrossed className="w-5 h-5 text-core-cyan" />;
    case "workforce":
      return <Users className="w-5 h-5 text-core-violet" />;
    case "menu":
      return <FileText className="w-5 h-5 text-core-emerald" />;
    case "analytics":
      return <BarChart3 className="w-5 h-5 text-core-cyan" />;
    case "marketing":
      return <Megaphone className="w-5 h-5 text-core-amber" />;
    default:
      return <Cpu className="w-5 h-5 text-white" />;
  }
};

export const ProductHubModal: React.FC<ProductHubModalProps> = ({
  isOpen,
  onClose,
  products,
  activeWorkspace,
  onSelectWorkspace,
  onSendDirective,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-obsidian-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl surface-glass-elevated border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <Layers className="w-5 h-5 text-core-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">My Products</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  {products.length} Connected
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Federated product registry with dynamic capability discovery & dedicated workspaces
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Close Product Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod) => {
              const isActive = activeWorkspace === prod.slug;

              return (
                <div
                  key={prod.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 relative ${
                    isActive
                      ? "surface-glass-elevated border-core-cyan/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                      : "surface-glass border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top line */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        {getProductIcon(prod.slug)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-sm">{prod.name}</h3>
                          <span className="text-[10px] font-mono text-gray-400">v{prod.version}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                          {prod.slug}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        prod.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      }`}
                    >
                      {prod.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Capabilities Badges */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                      Exposed Capabilities
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.capabilities.map((cap) => (
                        <span
                          key={cap.id}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-300"
                        >
                          {cap.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => {
                        onSelectWorkspace(prod.slug);
                        onClose();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                        isActive
                          ? "bg-core-cyan text-obsidian-950 font-bold"
                          : "bg-white/10 hover:bg-white/15 text-white"
                      }`}
                    >
                      <span>{isActive ? "Currently Active" : "Open Workspace"}</span>
                      {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        onSendDirective(`Open ${prod.name}`);
                        onClose();
                      }}
                      className="p-2 rounded-xl surface-glass hover:bg-white/10 text-gray-300 hover:text-white"
                      title={`Direct Prosis AI: Open ${prod.name}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-core-cyan" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-core-cyan" />
            <span>Products register via standard Prosis Product SDK</span>
          </div>
          <button
            onClick={() => {
              onSelectWorkspace("prosis");
              onClose();
            }}
            className="text-core-cyan hover:underline"
          >
            Return to Prosis Core
          </button>
        </div>
      </div>
    </div>
  );
};

