"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  ArrowRight,
  User,
  KeyRound,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { AICoreVisual } from "../core/AICoreVisual";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthenticatedSession {
  user: AuthenticatedUser;
  organization: {
    id: string;
    name: string;
    plan: string;
  };
  allowedVenues: string[];
  sessionToken: string;
  expiresAt: string;
}

interface DemoUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  orgName: string;
  venueCount: number;
  description: string;
}

interface LoginPageProps {
  onLoginSuccess: (session: AuthenticatedSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  // Fetch available demo personas on mount
  useEffect(() => {
    fetch("/api/v1/auth/login")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.demoUsers) {
          setDemoUsers(json.data.demoUsers);
        }
      })
      .catch(() => {
        // Fallback default demo users if offline
        setDemoUsers([
          {
            userId: "user_director_01",
            name: "Operations Director",
            email: "director@acme-hospitality.com",
            role: "owner",
            orgName: "Acme Hospitality Group",
            venueCount: 5,
            description: "Universal Enterprise Access, 5 Venues, Level 1 Autonomy",
          },
          {
            userId: "user_manager_cantina",
            name: "Elena Rostova",
            email: "elena@cantinabella.it",
            role: "manager",
            orgName: "Acme Hospitality Group",
            venueCount: 1,
            description: "Venue Manager: Restricted to Cantina Bella operations",
          },
          {
            userId: "user_unauthorized_guest",
            name: "External Auditor",
            email: "auditor@external.com",
            role: "member",
            orgName: "Acme Hospitality Group",
            venueCount: 0,
            description: "Compliance Auditor: Read-only, zero dispatch permissions",
          },
          {
            userId: "user_foreign_tenant",
            name: "Foreign Operator",
            email: "foreign@rival-hospitality.com",
            role: "owner",
            orgName: "Rival Hospitality Ltd",
            venueCount: 1,
            description: "Cross-Tenant Isolation: Separate enterprise entity",
          },
        ]);
      });
  }, []);

  const handleLogin = async (idToUse?: string) => {
    const targetId = idToUse || identifier;
    if (!targetId.trim()) {
      setErrorMsg("Please provide an email or operator ID.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetId.trim(), password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Invalid credentials or unauthorized account.");
        return;
      }

      onLoginSuccess(json.data.session);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication gateway connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (user: DemoUser) => {
    setIdentifier(user.email);
    setPassword("••••••••");
    handleLogin(user.email);
  };

  return (
    <div className="relative min-h-screen w-full bg-obsidian-975 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none cyber-grid-bg">
      {/* Dynamic Background Aurora Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-core-cyan/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] bg-core-violet/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Login Shell */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center space-y-6 animate-fade-in my-auto">
        {/* Holographic Living AI Core Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative flex items-center justify-center p-2">
            <AICoreVisual
              state={isLoading ? "thinking" : "idle"}
              audioLevel={isLoading ? 0.6 : 0.15}
              size={90}
            />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full surface-hud border border-core-cyan/30 text-[10px] font-mono text-core-cyan tracking-widest uppercase shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Cpu className="w-3 h-3 text-core-cyan animate-pulse" />
              <span>SYS.GATEWAY // ZERO-TRUST AUTHENTICATION</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>PROSIS</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-core-cyan to-core-violet">
                EXECUTIVE OS
              </span>
            </h1>

            <p className="text-xs text-gray-400 max-w-md font-sans">
              Authenticate operator credentials to establish verified RBAC session and initiate neural command layer.
            </p>
          </div>
        </div>

        {/* Dual-Column Container: Form & Demo Personas */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Direct Credential Entry (5 cols) */}
          <div className="lg:col-span-5 surface-hud rounded-3xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between space-y-5 bg-obsidian-975/90 backdrop-blur-xl">
            {/* Top Specular Neon Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-core-cyan via-core-violet to-core-cyan" />

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono font-semibold text-white tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-core-cyan" />
                  <span>OPERATOR LOGIN</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  v2.4
                </span>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2 animate-fade-in shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center justify-between">
                    <span>Operator ID or Email</span>
                    <span className="text-core-cyan text-[9px]">// REQUIRED</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. director@acme-hospitality.com"
                      disabled={isLoading}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-core-cyan/60 focus:ring-1 focus:ring-core-cyan/40 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center justify-between">
                    <span>Security Passkey</span>
                    <span className="text-gray-500 text-[9px]">Demo: any</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter passkey..."
                      disabled={isLoading}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-core-cyan/60 focus:ring-1 focus:ring-core-cyan/40 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-mono font-semibold text-black bg-gradient-to-r from-core-cyan via-core-emerald to-core-cyan hover:opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  <span>{isLoading ? "AUTHENTICATING..." : "INITIALIZE CONSOLE"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Micro security pill */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Zero-Trust Protocol</span>
              </span>
              <span>256-bit Token</span>
            </div>
          </div>

          {/* Right Column: 1-Click Executive Personas (7 cols) */}
          <div className="lg:col-span-7 surface-hud rounded-3xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between space-y-4 bg-obsidian-975/90 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs font-mono font-semibold text-white tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-core-violet" />
                    <span>INSTANT DEMO PERSONAS</span>
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Select a verified enterprise identity to test role-based authority &amp; tenant isolation.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-violet/15 text-core-violet border border-core-violet/30 font-medium">
                  1-CLICK
                </span>
              </div>

              {/* Persona Cards Grid */}
              <div className="space-y-2.5">
                {demoUsers.map((user) => {
                  const isOwner = user.role === "owner";
                  const isManager = user.role === "manager";
                  const isAuditor = user.role === "member";

                  return (
                    <button
                      key={user.userId}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelectDemo(user)}
                      className="w-full text-left p-3.5 rounded-2xl surface-hud border border-white/10 hover:border-core-cyan/50 hover:bg-white/[0.04] transition-all group active:scale-[0.99] flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 border ${
                            isOwner
                              ? "bg-core-cyan/15 text-core-cyan border-core-cyan/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                              : isManager
                              ? "bg-core-violet/15 text-core-violet border-core-violet/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {user.name[0]}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-white group-hover:text-core-cyan transition-colors">
                              {user.name}
                            </span>
                            <span
                              className={`text-[9.5px] font-mono px-2 py-0.2 rounded-full border uppercase ${
                                isOwner
                                  ? "bg-core-cyan/10 text-core-cyan border-core-cyan/30"
                                  : isManager
                                  ? "bg-core-violet/10 text-core-violet border-core-violet/30"
                                  : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              }`}
                            >
                              {user.role}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              {user.orgName}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 mt-1 font-sans leading-relaxed">
                            {user.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-gray-600 group-hover:text-core-cyan transition-colors">
                        <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                          Select
                        </span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono text-gray-400 flex items-center justify-between">
              <span>Zero-Trust: Server validates identity; client claims are discarded</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-core-emerald" />
            </div>
          </div>
        </div>

        {/* Global Security Telemetry Footer */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[10px] font-mono text-gray-500 pt-2 border-t border-white/5 w-full">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-core-emerald animate-ping" />
            <span className="text-gray-400">SERVER-SIDE RBAC ENFORCED</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-core-cyan" />
            <span className="text-gray-400">TENANT ISOLATION ACTIVE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-core-violet" />
            <span className="text-gray-400">REAL-TIME MULTIMODAL READY</span>
          </span>
        </div>
      </div>
    </div>
  );
};

