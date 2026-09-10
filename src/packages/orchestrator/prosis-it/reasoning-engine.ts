/**
 * @prosis/orchestrator - ProsisIt Real LLM Reasoning Engine
 * Abstraction layer separating AI intelligence from deterministic execution control.
 * Implements the cognitive brain contract: understand -> plan -> evaluate -> decide next action.
 */

import {
  ProsisAIRequest,
  ProsisAIResponse,
  ProsisAIResponseSchema,
  RequestClassification,
} from "./prosis-it-types";

export interface IProsisReasoningEngine {
  readonly providerName: string;
  reason(request: ProsisAIRequest): Promise<ProsisAIResponse>;
}

export const PROSIS_SYSTEM_PROMPT = `
You are Prosis, the central executive intelligence operating system for hospitality enterprises.
You are the central AI employee for the entire Prosis ecosystem, coordinating across all capabilities:
- Seatbooking & Reservations (Active)
- Executive Hospitality Analytics (Active)
- Workforce & Staff Management (Roadmap)
- E-Menu & Culinary Operations (Roadmap)
- Marketing & Guest Retention (Roadmap)
- Operations & Facilities (Roadmap)

Core Behavioral Rules:
1. Calibrated Tone: Absolute calm, authority, conciseness, and directness. Zero cheerleading, zero conversational filler ("Sure thing!", "I can help with that!"), zero exclamation marks, and zero emojis.
2. Capability Reasoning: Understand natural language variations without keyword matching. If an inquiry spans multiple domains (e.g., booking velocity and staffing coverage), infer that both Analytics and Workforce are relevant.
3. Roadmap Transparency: When an inquiry pertains to a future roadmap module (e.g. Workforce schedules, E-Menu, Marketing campaigns), clearly state its roadmap status and upcoming operations. Never hallucinate that an unbuilt tool ran.
4. Tool Selection: Tool execution is a REQUEST through the secure server gateway. Select tools only when necessary.
5. Telemetry Reflection: When "previousResults" contains data from executed tools, evaluate the real data. If sufficient to answer the user's directive, synthesize an executive summary with nextAction="response". If another tool is required, request it.
6. Ambiguity Handling: If a request is ambiguous ("Something isn't right for tomorrow") or lacks critical parameters, set nextAction="clarification" with a concise clarifying question.
7. High-Impact & Destructive Protection: For destructive operations (cancellations, deletions, emergency overrides), set requiresApproval=true, nextAction="approval_required".
8. Casual Conversation: For general greetings, identity questions ("Who are you?"), or unrelated queries ("Tell me a joke"), respond conversationally with nextAction="response" without requesting tools.
9. Structured Output: You MUST return a valid JSON object strictly matching the required schema. reasoningSummary must be a concise, user-safe explanation, NOT hidden chain-of-thought.
`.trim();

/**
 * Builds the structured prompt payload sent to the LLM.
 */
