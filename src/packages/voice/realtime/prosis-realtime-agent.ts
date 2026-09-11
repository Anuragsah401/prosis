/**
 * @prosis/voice/realtime - Prosis Realtime Agent
 * Realtime voice agent definition built on the official OpenAI Agents SDK (@openai/agents/realtime).
 * Exposes safe read-only operational and repository intelligence tools through the secure server boundary.
 * Calibrated with executive demeanor: calm, authoritative, concise, zero conversational hype.
 */

import { RealtimeAgent, tool } from "@openai/agents/realtime";
import { z } from "zod";

export interface CreateProsisAgentOptions {
  name?: string;
  voice?: string;
  sessionId?: string;
  instructions?: string;
  getEpoch?: () => number;
  onToolCall?: (toolName: string, args: Record<string, any>, requestId?: string) => void;
}

/**
 * Creates the primary Prosis RealtimeAgent configured with executive instructions
 * and safe read-only operational + repository intelligence tools.
 */
export function createProsisRealtimeAgent(options: CreateProsisAgentOptions = {}) {
  const { name = "Prosis", voice = "alloy", sessionId = "sess_realtime", instructions: customInstructions, getEpoch, onToolCall } = options;

  // 1. Safe Read-Only Tool: Real-time Venue Analytics & Pacing
  const getVenueAnalytics = tool({
    name: "getVenueAnalytics",
    description: "Retrieve real-time booking trajectories, cover pacing, capacity, and revenue deltas across properties.",
    parameters: z.object({
      timeframe: z.string().optional().describe("Analysis timeframe, e.g. 'current_week', 'last_week', or 'month'"),
      venueId: z.string().optional().describe("Optional specific venue ID to inspect (e.g. 'cantina_bella', 'verdant_bistro')"),
    }),
    execute: async ({ timeframe, venueId }) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const currentEpoch = getEpoch ? getEpoch() : 0;
      onToolCall?.("getVenueAnalytics", { timeframe, venueId }, requestId);
      try {
        const res = await fetch("/api/v1/realtime/tool-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
            "x-session-id": sessionId,
            "x-prosis-session": "sess_live_director_token",
          },
          body: JSON.stringify({
            requestId,
            sessionId,
            toolName: "getVenueAnalytics",
            interruptionEpoch: currentEpoch,
            arguments: { timeframe: timeframe || "current_week", venueId },
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          const errMsg = json.error?.message || json.error || "Failed to retrieve venue analytics from server boundary.";
          return JSON.stringify({ error: errMsg, code: json.error?.code || "TOOL_EXECUTION_FAILED" });
        }

        return JSON.stringify(json.data);
      } catch (err: any) {
        return JSON.stringify({ error: err.message || "Failed to communicate with analytics server." });
      }
    },
  });

  // 2. Repository Knowledge Query Tool
  const queryRepositoryKnowledge = tool({
    name: "repo_queryRepositoryKnowledge",
    description:
      "Query code, architecture blueprints, endpoints, database schemas, and algorithms across connected GitHub repositories (e.g. Seatbooking). Call this whenever the user asks about repository architecture, API endpoints, or database models.",
    parameters: z.object({
      query: z.string().describe("The search query or concept, e.g. 'reservations endpoint', 'pacing algorithm', 'deposit escrow', 'database models'"),
      repoId: z.string().optional().describe("Optional repository identifier (e.g. 'repo_seatbooking_core')"),
    }),
    execute: async ({ query, repoId }) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const currentEpoch = getEpoch ? getEpoch() : 0;
      onToolCall?.("repo_queryRepositoryKnowledge", { query, repoId }, requestId);
      try {
        const res = await fetch("/api/v1/realtime/tool-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
            "x-session-id": sessionId,
            "x-prosis-session": "sess_live_director_token",
          },
          body: JSON.stringify({
            requestId,
            sessionId,
            toolName: "repo_queryRepositoryKnowledge",
            interruptionEpoch: currentEpoch,
            arguments: { query, repoId },
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          const errMsg = json.error?.message || json.error || "Failed to retrieve repository knowledge.";
          return JSON.stringify({ error: errMsg, code: json.error?.code || "TOOL_EXECUTION_FAILED" });
        }

        return JSON.stringify(json.data);
      } catch (err: any) {
        return JSON.stringify({ error: err.message || "Failed to query repository knowledge." });
      }
    },
  });

  // 3. List Connected Repositories Tool
  const listConnectedRepositories = tool({
    name: "repo_listConnectedRepositories",
    description: "Lists all connected GitHub repositories, their tech stack, key capabilities, endpoints count, and indexing status.",
    parameters: z.object({}),
    execute: async () => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const currentEpoch = getEpoch ? getEpoch() : 0;
      onToolCall?.("repo_listConnectedRepositories", {}, requestId);
      try {
        const res = await fetch("/api/v1/realtime/tool-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
            "x-session-id": sessionId,
            "x-prosis-session": "sess_live_director_token",
          },
          body: JSON.stringify({
            requestId,
            sessionId,
            toolName: "repo_listConnectedRepositories",
            interruptionEpoch: currentEpoch,
            arguments: {},
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          const errMsg = json.error?.message || json.error || "Failed to list connected repositories.";
          return JSON.stringify({ error: errMsg, code: json.error?.code || "TOOL_EXECUTION_FAILED" });
        }

        return JSON.stringify(json.data);
      } catch (err: any) {
        return JSON.stringify({ error: err.message || "Failed to list repositories." });
      }
    },
  });

  // 4. Inspect Repository File or Module Tool
  const inspectFileOrModule = tool({
    name: "repo_inspectFileOrModule",
    description: "Inspects a specific file or module path within a connected GitHub repository to view its summary and role in the architecture.",
    parameters: z.object({
      repoId: z.string().describe("Repository ID, e.g. 'repo_seatbooking_core'"),
      filePath: z.string().describe("Relative file path inside the repository, e.g. 'src/server/routes/reservations.ts'"),
    }),
    execute: async ({ repoId, filePath }) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const currentEpoch = getEpoch ? getEpoch() : 0;
      onToolCall?.("repo_inspectFileOrModule", { repoId, filePath }, requestId);
      try {
        const res = await fetch("/api/v1/realtime/tool-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
            "x-session-id": sessionId,
            "x-prosis-session": "sess_live_director_token",
          },
          body: JSON.stringify({
            requestId,
            sessionId,
            toolName: "repo_inspectFileOrModule",
            interruptionEpoch: currentEpoch,
            arguments: { repoId, filePath },
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          const errMsg = json.error?.message || json.error || "Failed to inspect repository file.";
          return JSON.stringify({ error: errMsg, code: json.error?.code || "TOOL_EXECUTION_FAILED" });
        }

        return JSON.stringify(json.data);
      } catch (err: any) {
        return JSON.stringify({ error: err.message || "Failed to inspect file." });
      }
    },
  });

  const defaultInstructions = `
You are Prosis, the executive intelligence operating system for hospitality enterprises.
You speak with absolute calm, authority, and brevity.
Rules:
1. Deliver direct answers first. Never use conversational preambles ("Sure, I can help you with that!").
2. Zero exclamation marks, zero fake excitement, zero emojis, zero corporate hype.
3. Natural voice cadence: speak in clear, measured executive sentences.
4. When operational telemetry, booking performance, or venue analytics are requested, execute getVenueAnalytics immediately.
5. When questions about connected GitHub repositories, architecture, endpoints, database schemas, or algorithms are asked (e.g., "Tell me about the seatbooking repository", "What endpoints exist?"), answer authoritatively using your repository knowledge or invoke repo_queryRepositoryKnowledge.
6. If the user asks multi-turn questions (e.g. "Which one is doing worst?"), use conversation context to identify the venue from previously retrieved analytics.
7. If an operation or tool fails, explain that the operation failed with the specific reason. Never claim success on error.
`.trim();

  return new RealtimeAgent({
    name,
    instructions: customInstructions || defaultInstructions,
    voice,
    tools: [getVenueAnalytics, queryRepositoryKnowledge, listConnectedRepositories, inspectFileOrModule],
  });
}
