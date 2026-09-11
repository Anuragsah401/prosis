import { NextRequest, NextResponse } from "next/server";
import "@/packages/orchestrator/agent";
import fs from "fs";
import path from "path";
import { GitHubRepositoryEngine } from "@/packages/knowledge";

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

function getRealtimeToolDeclarations() {
  return [
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
            description: "Optional specific venue ID to inspect (e.g. 'cantina_bella', 'verdant_bistro')",
          },
        },
      },
    },
    {
      name: "repo_queryRepositoryKnowledge",
      description:
        "Query code, architecture blueprints, endpoints, schemas, and algorithms across connected GitHub repositories (e.g. Seatbooking). Call this whenever the user asks how a repository works, what APIs exist, or asks about repository architecture.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query or concept, e.g. 'reservations endpoint', 'pacing algorithm', 'deposit escrow', 'database models'",
          },
          repoId: {
            type: "string",
            description: "Optional repository identifier (e.g. 'repo_seatbooking_core')",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "repo_listConnectedRepositories",
      description:
        "Lists all connected GitHub repositories, their tech stack, key capabilities, endpoints count, and indexing status.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "repo_inspectFileOrModule",
      description:
        "Inspects a specific file or module path within a connected GitHub repository to view its summary and role in the architecture.",
      parameters: {
        type: "object",
        properties: {
          repoId: {
            type: "string",
            description: "Repository ID, e.g. 'repo_seatbooking_core'",
          },
          filePath: {
            type: "string",
            description: "Relative file path inside the repository, e.g. 'src/server/routes/reservations.ts'",
          },
        },
        required: ["repoId", "filePath"],
      },
    },
  ];
}

function buildRealtimeSystemInstruction(): string {
  const repos = GitHubRepositoryEngine.listRepositories();
  let repoSummary = "";
  if (repos.length > 0) {
    repoSummary =
      "\n\nConnected GitHub Repositories & Ecosystem Knowledge:\n" +
      repos
        .map((r) => {
          const bp = r.blueprint;
          const endpoints = bp.apiEndpoints.slice(0, 15).map((e) => `${e.method} ${e.path}`).join(", ");
          const models = bp.domainModels.slice(0, 10).map((m) => m.name).join(", ");
          return `• Repository "${r.name}" (${r.repoUrl}, branch: ${r.branch}):
  - Overview: ${bp.overview || r.description}
  - Tech Stack: ${bp.techStack.join(", ")}
  - Key Capabilities: ${bp.keyCapabilities.join("; ")}
  - API Endpoints: ${endpoints || "None"}
  - Domain Models: ${models || "None"}
  - Architecture Notes: ${bp.architectureNotes || "N/A"}`;
        })
        .join("\n\n");
  }

  return `${PROSIS_SYSTEM_INSTRUCTION}
${repoSummary}

4. Codebase & Repository Intelligence:
You have authoritative, comprehensive knowledge of the connected GitHub repositories listed above.
- When the user asks questions about connected repositories, codebases, architecture, database schemas, API routes, or algorithms (e.g. "Tell me about the seatbooking repository", "What endpoints does seatbooking have?", "How does table allocation or deposit escrow work?"), speak authoritatively using the repository blueprints above or invoke repo_queryRepositoryKnowledge to retrieve detailed facts.
- For voice delivery, summarize technical architecture with clarity, brevity, and executive polish. Do not read out raw code blocks; explain the architecture, endpoints, schemas, and operational purpose in spoken natural language.
- When the user asks to inspect a specific file or module, invoke repo_inspectFileOrModule.
- When the user asks what repositories are connected, cite them clearly or invoke repo_listConnectedRepositories.`;
}

export async function POST(req: NextRequest) {
  try {
    const dynamicSystemInstruction = buildRealtimeSystemInstruction();
    const realtimeTools = getRealtimeToolDeclarations();

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
        systemInstruction: dynamicSystemInstruction,
        tools: realtimeTools,
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

    const openAITools = realtimeTools.map((t) => ({
      type: "function",
      ...t,
    }));

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
          instructions: dynamicSystemInstruction,
          tools: openAITools,
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
      systemInstruction: dynamicSystemInstruction,
      tools: openAITools,
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
