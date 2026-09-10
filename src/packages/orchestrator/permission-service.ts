/**
 * @prosis/orchestrator - Permission Service
 * Enforces strict server-side Role-Based Access Control (RBAC) and authorization.
 * Protects secrets, validates user scopes against required tool and product permissions,
 * and records unauthorized execution attempts into the audit trail.
 */

import { UserContext } from "../sdk";
import { AuditTrail } from "./audit-trail";

export interface PermissionCheckResult {
  authorized: boolean;
  missingPermissions: string[];
  reason?: string;
}

export class PermissionService {
  /**
   * Evaluates whether a user context possesses all required permissions for a given operation.
   */
  public static checkPermission(
    user: UserContext,
    requiredPermissions: string[],
    resourceName = "tool"
  ): PermissionCheckResult {
    // Owners have universal superuser access
    if (user.role === "owner") {
      return { authorized: true, missingPermissions: [] };
    }

    // Admins have broad administrative scope
    if (user.role === "admin") {
      const missing = requiredPermissions.filter(
        (perm) =>
          !user.permissions.includes(perm) &&
          !user.permissions.includes(perm.split(".")[0] + ".admin") &&
          !user.permissions.includes("*")
      );
      if (missing.length === 0) {
        return { authorized: true, missingPermissions: [] };
      }
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !user.permissions.includes(perm) && !user.permissions.includes("*")
    );

    if (missingPermissions.length > 0) {
      return {
        authorized: false,
        missingPermissions,
        reason: `User '${user.name}' (${user.role}) lacks required permission(s): ${missingPermissions.join(
          ", "
        )} for ${resourceName}.`,
      };
    }

    return { authorized: true, missingPermissions: [] };
  }

  /**
   * Enforces permissions server-side, logging an unauthorized audit entry if rejected.
   */
  public static enforce(
    user: UserContext,
    requiredPermissions: string[],
    meta: {
      toolName: string;
      productId: string;
      conversationId: string;
      runId: string;
      organizationId: string;
    }
  ): boolean {
    const check = this.checkPermission(user, requiredPermissions, meta.toolName);

    if (!check.authorized) {
      console.warn(`[PermissionService] ACCESS DENIED: ${check.reason}`);
      AuditTrail.record({
        conversationId: meta.conversationId,
        runId: meta.runId,
        userId: user.id,
        organizationId: meta.organizationId,
        toolName: meta.toolName,
        productId: meta.productId,
        parameters: {},
        requiresApproval: false,
        approvalStatus: "not_required",
        executionStatus: "aborted",
        durationMs: 0,
        error: check.reason,
        resultSummary: `Access Denied: Missing permissions [${check.missingPermissions.join(", ")}]`,
      });
      return false;
    }

    return true;
  }

  /**
   * Sanitizes objects to prevent leaking environmental or system secrets to the AI model.
   */
  public static sanitizeSecrets<T>(data: T): T {
    if (!data || typeof data !== "object") return data;

    const sensitiveKeys = [
      "password",
      "secret",
      "apikey",
      "token",
      "authorization",
      "privatekey",
      "credential",
    ];

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeSecrets(item)) as unknown as T;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));
      if (isSensitive) {
        sanitized[key] = "[REDACTED_SECRET]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeSecrets(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }
}

