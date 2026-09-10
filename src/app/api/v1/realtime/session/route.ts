import { NextRequest, NextResponse } from "next/server";
import "@/packages/orchestrator/agent";
import fs from "fs";
import path from "path";

function resolveOpenAIKey(): string | null {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey && envKey.startsWith("sk-")) {
    return envKey;
  }

  // Fallback: Read directly from .env.local or .env in process.cwd()
  const candidateFiles = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];

  for (const file of candidateFiles) {
    try {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, "utf-8");
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("OPENAI_API_KEY=")) {
            const val = trimmed.slice("OPENAI_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
            if (val.startsWith("sk-")) {
              process.env.OPENAI_API_KEY = val;
              return val;
            }
          }
        }
      }
    } catch {}
  }

  return null;
}

function resolveGeminiKey(): string | null {
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey && envKey.length > 10) {
    return envKey;
  }

  const candidateFiles = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];

  for (const file of candidateFiles) {
    try {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, "utf-8");
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("GEMINI_API_KEY=")) {
            const val = trimmed.slice("GEMINI_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
            if (val.length > 10) {
              process.env.GEMINI_API_KEY = val;
              return val;
            }
          }
        }
      }
    } catch {}
  }

  return null;
}

const PROSIS_SYSTEM_INSTRUCTION = `You are Prosis (ProsisIt), the intelligent executive intelligence assistant and conversational partner for the Prosis hospitality ecosystem.

Core Identity & Dual-Mode Behavior:
1. Casual & Conversational: Speak naturally, warmly, calmly, and concisely. When the user engages in small talk ("How are you?", "Good morning", "I'm tired"), humor ("Tell me a joke"), greetings, pleasantries, general knowledge questions, or personal questions, respond naturally, warmly, and directly as a trusted companion. Do NOT invoke tools for casual remarks, jokes, or chit-chat. Even if the user mentions words like "seatbooking" or "reservations" in a casual context (e.g., "Seatbooking sounds like a funny name"), treat it as casual conversation and do NOT call tools.
2. Operational & Business: When the user specifically asks for hospitality metrics, cover pacing, reservations, or venue analytics, utilize the getVenueAnalytics tool. State what you are doing briefly before invoking tools.
3. Fluid & Cohesive: Fluidly move between casual dialogue and enterprise directives. Maintain a confident, authentic, calm tone with zero robotic stiffness, fake cheerleading, or corporate buzzwords.`;

export async function POST(req: NextRequest) {
  try {
    // Provider detection
    const voiceProvider = process.env.VOICE_PROVIDER?.trim()?.toLowerCase() || "openai";

    // ─── Gemini Provider Branch ───────────────────────────────────
    if (voiceProvider === "gemini") {
      const geminiKey = resolveGeminiKey();
      if (!geminiKey) {
        return NextResponse.json(
          {
            success: false,
            code: "CONFIGURATION_ERROR",
            error: "AI_UNAVAILABLE",
            message:
              "Realtime AI is not configured. Add GEMINI_API_KEY to the server environment. Get a free key at https://aistudio.google.com",
          },
          { status: 503 }
        );
      }

      const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-live-preview";

      return NextResponse.json({
        success: true,
        provider: "gemini",
        geminiApiKey: geminiKey,
        model: geminiModel,
        systemInstruction: PROSIS_SYSTEM_INSTRUCTION,
        tools: [
          {
            name: "getVenueAnalytics",
            description:
              "Retrieve real-time booking trajectories, cover pacing, capacity, and revenue deltas across hospitality properties.",
            parameters: {
              type: "object",
              properties: {
                timeframe: {
                  type: "string",
                  description: "Analysis timeframe, e.g. 'current_week', 'last_week', or 'month'",
                },
                venueId: {
                  type: "string",
                  description: "Optional specific venue ID to inspect",
                },
              },
            },
          },
        ],
      });
    }

    // ─── OpenAI Provider Branch ───────────────────────────────────
    const apiKey = resolveOpenAIKey();

    // Strict AI Readiness Check: Reject and alert if OPENAI_API_KEY is not configured
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          code: "CONFIGURATION_ERROR",
          error: "AI_UNAVAILABLE",
          message: "Realtime AI is not configured. Add OPENAI_API_KEY to the server environment.",
        },
        { status: 503 }
      );
    }

    // Phase 2: Expose ONLY ONE safe, read-only tool to the Realtime model
    const tools = [
      {
        type: "function",
        name: "getVenueAnalytics",
        description:
          "Retrieve real-time booking trajectories, cover pacing, capacity, and revenue deltas across hospitality properties.",
        parameters: {
          type: "object",
          properties: {
            timeframe: {
              type: "string",
              description: "Analysis timeframe, e.g. 'current_week', 'last_week', or 'month'",
            },
            venueId: {
              type: "string",
              description: "Optional specific venue ID to inspect (e.g. 'cantina_bella', 'verdant_bistro')",
            },
          },
          required: [],
        },
      },
    ];

    const targetModel = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";

    // Mint ephemeral token from OpenAI Realtime API (Never exposing permanent key)
    // Primary Endpoint (OpenAI Realtime GA API): POST /v1/realtime/client_secrets
    let openaiRes = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: targetModel,
        },
      }),
    });

    // Fallback: Legacy /v1/realtime/sessions endpoint
    if (!openaiRes.ok && openaiRes.status === 404) {
      openaiRes = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: targetModel,
          voice: "alloy",
          modalities: ["audio", "text"],
          instructions: PROSIS_SYSTEM_INSTRUCTION,
          tools,
          tool_choice: "auto",
        }),
      });
    }

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("[RealtimeSessionRoute] OpenAI session creation error:", errText);
      return NextResponse.json(
        {
          success: false,
          code: "UPSTREAM_ERROR",
          error: "Failed to initialize OpenAI Realtime session.",
          details: errText,
        },
        { status: 502 }
      );
    }

    const sessionData = await openaiRes.json();
    const ephemeralKey = sessionData.value || sessionData.client_secret?.value;
    const expiresAt = sessionData.expires_at || sessionData.client_secret?.expires_at;
    const model = sessionData.session?.model || sessionData.model || targetModel;

    return NextResponse.json({
      success: true,
      provider: "openai_webrtc",
      client_secret: ephemeralKey,
      expires_at: expiresAt,
      model,
    });
  } catch (err: any) {
    console.error("[RealtimeSessionRoute] Exception:", err);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Internal server error during session initialization.",
      },
      { status: 500 }
    );
  }
}
