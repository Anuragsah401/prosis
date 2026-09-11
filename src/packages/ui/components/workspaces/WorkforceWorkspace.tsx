"use client";

import React, { useState } from "react";
import {
  Users,
  ArrowLeft,
  Search,
  Sparkles,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { WORKFORCE_EMPLOYEES, WORKFORCE_SCHEDULES } from "@/packages/products/workforce/tools";

interface WorkforceWorkspaceProps {
  onReturnToCore: () => void;
  onSendDirective: (text: string) => void;
}

export const WorkforceWorkspace: React.FC<WorkforceWorkspaceProps> = ({
  onReturnToCore,
  onSendDirective,
}) => {
  const [activeTab, setActiveTab] = useState<"roster" | "schedules" | "deficits">("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const filteredEmployees = WORKFORCE_EMPLOYEES.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === "all" || emp.department.toLowerCase() === departmentFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  const understaffedShifts = WORKFORCE_SCHEDULES.filter((s) => s.deficitCount < 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-gray-100 pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 surface-hud rounded-2xl border border-core-violet/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-core-violet/15 border border-core-violet/30 flex items-center justify-center text-core-violet shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide font-mono">WORKFORCE ROSTER MATRIX</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-core-violet/10 border border-core-violet/30 text-core-violet font-semibold">
                v1.1.0 ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans">
              Shift scheduling, labor optimization &amp; duty roster telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendDirective("Who is on duty right now across workforce?")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-hud hover:border-core-violet/50 text-xs font-mono text-gray-300 hover:text-white transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-core-violet" />
            <span>On-Duty Directive</span>
          </button>
          <button
            onClick={onReturnToCore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-core-violet to-indigo-600 text-xs font-mono font-bold text-white transition-all hover:brightness-110 shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Core</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2 text-xs font-mono rounded-t-lg transition-all ${
            activeTab === "roster"
              ? "text-core-violet border-b-2 border-core-violet font-bold bg-core-violet/[0.06] shadow-[0_0_12px_rgba(139,92,246,0.1)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Active Staff Roster ({WORKFORCE_EMPLOYEES.length})
        </button>
        <button
          onClick={() => setActiveTab("schedules")}
          className={`px-4 py-2 text-xs font-mono rounded-t-lg transition-all ${
            activeTab === "schedules"
              ? "text-core-violet border-b-2 border-core-violet font-bold bg-core-violet/[0.06] shadow-[0_0_12px_rgba(139,92,246,0.1)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Shift Rosters ({WORKFORCE_SCHEDULES.length})
        </button>
        <button
          onClick={() => setActiveTab("deficits")}
          className={`px-4 py-2 text-xs font-mono rounded-t-lg transition-all ${
            activeTab === "deficits"
              ? "text-rose-400 border-b-2 border-rose-400 font-bold bg-rose-500/[0.06] shadow-[0_0_12px_rgba(244,63,94,0.1)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Staffing Deficits ({understaffedShifts.length})
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-core-violet/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">TOTAL HEADCOUNT</div>
          <div className="text-2xl font-bold text-white font-mono">{WORKFORCE_EMPLOYEES.length} <span className="text-xs text-core-violet font-normal">active</span></div>
        </div>
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-emerald-500/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">CURRENTLY ON DUTY</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {WORKFORCE_EMPLOYEES.filter((e) => e.onDuty).length}
          </div>
        </div>
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-rose-500/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">UNDERSTAFFED VENUES</div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{understaffedShifts.length}</div>
        </div>
        <div className="p-4 surface-hud rounded-2xl space-y-1 border border-white/10 hover:border-core-cyan/30 transition-all">
          <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">AVG HOURLY RATE</div>
          <div className="text-2xl font-bold text-white font-mono">$33.00</div>
        </div>
      </div>

      {/* TAB CONTENT: ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by employee name or role..."
                className="w-full bg-obsidian-975 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-core-violet/50"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-obsidian-975 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none"
            >
              <option value="all" className="bg-obsidian-950">All Departments</option>
              <option value="kitchen" className="bg-obsidian-950">Kitchen</option>
              <option value="floor" className="bg-obsidian-950">Floor</option>
              <option value="front of house" className="bg-obsidian-950">Front of House</option>
              <option value="bar" className="bg-obsidian-950">Bar</option>
            </select>
          </div>

          <div className="surface-hud rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-975/90 text-gray-400 font-mono border-b border-white/10">
                <tr>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">ID</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Employee Name</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Role</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Department</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Duty Status</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-core-violet/[0.02] transition-colors group">
                    <td className="p-3.5 font-mono text-gray-500 group-hover:text-core-violet transition-colors">{emp.id}</td>
                    <td className="p-3.5 font-medium text-white">{emp.name}</td>
                    <td className="p-3.5 text-gray-300">{emp.role}</td>
                    <td className="p-3.5 text-gray-400 font-mono">{emp.department}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
                          emp.onDuty
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-gray-500/10 text-gray-400 border border-white/10"
                        }`}
                      >
                        {emp.onDuty ? "● ON DUTY" : "○ OFF DUTY"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-gray-300">${emp.hourlyRate}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCHEDULES */}
      {activeTab === "schedules" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WORKFORCE_SCHEDULES.map((sched) => (
            <div key={sched.id} className="p-4 surface-hud rounded-2xl border border-white/10 hover:border-core-violet/30 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">{sched.restaurantName}</h3>
                  <p className="text-xs text-gray-400 capitalize">{sched.shiftType} Shift · {sched.shiftDate}</p>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    sched.status === "optimal"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {sched.status.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-gray-300 pt-2 border-t border-white/10">
                <span>Scheduled: <strong className="text-white">{sched.scheduledHeadcount}</strong></span>
                <span>Required: <strong className="text-white">{sched.requiredHeadcount}</strong></span>
                <span className={sched.deficitCount < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-semibold"}>
                  Deficit: {sched.deficitCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: DEFICITS */}
      {activeTab === "deficits" && (
        <div className="space-y-4">
          <div className="p-5 surface-hud rounded-2xl border border-rose-500/40 bg-rose-500/[0.04] space-y-3 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>// CRITICAL STAFFING SHORTAGE DETECTED</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              2 key venues are operating with -6 staff deficits during peak dinner services. L&apos;Atelier Lumière has surging reservations (+18.4%) but only 6 scheduled staff (12 required).
            </p>
            <button
              onClick={() => onSendDirective("Find restaurants with increasing bookings but insufficient staff")}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono text-rose-200 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Run Cross-Product Correlation Analysis</span>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

