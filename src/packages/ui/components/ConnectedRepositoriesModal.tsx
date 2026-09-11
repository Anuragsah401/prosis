"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Code2,
  Database,
  Layers,
  Sparkles,
  Shield,
  Trash2,
  Cpu,
  FileCode,
  Check,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Github } from "./GithubIcon";

export interface ConnectedRepo {
  id: string;
  name: string;
  owner: string;
  repoUrl: string;
  branch: string;
  description: string;
  language: string;
  stars?: number;
  status: "indexing" | "ready" | "error";
  lastSyncedAt: string;
  filesIndexed: number;
  commitSha: string;
  blueprint: {
    overview: string;
    techStack: string[];
    keyCapabilities: string[];
    apiEndpoints: Array<{ method: string; path: string; description: string }>;
    domainModels: Array<{ name: string; fields: string[]; description: string }>;
    integrationPoints: string[];
    architectureNotes: string;
  };
}

interface ConnectedRepositoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepositoryIndexed?: (repo: ConnectedRepo) => void;
}

export const ConnectedRepositoriesModal: React.FC<ConnectedRepositoriesModalProps> = ({
  isOpen,
  onClose,
  onRepositoryIndexed,
}) => {
  const [repositories, setRepositories] = useState<ConnectedRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const [branchInput, setBranchInput] = useState("main");
  const [tokenInput, setTokenInput] = useState("");
  const [showTokenField, setShowTokenField] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [indexingStep, setIndexingStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRepoForBlueprint, setSelectedRepoForBlueprint] = useState<ConnectedRepo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch connected repositories on modal open
  useEffect(() => {
    if (!isOpen) return;
    loadRepositories();
  }, [isOpen]);

  const loadRepositories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/repositories");
      const data = await res.json();
      if (data.success && Array.isArray(data.repositories)) {
        setRepositories(data.repositories);
        if (data.repositories.length > 0 && !selectedRepoForBlueprint) {
          setSelectedRepoForBlueprint(data.repositories[0]);
        }
      }
    } catch (err) {
      console.warn("[ConnectedRepositoriesModal] Failed to load repositories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleConnect = async (urlToUse?: string) => {
    const targetUrl = urlToUse || repoUrlInput;
    if (!targetUrl.trim()) return;

    setIsConnecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIndexingStep(1); // Step 1: Fetching tree

    const stepInterval = setInterval(() => {
      setIndexingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await fetch("/api/v1/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: targetUrl.trim(),
          branch: branchInput.trim() || "main",
          accessToken: tokenInput.trim() || undefined,
        }),
      });

      clearInterval(stepInterval);
      setIndexingStep(5); // Step 5: Completed

      const data = await res.json();
      if (data.success && data.repository) {
        setSuccessMessage(`Repository ${data.repository.name} successfully indexed.`);
        setRepoUrlInput("");
        setTokenInput("");
        setShowTokenField(false);
        await loadRepositories();
        setSelectedRepoForBlueprint(data.repository);
        onRepositoryIndexed?.(data.repository);
      } else {
        setErrorMessage(data.error || "Failed to index repository.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || "Network error while connecting repository.");
    } finally {
      setTimeout(() => {
        setIsConnecting(false);
        setIndexingStep(0);
      }, 1000);
    }
  };

  const handleReSync = async (repoId: string) => {
    try {
      const res = await fetch(`/api/v1/repositories/${repoId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadRepositories();
      }
    } catch (err) {
      console.error("Failed to re-sync:", err);
    }
  };

  const handleDisconnect = async (repoId: string) => {
    if (!confirm("Are you sure you want to disconnect this repository from Prosis AI?")) return;
    try {
      const res = await fetch(`/api/v1/repositories/${repoId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRepositories((prev) => prev.filter((r) => r.id !== repoId));
        if (selectedRepoForBlueprint?.id === repoId) {
          setSelectedRepoForBlueprint(null);
        }
      }
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const handleTestSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/v1/repositories/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          repoId: selectedRepoForBlueprint?.id,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-5xl surface-hud rounded-3xl border border-white/10 shadow-[0_25px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh] relative bg-obsidian-975">
        {/* Top Specular Neon Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-core-cyan shadow-[0_0_12px_#00f0ff]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-obsidian-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-core-cyan shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold font-mono tracking-wide text-white">
                  CONNECTED REPOSITORIES // CODEBASE INTELLIGENCE
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-cyan/10 text-core-cyan border border-core-cyan/30 font-semibold">
                  LIVE RAG
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Index GitHub repositories into Prosis OS Knowledge Base &amp; Memory so your AI assistant understands everything about the codebase.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-200 max-h-[75vh]">
          {/* Section 1: Connect New Repository Omnibar */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-core-cyan/[0.04] via-obsidian-950 to-core-violet/[0.04] border border-white/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white">
                <GitBranch className="w-4 h-4 text-core-cyan" />
                <span>CONNECT GITHUB REPOSITORY LINK</span>
              </div>
              <button
                onClick={() => setShowTokenField(!showTokenField)}
                className="text-[11px] font-mono text-gray-400 hover:text-core-cyan transition-colors"
              >
                {showTokenField ? "- Hide Private Token" : "+ Add GitHub Token (Private Repos)"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 relative">
                <input
                  type="text"
                  placeholder="https://github.com/Anuragsah401/seatbooking"
                  value={repoUrlInput}
                  onChange={(e) => setRepoUrlInput(e.target.value)}
                  disabled={isConnecting}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-obsidian-900 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-core-cyan/60 shadow-inner"
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="branch (main)"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  disabled={isConnecting}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/15 bg-obsidian-900 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-core-cyan/60 text-center"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={() => handleConnect()}
                  disabled={isConnecting || !repoUrlInput.trim()}
                  className="w-full h-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-core-cyan to-core-emerald text-black font-mono font-semibold text-xs hover:opacity-90 transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Indexing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional GitHub Access Token input */}
            {showTokenField && (
              <div className="pt-2 animate-fade-in">
                <label className="text-[10px] font-mono text-gray-400 block mb-1">
                  GitHub Personal Access Token (for private repos or heavy rate limits)
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-white/10 bg-obsidian-900 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-core-cyan/50"
                />
              </div>
            )}

            {/* 1-Click Preset Links */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Quick Presets:</span>
              <button
                onClick={() => {
                  setRepoUrlInput("https://github.com/Anuragsah401/seatbooking");
                  handleConnect("https://github.com/Anuragsah401/seatbooking");
                }}
                disabled={isConnecting}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-core-cyan/15 text-gray-300 hover:text-core-cyan border border-white/10 hover:border-core-cyan/30 text-[11px] font-mono flex items-center gap-1.5 transition-all"
              >
                <span>🪑 Seatbooking (Anuragsah401)</span>
              </button>

              <button
                onClick={() => {
                  setRepoUrlInput("https://github.com/Anuragsah401/prosis");
                  handleConnect("https://github.com/Anuragsah401/prosis");
                }}
                disabled={isConnecting}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-core-violet/15 text-gray-300 hover:text-core-violet border border-white/10 hover:border-core-violet/30 text-[11px] font-mono flex items-center gap-1.5 transition-all"
              >
                <span>⚡ Prosis OS Repository</span>
              </button>
            </div>

            {/* Stepped Indexing Progress Terminal */}
            {isConnecting && (
              <div className="p-4 rounded-xl bg-black/60 border border-core-cyan/30 space-y-2 animate-fade-in font-mono text-xs">
                <div className="flex items-center justify-between text-core-cyan text-[11px]">
                  <span>// HOLOGRAPHIC INGESTION PIPELINE</span>
                  <span>Step {indexingStep}/5</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className={`flex items-center gap-2 ${indexingStep >= 1 ? "text-emerald-400" : "text-gray-500"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[1] Cloning &amp; fetching repository tree from GitHub...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${indexingStep >= 2 ? "text-emerald-400" : "text-gray-500"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[2] Analyzing architecture, tech stack &amp; dependency graphs...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${indexingStep >= 3 ? "text-emerald-400" : "text-gray-500"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[3] Parsing API routes, endpoints &amp; database schemas...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${indexingStep >= 4 ? "text-emerald-400" : "text-gray-500"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[4] Embedding semantic knowledge into Prosis OS Knowledge Base &amp; Memory...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${indexingStep >= 5 ? "text-core-cyan font-bold" : "text-gray-500"}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>[5] Repository ready! ProsisIt is now fully aware of the codebase.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error or Success alerts */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Section 2: Connected Repositories Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-300">
                Connected Repositories ({repositories.length})
              </label>
              <button
                onClick={loadRepositories}
                className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {repositories.map((repo) => {
                const isSelected = selectedRepoForBlueprint?.id === repo.id;
                return (
                  <div
                    key={repo.id}
                    onClick={() => setSelectedRepoForBlueprint(repo)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-core-cyan/10 border-core-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-core-cyan/20 to-core-violet/20 border border-core-cyan/30 flex items-center justify-center text-core-cyan shrink-0">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                            <span>{repo.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ACTIVE // READY
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-gray-400 truncate max-w-[220px]">
                            {repo.owner}/{repo.name} ({repo.branch})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReSync(repo.id);
                          }}
                          title="Re-sync"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(repo.id);
                          }}
                          title="Disconnect"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 font-sans mt-2 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>

                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-white/5 text-[10px] font-mono text-gray-500">
                      <span>Files: {repo.filesIndexed}</span>
                      <span>•</span>
                      <span>Endpoints: {repo.blueprint.apiEndpoints.length}</span>
                      <span>•</span>
                      <span>Models: {repo.blueprint.domainModels.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Selected Repository Architectural Blueprint Viewer */}
          {selectedRepoForBlueprint && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-core-cyan font-mono text-xs font-semibold">
                  <BookOpen className="w-4 h-4" />
                  <span>ARCHITECTURAL BLUEPRINT // {selectedRepoForBlueprint.name.toUpperCase()}</span>
                </div>
                <a
                  href={selectedRepoForBlueprint.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-gray-400 hover:text-core-cyan flex items-center gap-1"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Overview */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[10px] font-mono uppercase text-gray-400">System Purpose &amp; Overview</div>
                <p className="text-gray-200 text-xs font-sans leading-relaxed">
                  {selectedRepoForBlueprint.blueprint.overview}
                </p>
              </div>

              {/* Tech Stack Chips */}
              <div>
                <div className="text-[10px] font-mono uppercase text-gray-400 mb-1.5">Technology Stack</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRepoForBlueprint.blueprint.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-core-cyan"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Capabilities */}
              <div>
                <div className="text-[10px] font-mono uppercase text-gray-400 mb-1.5">Key Core Capabilities</div>
                <div className="space-y-1">
                  {selectedRepoForBlueprint.blueprint.keyCapabilities.map((cap) => (
                    <div key={cap} className="flex items-start gap-2 text-xs text-gray-300 font-sans">
                      <span className="text-core-emerald mt-0.5">•</span>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Endpoints Table */}
              {selectedRepoForBlueprint.blueprint.apiEndpoints.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                    Extracted API Endpoints ({selectedRepoForBlueprint.blueprint.apiEndpoints.length})
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {selectedRepoForBlueprint.blueprint.apiEndpoints.map((ep) => (
                      <div
                        key={`${ep.method}-${ep.path}`}
                        className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px] font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              ep.method === "GET"
                                ? "bg-core-cyan/20 text-core-cyan"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-white">{ep.path}</span>
                        </div>
                        <span className="text-gray-400 text-[10px] font-sans truncate max-w-[280px]">
                          {ep.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain Models */}
              {selectedRepoForBlueprint.blueprint.domainModels.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-gray-400 mb-1.5">
                    Domain Schemas &amp; Entities
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRepoForBlueprint.blueprint.domainModels.map((m) => (
                      <div key={m.name} className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                        <div className="text-white font-mono text-xs font-semibold flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-core-violet" />
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">
                          [{m.fields.join(", ")}]
                        </div>
                        <p className="text-[10px] text-gray-300 font-sans">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Codebase Query Sandbox */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-core-violet font-mono text-xs font-semibold">
              <Search className="w-4 h-4" />
              <span>TEST REPOSITORY KNOWLEDGE RETRIEVAL</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about endpoints, schemas, pacing, or deposit logic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestSearch()}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-obsidian-900 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-core-violet/50"
              />
              <button
                onClick={handleTestSearch}
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-core-violet/20 hover:bg-core-violet/30 text-core-violet border border-core-violet/40 font-mono text-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Query</span>
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <span className="text-[10px] font-mono uppercase text-gray-400">
                  Matches Found ({searchResults.length}):
                </span>
                <div className="space-y-1.5">
                  {searchResults.map((res, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="font-mono font-semibold text-xs text-core-cyan flex items-center justify-between">
                        <span>{res.title}</span>
                        <span className="text-[9px] text-gray-500 uppercase">{res.repoName}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 font-sans leading-relaxed">{res.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-obsidian-950/90 flex items-center justify-between">
          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-core-cyan" />
            <span>Indexed repositories are instantly queryable in voice &amp; chat omnibar</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-semibold text-black bg-gradient-to-r from-core-cyan to-core-emerald hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
