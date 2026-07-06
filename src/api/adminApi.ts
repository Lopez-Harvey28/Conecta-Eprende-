import type { RiskReport } from "../lib/identity";
import { apiRequest } from "./http";

export const adminApi = {
  getRiskReports:()=>apiRequest<RiskReport[]>("/api/admin/risk-reports"),
  updateRiskReportStatus:(reportId:string,status:RiskReport["status"])=>apiRequest<RiskReport>(`/api/admin/risk-reports/${encodeURIComponent(reportId)}`,{method:"PATCH",body:JSON.stringify({status})}),
};
