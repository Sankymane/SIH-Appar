import React from "react";
import { X, FileSpreadsheet, Download, FileText, CheckCircle2 } from "lucide-react";

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aicteId?: string;
  collegeName?: string;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  aicteId,
  collegeName,
}) => {
  if (!isOpen) return null;

  const handleDownload = (type: "students" | "compliance", format: "xlsx" | "csv") => {
    const q = new URLSearchParams();
    if (aicteId) q.append("aicte_id", aicteId);
    q.append("format", format);

    const url = `/api/v1/reports/export/${type}?${q.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileSpreadsheet size={16} />
            <h3 style={{ fontSize: "14px", fontWeight: 700 }}>
              AICTE Regulatory & Policy Compliance Reports
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>
            Generate and export official institutional audit documentation for regulatory oversight, AICTE annual approvals, and APAAR verification audits.
          </p>

          {/* Report 1: Student Master Roster */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ background: "#f0fdf4", color: "#166534", padding: "10px", borderRadius: "6px" }}>
                <FileSpreadsheet size={24} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0B2265" }}>
                  Student Master APAAR Roster
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 12px" }}>
                  Includes student-level data, 12-digit APAAR IDs, quota allocations (TFW/PMSSS/NRI), validation remarks, and digital cryptographic signatures.
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleDownload("students", "xlsx")}
                    style={{
                      background: "var(--aicte-blue)",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Download size={11} /> Export Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleDownload("students", "csv")}
                    style={{
                      background: "#e2e8f0",
                      color: "#334155",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Download size={11} /> Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report 2: Intake Compliance Audit */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ background: "#fef3c7", color: "#92400e", padding: "10px", borderRadius: "6px" }}>
                <FileText size={24} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0B2265" }}>
                  Intake Capacity & Policy Compliance Audit
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 12px" }}>
                  Official audit comparison between AICTE Sanctioned Intake vs. Actual Admitted Students, supernumerary caps, and breach flags.
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleDownload("compliance", "xlsx")}
                    style={{
                      background: "var(--aicte-orange)",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Download size={11} /> Export Compliance (.xlsx)
                  </button>
                  <button
                    onClick={() => handleDownload("compliance", "csv")}
                    style={{
                      background: "#e2e8f0",
                      color: "#334155",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Download size={11} /> Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", marginTop: "16px" }}>
            <button
              onClick={onClose}
              style={{
                background: "#e2e8f0",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
