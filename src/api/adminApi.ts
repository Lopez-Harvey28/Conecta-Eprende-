import { apiRequest } from "./http";

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiRequest<{ success: boolean; data: T; error?: string }>(path, init);
  if (!response.success) throw new Error(response.error || "Error administrativo");
  return response.data;
}

export type AdminRiskReportStatus = "OPEN" | "UNDER_REVIEW" | "DISMISSED" | "ESCALATED" | "ACTION_TAKEN";

export interface AdminRiskReport {
  id: string;
  providerId: string;
  provider: {
    id: string;
    displayName: string;
    slug: string;
    status: "ACTIVE" | "SUSPENDED" | "BANNED" | string;
    statusReason: string | null;
    suspendedUntil: string | null;
    city: string;
    category: string;
  };
  riskScore: number;
  suspiciousCyclesCount: number;
  avgSearchTimeSeconds: number | null;
  avgRequestToCompletionMinutes: number | null;
  avgMessagesPerRequest: number | null;
  newAccountsPercentage: number | null;
  ratingConcentrationScore: number | null;
  status: AdminRiskReportStatus;
  reviewerNotes: string | null;
  recommendedAction: string | null;
  generatedAt: string;
  reviewedAt: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
}

export interface ModerationAuditLog {
  id: string;
  actorUserId: string;
  actor?: { id: string; name: string | null; email: string };
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export const adminApi = {
  getRiskReports: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return adminRequest<AdminRiskReport[]>(`/api/admin/risk-reports${query}`);
  },
  updateRiskReportStatus: (reportId: string, data: { status: AdminRiskReportStatus; reviewerNotes?: string; reason?: string }) =>
    adminRequest<AdminRiskReport>(`/api/admin/risk-reports/${encodeURIComponent(reportId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  escalateRiskReport: (reportId: string, reviewerNotes: string) =>
    adminRequest<AdminRiskReport>(`/api/admin/risk-reports/${encodeURIComponent(reportId)}/escalate`, {
      method: "POST",
      body: JSON.stringify({ reviewerNotes }),
    }),
  suspendProvider: (providerId: string, data: { reason: string; suspendedUntil?: string }) =>
    adminRequest(`/api/admin/providers/${encodeURIComponent(providerId)}/suspend`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  banProvider: (providerId: string, reason: string) =>
    adminRequest(`/api/admin/providers/${encodeURIComponent(providerId)}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  reactivateProvider: (providerId: string, reason: string) =>
    adminRequest(`/api/admin/providers/${encodeURIComponent(providerId)}/reactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getAuditLog: () => adminRequest<ModerationAuditLog[]>("/api/admin/audit-log"),
};
