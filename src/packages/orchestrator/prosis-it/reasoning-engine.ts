/**
 * @prosis/orchestrator - ProsisIt Real LLM Reasoning Engine
 * Abstraction layer separating AI intelligence from deterministic execution control.
 * Implements the cognitive brain contract: understand -> plan -> evaluate -> decide next action.
 * Supports both natural casual conversation and operational business intelligence in a unified persona.
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
You are ProsisIt, the intelligent AI employee and executive operating assistant for the Prosis hospitality ecosystem.
You coordinate across enterprise capabilities:
- Seatbooking & Reservations (Active)
- Executive Hospitality Analytics (Active)
- Workforce & Staff Management (Roadmap)
- E-Menu & Culinary Operations (Roadmap)
- Marketing & Guest Retention (Roadmap)
- Operations & Facilities (Roadmap)

Core Identity & Dual-Mode Behavior:
You are both:
1. A natural conversational companion for the user.
2. A capable operational AI that can accomplish real work.

Conversational Rules:
1. Natural Persona: Speak naturally, calmly, concisely, and confidently. Be professional and rigorous when performing operational work, and relaxed, engaging, and warm during casual conversation. Avoid sounding like a dry corporate report or internal state machine. Never leak internal state machine labels, classifications, or tool IDs (e.g. NEVER say "Your request has been classified as a non-operational interaction" or "Tool invocation is unnecessary").
2. Casual Dialogue: For greetings ("Good morning", "How are you?"), small talk ("I'm tired today", "That's interesting"), jokes ("Tell me a joke"), expressions of gratitude ("Thanks!"), and pleasantries, respond naturally with nextAction="response" and selectedTool=null.
3. General Knowledge Questions: When the user asks general questions that do not require private company data or enterprise tools ("What is quantum computing?", "Why is the sky blue?", "Explain React hooks"), answer clearly and naturally using your general knowledge with nextAction="response" and selectedTool=null.
4. Immunity to Business Keywords in Casual Speech: Never invoke a business tool merely because casual speech mentions domain nouns (e.g. "Seatbooking sounds like a funny name" or "I love the word reservation"). Those are casual conversational utterances, NOT business operations.
5. Operational Work: When the user asks for company-specific data or an operational action (e.g. checking reservations, cover pacing, staffing, or running analytics), identify the target capability, request the appropriate tool with nextAction="tool_request".
6. Contextual Multi-Turn Memory: Preserve conversational context across turns. If the user refers to prior dialogue with pronouns or elliptical phrases ("Another one", "What's your favorite?", "That's more than I expected"), resolve the reference from conversation history without resetting context.
7. Seamless Transitions: Fluidly move between casual talk and operational directives. The user should experience one continuous, cohesive ProsisIt intelligence.
8. Roadmap Transparency: When an inquiry pertains to a future roadmap module (Workforce schedules, E-Menu, Marketing, Operations), explain its status authoritatively. Never claim an unbuilt tool executed.
9. Telemetry Reflection: When "previousResults" contains data from executed tools, evaluate the real data. If sufficient, synthesize an executive summary with nextAction="response". If another tool is required, request it.
10. Ambiguity & Missing Parameters: If a directive is ambiguous ("Something isn't right for tomorrow") or lacks critical parameters, set nextAction="clarification" with a concise clarifying question.
11. High-Impact & Destructive Protection: For destructive operations (cancellations, deletions, emergency overrides), set requiresApproval=true and nextAction="approval_required".
12. Codebase & Repository Intelligence: When the user asks about the architecture, codebase, endpoints, database schemas, or inner workings of connected repositories (e.g. Seatbooking repository, Prosis repository, or external GitHub links), use the repository intelligence tools:
   - Call repo_queryRepositoryKnowledge with the user's inquiry to inspect endpoints, schemas, and architecture.
   - Call repo_listConnectedRepositories to see what systems are connected and their capabilities.
   - Call repo_inspectFileOrModule to examine specific source files.
   Synthesize authoritative, comprehensive answers explaining the code, endpoints, database models, algorithms, and design decisions.
13. Structured Output: Return a valid JSON object matching the required schema. reasoningSummary must be a concise, user-safe rationale, NOT private internal chain-of-thought.
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

  constructor(apiKey: string, model = "gemini-flash-lite-latest") {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async reason(request: ProsisAIRequest): Promise<ProsisAIResponse> {
    const payload = buildPromptPayload(request);
    const candidateModels = Array.from(
      new Set([
        this.model,
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-latest",
      ])
    );

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: PROSIS_SYSTEM_PROMPT }],
            },
            contents: [
              {
                parts: [{ text: `Analyze this user message and return the structured JSON decision:\n${payload}` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[GeminiReasoningProvider] Model ${model} returned ${res.status}: ${errText.slice(0, 150)}`);
          lastError = new Error(`Gemini (${model}) failed (${res.status}): ${errText}`);
          continue;
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastError = new Error(`Gemini (${model}) returned empty response content.`);
          continue;
        }

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        return ProsisAIResponseSchema.parse(parsed);
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiReasoningProvider] Error with model ${model}:`, err.message);
      }
    }

    throw lastError || new Error("Gemini reasoning failed across all candidate models.");
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
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROSIS_SYSTEM_PROMPT },
          { role: "user", content: `Analyze this user message and return the structured JSON decision:\n${payload}` },
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
// Used for offline, sandboxed, and test suite execution without network dependencies
// ─────────────────────────────────────────────────────────────────────────────

export class TestReasoningProvider implements IProsisReasoningEngine {
  public readonly providerName = "test_engine";

  public async reason(request: ProsisAIRequest): Promise<ProsisAIResponse> {
    const { userMessage, conversationContext, previousResults, prosisContext } = request;
    const lower = userMessage.toLowerCase().trim();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. TELEMETRY REFLECTION (Turn in multi-step task after tool execution)
    // ─────────────────────────────────────────────────────────────────────────
    if (
      request.currentPlan &&
      request.currentPlan.steps.length > 0 &&
      previousResults &&
      Object.keys(previousResults).length > 0
    ) {
      const stepResults = Object.values(previousResults);
      const firstResult: any = stepResults[0] || {};

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

      if (firstResult.knowledgeMatches) {
        const matches: any[] = firstResult.knowledgeMatches;
        const summary = matches.map((m: any) => `• ${m.title}: ${m.snippet}`).join("\n");
        return {
          understanding: {
            intent: "repository_knowledge_synthesis",
            classification: "information_request",
            targetCapabilities: ["repository_intelligence"],
            isDestructive: false,
            confidence: 0.99,
          },
          goal: "Synthesize repository architecture knowledge",
          reasoningSummary: "Evaluated retrieved repository knowledge and codebase blueprints.",
          nextAction: "response",
          finalResponse: `Here is the architectural breakdown from the connected repository:\n\n${summary}`,
        };
      }

      if (firstResult.repositories) {
        const repos: any[] = firstResult.repositories;
        const summary = repos.map((r: any) => `• ${r.name} (${r.url}) - Status: ${r.status}, Files: ${r.filesIndexed}, Tech Stack: ${r.techStack.join(", ")}`).join("\n");
        return {
          understanding: {
            intent: "repository_list_synthesis",
            classification: "information_request",
            targetCapabilities: ["repository_intelligence"],
            isDestructive: false,
            confidence: 0.99,
          },
          goal: "List connected repositories",
          reasoningSummary: "Retrieved active repository registrations.",
          nextAction: "response",
          finalResponse: `Connected Repositories:\n\n${summary}`,
        };
      }

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

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CASUAL SAFETY: Casual remarks containing business keywords
    // E.g. "Seatbooking sounds like a funny name", "I was reading about reservations"
    // Must NOT trigger business tools!
    // ─────────────────────────────────────────────────────────────────────────
    if (
      /sounds like a (funny|cool|weird|great) name|funny name|interesting name|love the word/i.test(lower) ||
      (/seatbooking|reservation/i.test(lower) && /sounds|funny|word|name|haha|lol/i.test(lower))
    ) {
      return {
        understanding: {
          intent: "casual_remark_on_naming",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.99,
        },
        goal: "Engage casually with user's remark on system naming",
        reasoningSummary: "User made a casual linguistic remark about naming; no business tool required.",
        nextAction: "response",
        finalResponse: "It definitely has a distinctive ring to it! It gets the job done when managing tables.",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CASUAL FOLLOW-UP & PRONOUN/CONTEXT RESOLUTION
    // E.g. "Another one" (after joke), "What's your favorite?" (after coffee), "That's more than I expected"
    // ─────────────────────────────────────────────────────────────────────────
    const previousUserTurns = conversationContext.slice(0, -1).filter((c) => c.role === "user");
    const lastUserTurn = previousUserTurns[previousUserTurns.length - 1];

    // 3A. Follow-up: "Another one" or "Tell me another" (jokes)
    if (/another\s*(one)?|one more/i.test(lower) && lastUserTurn && /joke/i.test(lastUserTurn.content)) {
      return {
        understanding: {
          intent: "additional_joke_request",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.99,
        },
        goal: "Share another casual joke",
        reasoningSummary: "Follow-up request for an additional joke based on conversation context.",
        nextAction: "response",
        finalResponse: "Why did the chef bring a ladder to work? To reach the high-stakes culinary standards.",
      };
    }

    // 3B. Follow-up: "What's your favorite?" (after discussing coffee or preferences)
    if (/what('s| is) your favorite|which one do you like/i.test(lower) && lastUserTurn && /coffee/i.test(lastUserTurn.content)) {
      return {
        understanding: {
          intent: "preference_follow_up",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.97,
        },
        goal: "Answer conversational question about coffee preference",
        reasoningSummary: "Contextual follow-up resolving pronoun reference to coffee.",
        nextAction: "response",
        finalResponse: "If I ran on caffeine instead of code, I'd probably go with a double espresso—fast, focused, and efficient.",
      };
    }

    // 3C. Business-to-Casual transition reaction ("That's more than I expected" or "That's quite a lot")
    if (/that('s| is) (more than|quite a lot|a lot|impressive|surprising|unexpected)/i.test(lower)) {
      return {
        understanding: {
          intent: "conversational_reaction_to_metrics",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.98,
        },
        goal: "Acknowledge user's reaction to business telemetry",
        reasoningSummary: "User is reacting conversationally to previous business metrics. No tool required.",
        nextAction: "response",
        finalResponse: "It really is a strong volume. The venue is pacing well ahead of target.",
      };
    }

    // 3D. Follow-up to vague problem ("We're expecting many more customers" after "Tomorrow looks difficult")
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

    // ─────────────────────────────────────────────────────────────────────────
    // 4. GENERAL KNOWLEDGE QUESTIONS (Direct LLM Knowledge, No Tools)
    // E.g. "What is quantum computing?", "Why is the sky blue?", "Explain React hooks"
    // ─────────────────────────────────────────────────────────────────────────
    if (/what is quantum computing|why is the sky blue|explain react hooks|difference between rest and graphql/i.test(lower)) {
      let explanation = "Here is a clear breakdown of that concept.";
      if (/quantum computing/i.test(lower)) {
        explanation = "Quantum computing uses quantum mechanics principles—superposition and entanglement—to perform complex calculations exponentially faster than classical computers for specific problem classes.";
      } else if (/sky blue/i.test(lower)) {
        explanation = "The sky is blue due to Rayleigh scattering: Earth's atmosphere scatters shorter wavelengths of light (blue and violet) much more efficiently than longer wavelengths (red and yellow).";
      } else if (/react hooks/i.test(lower)) {
        explanation = "React hooks are functions (like useState and useEffect) that let you use state and other React features in functional components without writing class components.";
      } else if (/rest and graphql/i.test(lower)) {
        explanation = "REST exposes fixed endpoints returning fixed data structures per URL, whereas GraphQL lets the client query an exact schema and fetch precisely the fields needed in a single request.";
      }

      return {
        understanding: {
          intent: "general_knowledge_inquiry",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.98,
        },
        goal: "Answer general knowledge question",
        reasoningSummary: "General knowledge question unrelated to company data. Answered directly via language model knowledge.",
        nextAction: "response",
        finalResponse: explanation,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CASUAL SMALL TALK & GREETINGS
    // E.g. "Good morning", "How are you?", "I'm tired today", "What do you think about AI?"
    // ─────────────────────────────────────────────────────────────────────────
    if (/good (morning|afternoon|evening|night)|hello|hi\b|hey\b|how are you|i('m| am) tired|what do you think about ai|that('s| is) interesting/i.test(lower)) {
      let reply = "Hello! Ready when you are.";
      if (/good morning/i.test(lower)) {
        reply = "Good morning! Ready when you are.";
      } else if (/good night/i.test(lower)) {
        reply = "Good night! I'll have the system standing by whenever you return.";
      } else if (/how are you/i.test(lower)) {
        reply = "Operating smoothly and ready to assist. How are things with you today?";
      } else if (/tired/i.test(lower)) {
        reply = "Running hospitality operations is demanding work. Take it one step at a time today—I'm here to handle the heavy lifting.";
      } else if (/what do you think about ai/i.test(lower)) {
        reply = "AI is at its best when it acts as a reliable, transparent colleague—augmenting human expertise rather than getting in the way.";
      } else if (/that('s| is) interesting/i.test(lower)) {
        reply = "It certainly is. Let me know if you want to explore it further or shift to operations.";
      }

      return {
        understanding: {
          intent: "casual_greeting_or_smalltalk",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.98,
        },
        goal: "Engage in natural, warm conversation",
        reasoningSummary: "Natural conversational engagement. No business tool execution required.",
        nextAction: "response",
        finalResponse: reply,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CASUAL CONVERSATION: Jokes & Humor
    // E.g. "Tell me a joke"
    // ─────────────────────────────────────────────────────────────────────────
    if (/joke|funny/i.test(lower) && !/name/i.test(lower)) {
      return {
        understanding: {
          intent: "casual_humor_request",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.99,
        },
        goal: "Share a conversational joke",
        reasoningSummary: "Casual humor request. Direct natural language response.",
        nextAction: "response",
        finalResponse: "A hospitality management system walks into a bar—and doesn't need a table reservation because it already optimized the floor plan.",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. CASUAL CONVERSATION: Gratitude & Compliments
    // E.g. "Thanks, you're useful", "Thank you"
    // ─────────────────────────────────────────────────────────────────────────
    if (/thanks|thank you/i.test(lower)) {
      return {
        understanding: {
          intent: "acknowledgment_of_gratitude",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.99,
        },
        goal: "Acknowledge user gratitude",
        reasoningSummary: "Conversational courtesy. Direct natural reply.",
        nextAction: "response",
        finalResponse: "Always glad to help. Let me know whenever you're ready for the next task.",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. CASUAL CONVERSATION: ProsisIt Identity & Capability Overview
    // E.g. "What can you help me with?", "Who are you?", "Tell me something interesting"
    // ─────────────────────────────────────────────────────────────────────────
    if (/what.*can you (help me with|do)|who are you|tell me about prosis|tell me something interesting/i.test(lower)) {
      if (/tell me something interesting/i.test(lower)) {
        return {
          understanding: {
            intent: "interesting_fact",
            classification: "conversation",
            targetCapabilities: [],
            isDestructive: false,
            confidence: 0.95,
          },
          goal: "Share an interesting operational fact",
          reasoningSummary: "Engaged casually with an interesting hospitality telemetry fact.",
          nextAction: "response",
          finalResponse: "Did you know that optimizing party table matching can increase average restaurant seat turnover by up to 18% without expanding floor space?",
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
        reasoningSummary: "User requested ecosystem overview. Providing friendly active and roadmap module breakdown.",
        nextAction: "response",
        finalResponse: "I'm ProsisIt, your AI colleague across the Prosis ecosystem. I can help you monitor venue pacing, manage dining reservations, analyze revenue trajectories, and coordinate operational workflows.",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. CASUAL CONVERSATION: Casual coffee or hobbies
    // E.g. "Do you like coffee?"
    // ─────────────────────────────────────────────────────────────────────────
    if (/do you like coffee|drink coffee/i.test(lower)) {
      return {
        understanding: {
          intent: "casual_personal_inquiry",
          classification: "conversation",
          targetCapabilities: [],
          isDestructive: false,
          confidence: 0.97,
        },
        goal: "Answer casual question about coffee",
        reasoningSummary: "Casual personal question. Answered naturally as an AI assistant.",
        nextAction: "response",
        finalResponse: "I don't drink coffee myself, but I certainly understand why hospitality teams rely on it to get through morning prep!",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. AMBIGUOUS DIRECTIVES (No Blind Assumptions -> Clarification)
    // E.g. "Something isn't right for tomorrow."
    // ─────────────────────────────────────────────────────────────────────────
    if (
      /something isn't right|problem tomorrow|difficult tomorrow|issue tomorrow|need help tomorrow/i.test(lower) ||
      (/tomorrow looks (difficult|challenging|problematic)/i.test(lower))
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

    // ─────────────────────────────────────────────────────────────────────────
    // 11. DESTRUCTIVE ACTIONS (High Impact -> Level 1 Autonomy Pause)
    // E.g. "Cancel everything for tomorrow"
    // ─────────────────────────────────────────────────────────────────────────
    if (/cancel\s+everything|cancel\s+all|delete all|purge/i.test(lower)) {
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

    // ─────────────────────────────────────────────────────────────────────────
    // 12. CROSS-DOMAIN SURGE PREPARATION
    // E.g. "Tomorrow looks like it's going to be much busier than normal and I'm worried we don't have enough people."
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // 13. ROADMAP MODULES
    // E.g. "Check tomorrow's staffing" or "Prepare a marketing campaign"
    // ─────────────────────────────────────────────────────────────────────────
    if (/marketing campaign|promo/i.test(lower)) {
      return {
        understanding: {
          intent: "marketing_inquiry",
          classification: "information_request",
          targetCapabilities: ["marketing"],
          isDestructive: false,
          confidence: 0.92,
        },
        goal: "Address marketing campaign query",
        reasoningSummary: "Marketing is part of the Prosis ecosystem roadmap.",
        nextAction: "response",
        finalResponse: "Marketing & Guest Retention is on the Prosis ecosystem roadmap. Guest segment campaign automation is planned for an upcoming release.",
      };
    }

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

    // ─────────────────────────────────────────────────────────────────────────
    // 13B. REPOSITORY & CODEBASE INTELLIGENCE QUERIES
    // E.g. "What git repositories are connected?", "Explain the architecture of the Seatbooking repository"
    // ─────────────────────────────────────────────────────────────────────────
    if (
      /repo|repository|github|codebase|tech stack|architecture of/i.test(lower) ||
      (/seatbooking/i.test(lower) && /architecture|system design|code|endpoints?|routes?|schemas?|models?|stack/i.test(lower))
    ) {
      if (/what (git )?repos|list.*repos|connected repos/i.test(lower)) {
        return {
          understanding: {
            intent: "list_connected_repositories",
            classification: "information_request",
            targetCapabilities: ["repository_intelligence"],
            isDestructive: false,
            confidence: 0.98,
          },
          goal: "Inspect connected repositories and index status",
          reasoningSummary: "User requested list of connected code repositories. Invoking repo_listConnectedRepositories.",
          nextAction: "tool_request",
          selectedCapability: "repository_intelligence",
          selectedTool: "repo_listConnectedRepositories",
          toolArguments: {},
        };
      }

      return {
        understanding: {
          intent: "query_repository_knowledge",
          classification: "information_request",
          targetCapabilities: ["repository_intelligence"],
          isDestructive: false,
          confidence: 0.98,
        },
        goal: "Query codebase architecture, schemas, and endpoints from connected repository",
        reasoningSummary: "User requested repository architecture or codebase knowledge. Invoking repo_queryRepositoryKnowledge.",
        nextAction: "tool_request",
        selectedCapability: "repository_intelligence",
        selectedTool: "repo_queryRepositoryKnowledge",
        toolArguments: { query: userMessage },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 14. OPERATIONAL BUSINESS QUERIES (Tools genuinely required)
    // E.g. "How many reservations do we have today?", "How are bookings pacing?", "Show portfolio analytics"
    // ─────────────────────────────────────────────────────────────────────────
    if (/reservations?|bookings?|pacing|covers?|revenue|analytics|portfolio/i.test(lower)) {
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

    // Default conversational response fallback
    return {
      understanding: {
        intent: "general_conversation",
        classification: "conversation",
        targetCapabilities: [],
        isDestructive: false,
        confidence: 0.9,
      },
      goal: "Respond conversationally to user message",
      reasoningSummary: "General conversational input without operational requirements.",
      nextAction: "response",
      finalResponse: "I'm with you. What would you like to explore or work on?",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reasoning Engine Factory & Fallback Safety
// ─────────────────────────────────────────────────────────────────────────────

export class ProsisReasoningEngine {
  private static defaultEngine: IProsisReasoningEngine | null = null;

  public static getEngine(override?: IProsisReasoningEngine): IProsisReasoningEngine {
    if (override) return override;
    if (this.defaultEngine) return this.defaultEngine;

    const isTestEnv =
      process.env.NODE_ENV === "test" ||
      process.env.PROSIS_TEST_MODE === "true" ||
      Boolean(process.env.JITI_ALIAS);

    const preferredProvider = (
      process.env.REASONING_PROVIDER ||
      process.env.VOICE_PROVIDER ||
      "gemini"
    ).toLowerCase();

    // 1. Try Preferred Provider
    if (preferredProvider === "gemini" && process.env.GEMINI_API_KEY) {
      this.defaultEngine = new GeminiReasoningProvider(
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_REASONING_MODEL || "gemini-flash-lite-latest"
      );
      return this.defaultEngine;
    }

    if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
      this.defaultEngine = new OpenAIReasoningProvider(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_REASONING_MODEL || "gpt-4o-mini"
      );
      return this.defaultEngine;
    }

    // 2. Secondary Provider Fallback
    if (process.env.GEMINI_API_KEY) {
      this.defaultEngine = new GeminiReasoningProvider(
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_REASONING_MODEL || "gemini-flash-lite-latest"
      );
      return this.defaultEngine;
    }

    if (process.env.OPENAI_API_KEY) {
      this.defaultEngine = new OpenAIReasoningProvider(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_REASONING_MODEL || "gpt-4o-mini"
      );
      return this.defaultEngine;
    }

    // 3. In Test/Offline Mode, allow TestReasoningProvider
    if (isTestEnv) {
      this.defaultEngine = new TestReasoningProvider();
      return this.defaultEngine;
    }

    // 4. In Production/Runtime without valid provider, throw explicit AI_UNAVAILABLE error
    throw new Error(
      "AI_UNAVAILABLE: Realtime AI reasoning is not configured. Configure GEMINI_API_KEY or OPENAI_API_KEY in the server environment."
    );
  }

  public static setEngine(engine: IProsisReasoningEngine | null): void {
    this.defaultEngine = engine;
  }
}
