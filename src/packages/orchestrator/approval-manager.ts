/**
 * @prosis/orchestrator - Human-In-The-Loop Approval System
 * Intercepts high-impact, destructive, external communication, or financial tools
 * and requires explicit verification before dispatch.
 */

import { ApprovalPayload } from "../tools";

export interface ApprovalRequest extends ApprovalPayload {
  id: string;
  conversationId: string;
  runId: string;
  productId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

type ApprovalListener = (request: ApprovalRequest) => void;

class ApprovalManagerService {
  private requests: Map<string, ApprovalRequest> = new Map();
  private listeners: Set<ApprovalListener> = new Set();

  public createRequest(
    payload: ApprovalPayload,
    meta: { conversationId: string; runId: string; productId: string }
  ): ApprovalRequest {
    const id = `appr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const request: ApprovalRequest = {
      ...payload,
      id,
      conversationId: meta.conversationId,
      runId: meta.runId,
      productId: meta.productId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    this.requests.set(id, request);
    this.notify(request);
    return request;
  }

  public get(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  public getPending(): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter(
      (r) => r.status === "PENDING"
    );
  }

  public getAll(): ApprovalRequest[] {
    return Array.from(this.requests.values()).sort((a, b) =>
      b.createdAt > a.createdAt ? 1 : -1
    );
  }

  public updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "EXECUTED",
    resolvedBy = "Human Operator"
  ): ApprovalRequest | null {
    const request = this.requests.get(id);
    if (!request) return null;

    request.status = status;
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = resolvedBy;

    this.notify(request);
    return request;
  }

  public subscribe(listener: ApprovalListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(request: ApprovalRequest) {
    this.listeners.forEach((listener) => {
      try {
        listener(request);
      } catch (err) {
        console.error("[ApprovalManager] Error notifying listener:", err);
      }
    });
  }
}

export const ApprovalManager = new ApprovalManagerService();

