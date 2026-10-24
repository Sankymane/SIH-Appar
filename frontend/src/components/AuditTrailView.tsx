import React, { useState, useEffect } from "react";
import { fetchAuditTrail } from "../api";
import { AuditLogItem } from "../types";
import { ShieldCheck, History, User, Building, AlertTriangle } from "lucide-react";

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchAuditTrail(1, 30)
      .then((res) => {
        setLogs(res.records || []);
        setTotal(res.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("ALERT") || action.includes("EXCEEDED") || action.includes("VIOLATION")) {
      return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
    }
    if (action.includes("ENROLLED") || action.includes("SUCCESS")) {
      return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
    }
    return { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" };
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "24px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--aicte-blue)", fontSize: "12px", fontWeight: 700 }}>
            <History size={14} /> IMMUTABLE REGULATORY LOGS
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0B2265" }}>
            AICTE Security, RBAC & Audit Trail Engine
          </h1>
          <p style={{ fontSize: "12px", color: "#64748b" }}>
            Chronological audit records tracking every enrollment, status modification, 2FA login, and automated validation breach.
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Total Logged Events:</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0B2265" }}>{total}</div>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
        <table className="aicte-table">
          <thead>
            <tr>
              <th style={{ width: "16%" }}>Timestamp</th>
              <th style={{ width: "20%" }}>Action Triggered</th>
              <th style={{ width: "16%" }}>Actor Role</th>
              <th style={{ width: "16%" }}>Actor ID / Name</th>
              <th style={{ width: "24%" }}>Event Details</th>
              <th style={{ width: "8%" }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#f75700" }}>
                  Loading chronological audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => {
                const badge = getActionBadgeColor(l.action);
                return (
                  <tr key={l.id}>
                    <td style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap" }}>
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: 700,
                          display: "inline-block",
                        }}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: "11px" }}>
                      <span
                        style={{
                          background: l.actor_role === "AICTE_VERIFIER" ? "#0B2265" : "#f1f5f9",
                          color: l.actor_role === "AICTE_VERIFIER" ? "#ffffff" : "#334155",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {l.actor_role}
                      </span>
                    </td>
                    <td style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b" }}>
                      {l.actor_name || l.actor_id}
                    </td>
                    <td style={{ fontSize: "11px", color: "#374151" }}>
                      {l.details}
                    </td>
                    <td style={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>
                      {l.ip_address || "127.0.0.1"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