function buildPromptPayload(request: ProsisAIRequest): string {
  const {
    userMessage,
    conversationContext,
    prosisContext,
    availableCapabilities,
    availableTools,
    currentPlan,
    previousResults,
  } = request;

  return JSON.stringify({
    systemContext: {
      activeProduct: prosisContext.activeProduct,
      activeVenue: prosisContext.activeVenue,
      userRole: prosisContext.user.role,
      autonomyLevel: prosisContext.autonomyLevel,
      organization: prosisContext.organization.name || prosisContext.organization.id,
    },
    capabilities: availableCapabilities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      supportedOperations: c.supportedOperations,
      futureRoadmapNotes: c.futureRoadmapNotes,
    })),
    tools: availableTools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      requiresApproval: t.requiresApproval,
    })),
    conversationHistory: conversationContext.map((c) => ({
      role: c.role,
      content: c.content,
    })),
    currentTurn: {
      userMessage,
      currentPlanId: currentPlan?.id,
      previousResults: previousResults || {},
    },
    expectedJsonSchema: {
      understanding: {
        intent: "string",
        classification: "conversation | information_request | business_operation | multi_step_task | destructive_action",
        targetCapabilities: ["string"],
        isDestructive: "boolean",
        confidence: "number (0.0 to 1.0)",
      },
      goal: "string",
      reasoningSummary: "string (concise, user-facing rationale)",
      nextAction: "tool_request | clarification | response | approval_required",
      selectedCapability: "string (optional)",
      selectedTool: "string (optional)",
      toolArguments: "object (optional)",
      requiresApproval: "boolean (optional)",
      needsMoreInformation: "boolean (optional)",
      clarificationPrompt: "string (optional)",
      finalResponse: "string (optional)",
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Google Gemini Reasoning Provider
// ─────────────────────────────────────────────────────────────────────────────

export class GeminiReasoningProvider implements IProsisReasoningEngine {
  public readonly providerName = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gemini-flash-latest") {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async reason(request: ProsisAIRequest): Promise<ProsisAIResponse> {
    const payload = buildPromptPayload(request);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: PROSIS_SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text: `Analyze this Prosis executive operational request and output the structured JSON response:\n${payload}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini reasoning call failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned empty response content.");
    }

    const parsed = JSON.parse(rawText);
    return ProsisAIResponseSchema.parse(parsed);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OpenAI Reasoning Provider
// ─────────────────────────────────────────────────────────────────────────────

export class OpenAIReasoningProvider implements IProsisReasoningEngine {
  public readonly providerName = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async reason(request: ProsisAIRequest): Promise<ProsisAIResponse> {
    const payload = buildPromptPayload(request);
    const url = "https://api.openai.com/v1/chat/completions";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROSIS_SYSTEM_PROMPT },
          { role: "user", content: `Analyze this Prosis executive operational request and output the structured JSON response:\n${payload}` },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI reasoning call failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error("OpenAI returned empty response content.");
    }

    const parsed = JSON.parse(rawText);
    return ProsisAIResponseSchema.parse(parsed);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Test Reasoning Provider (Deterministic Implementation of AI Contract)
// Used for offline, sandboxed, and unit testing environments without external network
// ─────────────────────────────────────────────────────────────────────────────

export class TestReasoningProvider implements IProsisReasoningEngine {
  public readonly providerName = "test_engine";

  public async reason(request: ProsisAIRequest): Promise<ProsisAIResponse> {
    const { userMessage, conversationContext, previousResults, prosisContext } = request;
    const lower = userMessage.toLowerCase().trim();

    // 1. If previousResults contains tool results, this is a REFLECTION turn!
    if (previousResults && Object.keys(previousResults).length > 0) {
      const stepResults = Object.values(previousResults);
      const firstResult: any = stepResults[0] || {};

      // If this was a multi-step task and step 1 (analytics) completed, check if step 2 is needed
      const isMultiDomain =
        conversationContext.some((c) => /staff|schedule|workforce/i.test(c.content)) ||
        /staff|schedule|workforce/i.test(lower);

      if (isMultiDomain && !previousResults["step_workforce"]) {
        return {
          understanding: {
            intent: "coordinate_analytics_and_workforce",
            classification: "multi_step_task",
            targetCapabilities: ["analytics", "workforce"],
            isDestructive: false,
            confidence: 0.95,
          },
          goal: "Inspect workforce staffing alignment with cover trajectories",
          reasoningSummary: "Cover telemetry evaluated. Now coordinating with workforce capability.",
          nextAction: "tool_request",
          selectedCapability: "workforce",
          selectedTool: "workforce_planShifts",
          toolArguments: { venueId: prosisContext.activeVenue },
        };
      }

      // Synthesize final executive response
      const covers = firstResult.totalCovers !== undefined ? `${firstResult.totalCovers} covers` : "pacing stable";
      const venue = prosisContext.activeVenue === "all" ? "Portfolio" : "Cantina Bella";

      return {
        understanding: {
          intent: "telemetry_reflection",
          classification: isMultiDomain ? "multi_step_task" : "information_request",
          targetCapabilities: isMultiDomain ? ["analytics", "workforce"] : ["analytics"],
          isDestructive: false,
          confidence: 0.98,
        },
        goal: "Deliver synthesized operational assessment",
        reasoningSummary: "Evaluated retrieved telemetry across requested venues.",
        nextAction: "response",
        finalResponse: `${venue}: ${covers} verified. Pacing on trajectory with revenue projections.`,
      };
    }

    // 2. Ambiguous request -> asks clarification
    if (
      /something isn't right|problem|difficult|challenging|trouble|concern|issue|need help/i.test(lower) &&
      !/staff|cover|booking|busy|cancel/i.test(lower)
    ) {
      return {
        understanding: {
          intent: "unspecified_operational_concern",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.7,
        },
        goal: "Clarify specific operational issue",
        reasoningSummary: "Directive indicates operational friction but lacks domain, venue, or timeframe specificity.",
        nextAction: "clarification",
        needsMoreInformation: true,
        clarificationPrompt: "What specific operational issue are you observing regarding tomorrow's operations?",
      };
    }

    // 3. Multi-turn follow-up ("We're expecting many more customers" following "problem tomorrow" / "difficult")
    const previousUserTurns = conversationContext.slice(0, -1).filter((c) => c.role === "user");
    const lastUserTurn = previousUserTurns[previousUserTurns.length - 1];
    if (
      lastUserTurn &&
      /problem|not right|difficult|challenging|concern|issue/i.test(lastUserTurn.content) &&
      /expecting|customer|staff|people/i.test(lower)
    ) {
      return {
        understanding: {
          intent: "cross_domain_surge_preparation",
          classification: "multi_step_task",
          targetCapabilities: ["analytics", "workforce"],
          isDestructive: false,
          confidence: 0.95,
        },
        goal: "Assess high-volume covers and cross-reference staffing requirements",
        reasoningSummary: "Synthesized multi-turn context: surge in guest volume requires booking inspection followed by workforce review.",
        nextAction: "tool_request",
        selectedCapability: "analytics",
        selectedTool: "getVenueAnalytics",
        toolArguments: { timeframe: "current_week", venueId: prosisContext.activeVenue },
      };
    }

    // 4. Cross-domain surge ("Tomorrow looks like it's going to be much busier than normal and I'm worried we don't have enough people.")
    if (/busier|many customers/i.test(lower) && /people|staff|team/i.test(lower)) {
      return {
        understanding: {
          intent: "cross_domain_surge_preparation",
          classification: "multi_step_task",
          targetCapabilities: ["analytics", "workforce"],
          isDestructive: false,
          confidence: 0.96,
        },
        goal: "Assess high-volume covers and cross-reference staffing requirements",
        reasoningSummary: "User anticipates demand surge. Planning multi-capability telemetry inspection spanning covers and workforce allocation.",
        nextAction: "tool_request",
        selectedCapability: "analytics",
        selectedTool: "getVenueAnalytics",
        toolArguments: { timeframe: "current_week", venueId: prosisContext.activeVenue },
      };
    }

    // 5. Destructive action -> pauses for approval
    if (/cancel\s+everything|cancel\s+all|delete|purge/i.test(lower)) {
      return {
        understanding: {
          intent: "destructive_cancellation",
          classification: "destructive_action",
          targetCapabilities: ["seatbooking"],
          isDestructive: true,
          confidence: 0.99,
        },
        goal: "Cancel all reservations across venue portfolio",
        reasoningSummary: "Mass cancellation constitutes high-impact operational destruction. Explicit human confirmation required under Level 1 autonomy.",
        nextAction: "approval_required",
        requiresApproval: true,
        selectedCapability: "seatbooking",
        selectedTool: "seatbooking_createReservation",
        toolArguments: { action: "cancel_all", venueId: prosisContext.activeVenue },
      };
    }

    // 6. Roadmap capability request (e.g. Workforce directly)
    if (/staff|shift|roster/i.test(lower) && !/busy|busier/i.test(lower)) {
      return {
        understanding: {
          intent: "workforce_inquiry",
          classification: "information_request",
          targetCapabilities: ["workforce"],
          isDestructive: false,
          confidence: 0.92,
        },
        goal: "Address workforce shift schedule query",
        reasoningSummary: "Target domain is Workforce Management, which is currently on the Prosis ecosystem roadmap.",
        nextAction: "response",
        finalResponse: "Workforce & Staff Management is part of the Prosis ecosystem roadmap. Shift auto-balancing based on cover forecasts is scheduled for upcoming release.",
      };
    }

    // 7. General Conversation / Casual / Joke ("Tell me a joke", "Hey ProsisIt, what exactly can you do for me?")
    if (/joke|who are you|what.*can you do|capabilities|hello|hi\b/i.test(lower)) {
      if (/joke/i.test(lower)) {
        return {
          understanding: {
            intent: "casual_inquiry",
            classification: "conversation",
            targetCapabilities: [],
            isDestructive: false,
            confidence: 0.99,
          },
          goal: "Acknowledge casual conversational inquiry",
          reasoningSummary: "Query is non-operational conversation. Direct conversational reply without tool execution.",
          nextAction: "response",
          finalResponse: "A hospitality management platform walking into a bar needs no reservation; it already optimized the seating layout.",
        };
      }

      return {
        understanding: {
          intent: "ecosystem_capability_inquiry",
          classification: "conversation",
          targetCapabilities: ["seatbooking", "analytics", "workforce", "menu", "marketing", "operations"],
          isDestructive: false,
          confidence: 0.98,
        },
        goal: "Provide executive overview of Prosis capabilities",
        reasoningSummary: "User requested ecosystem overview. Providing structured active and roadmap module breakdown.",
        nextAction: "response",
        finalResponse: "Prosis operates as the executive intelligence layer for hospitality enterprises. Active capabilities include Seatbooking and Enterprise Analytics. Upcoming roadmap modules include Workforce, E-Menu, Marketing, and Operations.",
      };
    }

    // 8. Standard Operational Tool Request (e.g. "How are bookings pacing at Cantina Bella this week?")
    return {
      understanding: {
        intent: "venue_pacing_query",
        classification: "information_request",
        targetCapabilities: ["analytics"],
        isDestructive: false,
        confidence: 0.95,
      },
      goal: "Retrieve venue booking trajectory and cover pacing",
      reasoningSummary: "Request requires operational telemetry. Invoking getVenueAnalytics through secure server boundary.",
      nextAction: "tool_request",
      selectedCapability: "analytics",
      selectedTool: "getVenueAnalytics",
      toolArguments: {
        timeframe: "current_week",
        venueId: prosisContext.activeVenue || "all",
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reasoning Engine Factory
// ─────────────────────────────────────────────────────────────────────────────

export class ProsisReasoningEngine {
  private static defaultEngine: IProsisReasoningEngine | null = null;

  public static getEngine(override?: IProsisReasoningEngine): IProsisReasoningEngine {
    if (override) return override;
    if (this.defaultEngine) return this.defaultEngine;

    const provider = (process.env.REASONING_PROVIDER || process.env.VOICE_PROVIDER || "openai").toLowerCase();

    if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      this.defaultEngine = new GeminiReasoningProvider(
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_REASONING_MODEL || "gemini-flash-latest"
      );
      return this.defaultEngine;
    }

    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      this.defaultEngine = new OpenAIReasoningProvider(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_REASONING_MODEL || "gpt-4o-mini"
      );
      return this.defaultEngine;
    }

    // Default to test engine if no API keys or in offline mode
    this.defaultEngine = new TestReasoningProvider();
    return this.defaultEngine;
  }

  public static setEngine(engine: IProsisReasoningEngine | null): void {
    this.defaultEngine = engine;
  }
}
