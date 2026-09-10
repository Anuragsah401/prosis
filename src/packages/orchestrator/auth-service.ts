/**
 * @prosis/orchestrator - Server-Side Authentication & Identity Service
 * Resolves caller identity, establishes tenant scoping, and enforces zero-trust
 * on any client-provided identity, role, or permission parameters.
 */

import { UserContext, OrganizationContext } from "../sdk";
import { TrustedExecutionContext } from "./tool-gateway-types";

export const AUTH_MODE = "development";

export interface AuthenticatedSession {
  user: UserContext;
  organization: OrganizationContext;
  allowedVenues: string[];
  sessionToken: string;
  expiresAt: string;
}

// Authoritative Server-Side User Directory (Single Source of Truth)
const SERVER_USER_DIRECTORY: Record<string, { user: UserContext; orgId: string; allowedVenues: string[] }> = {
  // 1. Executive Owner
  "user_director_01": {
    user: {
      id: "user_director_01",
      name: "Operations Director",
      email: "director@acme-hospitality.com",
      role: "owner",
      permissions: [
        "seatbooking.read",
        "seatbooking.reservations.write",
        "seatbooking.communications.send",
        "seatbooking.admin",
        "analytics.read",
      ],
    },
    orgId: "org_acme_corp",
    allowedVenues: ["cantina_bella", "verdant_bistro", "latelier_lumiere", "kuro_omakase", "aura_rooftop"],
  },

  // 2. Standard Venue Manager (Restricted permissions, specific venues only)
  "user_manager_cantina": {
    user: {
      id: "user_manager_cantina",
      name: "Elena Rostova",
      email: "elena@cantinabella.it",
      role: "manager",
      permissions: ["seatbooking.read"],
    },
    orgId: "org_acme_corp",
    allowedVenues: ["cantina_bella"],
  },

  // 3. Unauthorized / Guest User (Zero permissions)
  "user_unauthorized_guest": {
    user: {
      id: "user_unauthorized_guest",
      name: "External Auditor",
      email: "auditor@external.com",
      role: "member",
      permissions: [],
    },
    orgId: "org_acme_corp",
    allowedVenues: [],
  },

  // 4. Foreign Organization User (Different Tenant)
  "user_foreign_tenant": {
    user: {
      id: "user_foreign_tenant",
      name: "Foreign Operator",
      email: "foreign@rival-hospitality.com",
      role: "owner",
      permissions: ["seatbooking.read", "analytics.read"],
    },
    orgId: "org_rival_group",
    allowedVenues: ["rival_bistro"],
  },
};

const SERVER_ORGANIZATIONS: Record<string, OrganizationContext> = {
  org_acme_corp: {
    id: "org_acme_corp",
    name: "Acme Hospitality Group",
    plan: "enterprise",
  },
  org_rival_group: {
    id: "org_rival_group",
    name: "Rival Hospitality Ltd",
    plan: "growth",
  },
};

// Authoritative Session Token Store
const ACTIVE_SESSIONS: Map<string, AuthenticatedSession> = new Map([
  [
    "sess_live_director_token",
    {
      user: SERVER_USER_DIRECTORY["user_director_01"].user,
      organization: SERVER_ORGANIZATIONS["org_acme_corp"],
      allowedVenues: SERVER_USER_DIRECTORY["user_director_01"].allowedVenues,
      sessionToken: "sess_live_director_token",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
  [
    "sess_live_manager_token",
    {
      user: SERVER_USER_DIRECTORY["user_manager_cantina"].user,
      organization: SERVER_ORGANIZATIONS["org_acme_corp"],
      allowedVenues: SERVER_USER_DIRECTORY["user_manager_cantina"].allowedVenues,
      sessionToken: "sess_live_manager_token",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
  [
    "sess_unauthorized_guest_token",
    {
      user: SERVER_USER_DIRECTORY["user_unauthorized_guest"].user,
      organization: SERVER_ORGANIZATIONS["org_acme_corp"],
      allowedVenues: [],
      sessionToken: "sess_unauthorized_guest_token",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
  [
    "sess_foreign_tenant_token",
    {
      user: SERVER_USER_DIRECTORY["user_foreign_tenant"].user,
      organization: SERVER_ORGANIZATIONS["org_rival_group"],
      allowedVenues: SERVER_USER_DIRECTORY["user_foreign_tenant"].allowedVenues,
      sessionToken: "sess_foreign_tenant_token",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
]);

// Authoritative Tenant Venue Allocation
const ORG_VENUES: Record<string, string[]> = {
  org_acme_corp: ["cantina_bella", "verdant_bistro", "latelier_lumiere", "kuro_omakase", "aura_rooftop"],
  org_rival_group: ["rival_bistro"],
};

export class AuthService {
  /**
   * Resolves the authenticated session from an HTTP request header or token.
   * NEVER trusts client body variables (role, permissions, organizationId).
   */
  public static resolveSession(headers: {
    authorization?: string | null;
    sessionToken?: string | null;
  }): AuthenticatedSession | null {
    let token = headers.sessionToken;

    if (!token && headers.authorization) {
      if (headers.authorization.startsWith("Bearer ")) {
        token = headers.authorization.slice(7).trim();
      } else {
        token = headers.authorization.trim();
      }
    }

    // Default development fallback session if no token provided in development mode
    if (!token) {
      if (AUTH_MODE === "development" || process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        return ACTIVE_SESSIONS.get("sess_live_director_token") || null;
      }
      return null;
    }

    const session = ACTIVE_SESSIONS.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      ACTIVE_SESSIONS.delete(token);
      return null;
    }

    return session;
  }

  /**
   * Directly authenticates a user by ID (for automated tests or internal service calls).
   */
  public static authenticateById(userId: string): AuthenticatedSession | null {
    const record = SERVER_USER_DIRECTORY[userId];
    if (!record) return null;

    const org = SERVER_ORGANIZATIONS[record.orgId];
    if (!org) return null;

    return {
      user: { ...record.user },
      organization: { ...org },
      allowedVenues: [...record.allowedVenues],
      sessionToken: `sess_ephemeral_${userId}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  /**
   * Checks whether the given session has access to a specific venue.
   * Strict Tenant Boundary: Venues outside the session's organization are always denied.
   */
  public static canAccessVenue(session: AuthenticatedSession, venueId: string): boolean {
    const orgVenues = ORG_VENUES[session.organization.id] || [];

    // 1. Strict Tenant Isolation: Venue must belong to the user's organization
    if (!orgVenues.includes(venueId)) {
      return false;
    }

    // 2. Owners have universal access within their own organization
    if (session.user.role === "owner") {
      return true;
    }

    // 3. Non-owners are restricted to their explicitly allowed venues
    return session.allowedVenues.includes(venueId);
  }

  /**
   * Constructs a TrustedExecutionContext from a verified AuthenticatedSession.
   * Forces server-side autonomy level (level 1) and authoritative permissions.
   * Any client-provided role, permissions, or autonomy level are discarded.
   */
  public static toTrustedContext(
    session: AuthenticatedSession,
    sessionId: string,
    requestId: string
  ): TrustedExecutionContext {
    return {
      userId: session.user.id,
      organizationId: session.organization.id,
      role: session.user.role,
      permissions: [...session.user.permissions],
      allowedVenues: [...session.allowedVenues],
      sessionId: sessionId || "sess_default",
      requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      autonomyLevel: 1, // Server-enforced Level 1
    };
  }
}
