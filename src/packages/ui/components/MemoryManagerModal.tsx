"use client";

import React, { useState } from "react";
import {
  Brain,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  Power,
  Clock,
  Shield,
  Plus,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { MemoryRecord, MemoryCategory, MemoryImportance } from "@prosis/memory";

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryRecord[];
  onUpdateMemory: (id: string, updates: Partial<MemoryRecord>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onAddMemory: (record: {
    type: MemoryCategory;
    content: string;
    importance: MemoryImportance;
  }) => Promise<void>;
}

const CATEGORY_TABS: Array<{ id: "all" | MemoryCategory; label: string }> = [
  { id: "all", label: "All Memories" },
  { id: "user_preference", label: "User Preferences" },
  { id: "company_memory", label: "Company Memory" },
  { id: "task_memory", label: "Task Memory" },
  { id: "product_context", label: "Product Context" },
  { id: "conversation", label: "Conversation" },
];

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  isOpen,
  onClose,
  memories,
  onUpdateMemory,
  onDeleteMemory,
  onAddMemory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"all" | MemoryCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<MemoryCategory>("user_preference");
  const [newContent, setNewContent] = useState("");
  const [newImportance, setNewImportance] = useState<MemoryImportance>("medium");

  if (!isOpen) return null;

  // Filter memories
  const filtered = memories.filter((m) => {
    const matchesCategory = selectedCategory === "all" || m.type === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.key && m.key.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStartEdit = (m: MemoryRecord) => {
    setEditingId(m.id);
    setEditContent(m.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await onUpdateMemory(id, { content: editContent.trim() });
    setEditingId(null);
  };

  const handleToggleEnable = async (m: MemoryRecord) => {
    await onUpdateMemory(m.id, { enabled: !m.enabled });
  };

  const handleCreateNew = async () => {
    if (!newContent.trim()) return;
    await onAddMemory({
      type: newType,
      content: newContent.trim(),
      importance: newImportance,
    });
    setNewContent("");
    setIsAdding(false);
  };

  const getCategoryBadgeColor = (type: MemoryCategory) => {
    switch (type) {
      case "user_preference":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
      case "company_memory":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
      case "task_memory":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "product_context":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "conversation":
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl surface-hud border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden bg-obsidian-975">
        {/* Top Specular Neon Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-core-emerald" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-obsidian-975/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-core-cyan/10 border border-core-cyan/30 text-core-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide text-white flex items-center gap-2">
                <span>Prosis Memory Intelligence</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-white/5 border border-white/10 text-core-cyan">
                  ● {memories.length} records
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Inspect, correct, disable, or prune persistent multi-tier memories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium bg-core-cyan/15 hover:bg-core-cyan/25 text-core-cyan border border-core-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Memory Drawer */}
        {isAdding && (
          <div className="p-4 bg-white/[0.02] border-b border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
                Store New Memory Directive
              </span>
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
                  Category
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MemoryCategory)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="user_preference">User Preference</option>
                  <option value="company_memory">Company Memory</option>
                  <option value="task_memory">Task Memory</option>
                  <option value="product_context">Product Context</option>
                  <option value="conversation">Conversation</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
                  Importance
                </label>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value as MemoryImportance)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Keep executive summaries under 3 paragraphs with bulleted actions."
              className="w-full h-16 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCreateNew}
                disabled={!newContent.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-50 transition-all"
              >
                Store Memory Record
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search OmniBar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === tab.id
                    ? "bg-white/15 text-white shadow-sm border border-white/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Memory Records List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
              <Brain className="w-8 h-8 opacity-40 text-gray-600" />
              <p className="text-sm">No memories found in this category.</p>
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all ${
                  m.enabled
                    ? "bg-white/[0.02] border-white/10 hover:border-white/20"
                    : "bg-black/40 border-white/5 opacity-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Badges Bar */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${getCategoryBadgeColor(
                          m.type
                        )}`}
                      >
                        {m.type.toUpperCase().replace("_", " ")}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          m.importance === "critical"
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : m.importance === "high"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-gray-400 bg-gray-500/10 border-gray-500/20"
                        }`}
                      >
                        {m.importance.toUpperCase()}
                      </span>

                      <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {m.organizationId}
                      </span>

                      {m.expiresAt && (
                        <span className="text-[10px] font-mono text-amber-400/80 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          TTL Active
                        </span>
                      )}

                      {!m.enabled && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                          DISABLED
                        </span>
                      )}
                    </div>

                    {/* Content / Edit Box */}
                    {editingId === m.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-20 bg-black/60 border border-cyan-500/50 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none font-sans"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(m.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold"
                          >
                            <Check className="w-3 h-3" />
                            Save Correction
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-200 leading-relaxed font-sans select-text">
                        {m.content}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-3">
                      <span>Source: {m.source}</span>
                      <span>Confidence: {Math.round(m.confidence * 100)}%</span>
                      <span>Updated: {new Date(m.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions (Toggle, Edit, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleEnable(m)}
                      title={m.enabled ? "Disable Memory" : "Enable Memory"}
                      className={`p-1.5 rounded-lg border transition-all ${
                        m.enabled
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "text-gray-500 bg-gray-500/10 border-gray-500/20 hover:text-white"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleStartEdit(m)}
                      title="Correct Memory"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteMemory(m.id)}
                      title="Delete Memory"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-gray-500">
          <span>Tenant Isolation Active · Organization Scope: `org_acme_corp`</span>
          <span>Vector Search: Cosine Similarity 0.25+ threshold</span>
        </div>
      </div>
    </div>
  );
};

