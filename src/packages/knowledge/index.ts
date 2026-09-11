/**
 * @prosis/knowledge - Scoped Company Knowledge & RAG Engine
 * Ingests documents, policies, FAQs, and product manuals with strict tenant and permission scoping.
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: "policy" | "sop" | "product_doc" | "faq" | "financial";
  content: string;
  orgScope: string;
  productScope?: string;
  requiredPermissions: string[];
  tags: string[];
  createdAt: string;
}

export interface KnowledgeMatch {
  document: KnowledgeDocument;
  snippet: string;
  relevanceScore: number;
}

class KnowledgeService {
  private documents: Map<string, KnowledgeDocument> = new Map();

  constructor() {
    this.seedDefaultKnowledge();
  }

  private seedDefaultKnowledge() {
    this.addDocument({
      title: "Seatbooking Escalation & Declining Cover Protocol",
      category: "sop",
      content:
        "When any partner restaurant experiences a weekly booking trajectory decrease exceeding 20%, Prosis must alert the executive operating desk, identify the root causes (daypart, cover size, local disruptions), and propose an automated re-engagement campaign to the general manager.",
      orgScope: "org_acme_corp",
      productScope: "prod_seatbooking_01",
      requiredPermissions: ["seatbooking.read"],
      tags: ["decline", "occupancy", "alert", "protocol"],
    });

    this.addDocument({
      title: "VIP Customer Handling & Table Voiding Policy",
      category: "policy",
      content:
        "VIP guest reservations require manual verification before cancellation. In case of emergency cancellations, an immediate notification is sent to the shift captain. Guest cancellation fees are waived for Gold and Platinum corporate tier accounts.",
      orgScope: "org_acme_corp",
      productScope: "prod_seatbooking_01",
      requiredPermissions: ["seatbooking.read"],
      tags: ["vip", "cancellation", "policy", "refund"],
    });

    this.addDocument({
      title: "Outbound Marketing Campaign Guardrails",
      category: "policy",
      content:
        "Outbound communications to restaurant managers must be queued as drafts with clear rationale and expected cover recovery targets. Dispatches can never occur autonomously without human-in-the-loop authorization.",
      orgScope: "org_acme_corp",
      productScope: "prod_seatbooking_01",
      requiredPermissions: ["seatbooking.communications.send"],
      tags: ["outbound", "email", "campaign", "guardrails", "approval"],
    });
  }

  public addDocument(
    doc: Omit<KnowledgeDocument, "id" | "createdAt">
  ): KnowledgeDocument {
    const id = `kb_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fullDoc: KnowledgeDocument = {
      ...doc,
      id,
      createdAt: new Date().toISOString(),
    };
    this.documents.set(id, fullDoc);
    return fullDoc;
  }

  public query(params: {
    query: string;
    orgScope: string;
    productScope?: string;
    userPermissions: string[];
    limit?: number;
  }): KnowledgeMatch[] {
    const terms = params.query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches: KnowledgeMatch[] = [];

    for (const doc of this.documents.values()) {
      // 1. Organization isolation
      if (doc.orgScope !== params.orgScope) continue;

      // 2. Product scoping
      if (params.productScope && doc.productScope && doc.productScope !== params.productScope) {
        continue;
      }

      // 3. Permission checks
      const hasPermissions = doc.requiredPermissions.every((perm) =>
        params.userPermissions.includes(perm)
      );
      if (!hasPermissions) continue;

      // 4. Keyword & lexical relevance score
      const docText = `${doc.title} ${doc.content} ${doc.tags.join(" ")}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (docText.includes(term)) {
          score += 1.0;
        }
      }

      if (score > 0) {
        matches.push({
          document: doc,
          snippet: doc.content.substring(0, 220) + (doc.content.length > 220 ? "..." : ""),
          relevanceScore: score / (terms.length || 1),
        });
      }
    }

    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, params.limit || 3);
  }
}

export const Knowledge = new KnowledgeService();
export * from "./github-repository-engine";

