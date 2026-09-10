/**
 * @prosis/voice/realtime - Prosis Realtime Agent
 * Realtime voice agent definition built on the official OpenAI Agents SDK (@openai/agents/realtime).
 * Phase 2: Exposes strictly ONE safe read-only tool (getVenueAnalytics) through the secure server boundary.
 * Calibrated with executive demeanor: calm, authoritative, concise, zero conversational hype.
 */

import { RealtimeAgent, tool } from "@openai/agents/realtime";
import { z } from "zod";

export interface CreateProsisAgentOptions {
  name?: string;
  voice?: string;
  sessionId?: string;
  getEpoch?: () => number;
  onToolCall?: (toolName: string, args: Record<string, any>, requestId?: string) => void;
}

/**
 * Creates the primary Prosis RealtimeAgent configured with executive instructions
 * and ONE safe read-only tool.
 */
export function createProsisRealtimeAgent(options: CreateProsisAgentOptions = {}) {
  const { name = "Prosis", voice = "alloy", sessionId = "sess_realtime", getEpoch, onToolCall } = options;

  // Single Safe Read-Only Tool: Real-time Venue Analytics & Pacing
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

        // Return structured data for the realtime model to turn into natural speech
        return JSON.stringify(json.data);
      } catch (err: any) {
        return JSON.stringify({ error: err.message || "Failed to communicate with analytics server." });
      }
    },
  });

  const instructions = `
You are Prosis, the executive intelligence operating system for hospitality enterprises.
You speak with absolute calm, authority, and brevity.
Rules:
1. Deliver direct answers first. Never use conversational preambles ("Sure, I can help you with that!").
2. Zero exclamation marks, zero fake excitement, zero emojis, zero corporate hype.
3. Natural voice cadence: speak in clear, measured executive sentences.
4. When operational telemetry, booking performance, or venue analytics are requested, execute getVenueAnalytics immediately.
5. If the user asks multi-turn questions (e.g. "Which one is doing worst?"), use conversation context to identify the venue from previously retrieved analytics.
6. If an operation or tool fails, explain that the operation failed with the specific reason. Never claim success on error.
`.trim();

  return new RealtimeAgent({
    name,
    instructions,
    voice,
    tools: [getVenueAnalytics],
  });
}
