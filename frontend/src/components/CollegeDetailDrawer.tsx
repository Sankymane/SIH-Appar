import React, { useEffect, useState } from "react";
import { fetchInstitutionDetail } from "../api";
import { CollegeDetail } from "../types";
import {
  X,
  Building,
  Globe,
  Mail,
  Phone,
  User,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink
} from "lucide-react";

interface CollegeDetailDrawerProps {
  aicteId: string;
  onClose: () => void;
  onDirectLogin: (aicte_id: string, name: string) => void;
}

export const CollegeDetailDrawer: React.FC<CollegeDetailDrawerProps> = ({
  aicteId,
  onClose,
  onDirectLogin,
}) => {
  const [detail, setDetail] = useState<CollegeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchInstitutionDetail(aicteId)
      .then((data) => setDetail(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [aicteId]);

  if (!aicteId) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div style={{ fontSize: "11px", color: "#f7941d", fontWeight: 700 }}>
              AICTE APPROVED INSTITUTION PROFILE
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0", lineHeight: 1.3 }}>
              {detail ? detail.name : aicteId}
            </h2>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              AICTE Permanent ID: <b>{aicteId}</b>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#f75700" }}>
              Loading institution profile & intake capacity data...
            </div>
          ) : !detail ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#d32f2f" }}>
              Institution details not found.
            </div>
          ) : (
            <>
              {/* Institution Contact & Info Card */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265", marginBottom: "10px" }}>
                  Institutional Contact & Overview
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "12px" }}>
                  <div style={{ wordBreak: "break-word" }}>
                    <span style={{ color: "#64748b" }}>Type:</span> <b>{detail.institution_type}</b>
                  </div>
                  <div style={{ wordBreak: "break-word" }}>
                    <span style={{ color: "#64748b" }}>District:</span> <b>{detail.district}, {detail.state}</b>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Women Only:</span> <b>{detail.women === "Y" ? "Yes" : "No"}</b>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Minority:</span> <b>{detail.minority === "Y" ? "Yes" : "No"}</b>
                  </div>
                </div>

                <div style={{ marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "10px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", wordBreak: "break-all" }}>
                    <Globe size={13} color="#0B2265" style={{ flexShrink: 0 }} />
                    <a
                      href={detail.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#009688", textDecoration: "none", fontWeight: 600, wordBreak: "break-all" }}
                    >
                      {detail.website} <ExternalLink size={10} style={{ display: "inline" }} />
                    </a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", wordBreak: "break-all" }}>
                    <Mail size={13} color="#0B2265" style={{ flexShrink: 0 }} />
                    <span>{detail.contact_email || "registrar@institution.edu.in"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={13} color="#0B2265" style={{ flexShrink: 0 }} />
                    <span>{detail.contact_phone || "+91 98765 43210"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", wordBreak: "break-word" }}>
                    <User size={13} color="#0B2265" style={{ flexShrink: 0 }} />
                    <span>Nodal Officer: <b>{detail.nodal_officer_name}</b> ({detail.nodal_officer_mobile})</span>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  VISUAL SLIDE / CHART: Approved Intake vs Actual Students Admitted
                  ------------------------------------------------------------- */}
              <div
                style={{
                  background: "#ffffff",
                  border: "2px solid #0B2265",
                  borderRadius: "6px",
                  padding: "18px",
                  marginBottom: "20px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <BarChart2 size={16} color="#0B2265" />
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0B2265" }}>
                      Approved Intake vs. Actual Students Admitted
                    </h3>
                  </div>
                  <span
                    style={{
                      background: detail.total_enrolled_students > detail.total_approved_intake ? "#fee2e2" : "#dcfce7",
                      color: detail.total_enrolled_students > detail.total_approved_intake ? "#991b1b" : "#166534",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {detail.total_enrolled_students > detail.total_approved_intake ? "Intake Exceeded" : "Compliant"}
                  </span>
                </div>

                {/* Overall Progress Gauge */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>
                      Total Sanctioned Capacity: <b>{detail.total_approved_intake}</b> seats
                    </span>
                    <span>
                      Enrolled: <b>{detail.total_enrolled_students}</b> students (
                      {detail.total_approved_intake > 0
                        ? Math.round((detail.total_enrolled_students / detail.total_approved_intake) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "14px", background: "#e2e8f0", borderRadius: "7px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, detail.total_approved_intake > 0 ? (detail.total_enrolled_students / detail.total_approved_intake) * 100 : 0)}%`,
                        background: detail.total_enrolled_students > detail.total_approved_intake ? "#dc2626" : "#009688",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Department-wise Visual Comparison Bars */}
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                  Course-by-Course Capacity Utilization
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {detail.courses.slice(0, 6).map((crs) => {
                    const admitted = crs.enrolled_count + crs.supernumerary_count;
                    const isExceeded = admitted > crs.approved_intake;
                    const pct = crs.approved_intake > 0 ? Math.round((admitted / crs.approved_intake) * 100) : 0;

                    return (
                      <div key={crs.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", fontSize: "12px", marginBottom: "3px" }}>
                          <span style={{ fontWeight: 600, color: "#1e293b", wordBreak: "break-word", flex: "1 1 200px" }}>{crs.department}</span>
                          <span style={{ color: isExceeded ? "#dc2626" : "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {admitted} / {crs.approved_intake} ({pct}%)
                          </span>
                        </div>

                        {/* Dual Bar (Sanctioned vs Admitted) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flexGrow: 1, height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, pct)}%`,
                                background: isExceeded ? "#ef4444" : "#0B2265",
                              }}
                            />
                          </div>
                          {isExceeded && (
                            <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                              <AlertTriangle size={10} /> Over-Intake
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                          Regular: {crs.enrolled_count} | Supernumerary: {crs.supernumerary_count} / {crs.supernumerary_intake}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Login Call-To-Action Button */}
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button
                  style={{
                    width: "100%",
                    background: "var(--aicte-orange)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                  onClick={() => {
                    onDirectLogin(detail.aicte_id, detail.name);
                    onClose();
                  }}
                >
                  <Lock size={14} /> Log In as this Institute to Manage APAAR Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
