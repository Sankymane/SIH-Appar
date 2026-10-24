import React, { useState } from "react";
import { verifyAPAAR, toggleVerification } from "../api";
import { QRCodeSVG } from "qrcode.react";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Award,
  Hash,
  ExternalLink,
  Lock
} from "lucide-react";

interface VerificationPortalProps {
  onOpenCertificate: (student: any) => void;
  userRole: string;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  onOpenCertificate,
  userRole,
}) => {
  const [apaarInput, setApaarInput] = useState<string>("778899001122");
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleVerify = async (idToVerify?: string) => {
    const target = idToVerify || apaarInput;
    if (!target.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setRecord(null);

    try {
      const res = await verifyAPAAR(target.trim());
      setRecord(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify APAAR ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (id: string) => {
    setApaarInput(id);
    handleVerify(id);
  };

  const verificationUrl = record
    ? `${window.location.origin}/api/v1/verify/${record.apaar_id}`
    : "";

  return (
    <div style={{ maxWidth: "1000px", margin: "24px auto", padding: "0 20px" }}>
      {/* Portal Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f0f7ff", padding: "6px 16px", borderRadius: "20px", color: "#0B2265", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
          <ShieldCheck size={14} /> National Academic Registry Verification Engine
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0B2265", marginBottom: "6px" }}>
          APAAR ID Student Identity Verification & Verifiable Records
        </h1>
        <p style={{ fontSize: "13px", color: "#4b5563", maxWidth: "680px", margin: "0 auto" }}>
          Instant, tamper-evident digital verification of AICTE student credentials linked to their 12-digit Automated Permanent Academic Account Registry (APAAR) identifier.
        </p>
      </div>

      {/* Search Input Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ position: "relative", flexGrow: 1 }}>
            <input
              type="text"
              className="filter-input"
              style={{ paddingLeft: "36px", fontSize: "15px", height: "44px", fontWeight: 600 }}
              placeholder="Enter 12-digit APAAR ID (e.g. 778899001122)"
              value={apaarInput}
              onChange={(e) => setApaarInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <Search size={18} style={{ position: "absolute", left: "12px", top: "13px", color: "#64748b" }} />
          </div>
          <button
            onClick={() => handleVerify()}
            style={{
              background: "var(--aicte-orange)",
              color: "#ffffff",
              border: "none",
              padding: "0 24px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Record"}
          </button>
        </div>

        {/* Quick Sample Chips for Test Evaluation */}
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "11px" }}>
          <span style={{ color: "#64748b", fontWeight: 600 }}>Test Edge Cases:</span>
          <button
            style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "12px", cursor: "pointer", fontWeight: 700 }}
            onClick={() => handleSampleClick("778899001122")}
          >
            Cross-Institution Conflict: 778899001122
          </button>
          <button
            style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "2px 8px", borderRadius: "12px", cursor: "pointer", fontWeight: 700 }}
            onClick={() => handleSampleClick("889911223344")}
          >
            Duplicate in Same College: 889911223344
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #f87171",
            color: "#991b1b",
            padding: "16px",
            borderRadius: "6px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <ShieldAlert size={20} />
          <div>
            <div style={{ fontWeight: 700 }}>Verification Failed:</div>
            <div style={{ fontSize: "12px" }}>{errorMsg}</div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VERIFIABLE DIGITAL RECORD CARD
          ------------------------------------------------------------- */}
      {record && (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #0B2265",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {/* Card Top Banner */}
          <div
            style={{
              background: record.is_valid ? "#166534" : "#b91c1c",
              color: "#ffffff",
              padding: "14px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {record.is_valid ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>
                  {record.is_valid ? "AUTHENTICATED & VERIFIED RECORD" : "POLICY DISCREPANCY DETECTED"}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.9 }}>
                  Status: <b>{record.verification_status}</b>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
              AICTE National Registry
            </div>
          </div>

          {/* Card Details Body */}
          <div style={{ padding: "24px" }}>
            {record.validation_remarks && (
              <div
                style={{
                  background: record.is_valid ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${record.is_valid ? "#bbf7d0" : "#fecaca"}`,
                  color: record.is_valid ? "#166534" : "#991b1b",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  marginBottom: "20px",
                  fontWeight: 600,
                }}
              >
                <b>Registry Remark:</b> {record.validation_remarks}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
              {/* Left Column: Student & Academic Details */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>STUDENT FULL NAME</div>
                    <div style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265" }}>{record.student_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>ROLL / ENROLLMENT NO</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#d97706" }}>{record.enrollment_no}</div>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>ENROLLED INSTITUTION</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{record.college_name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>AICTE ID: {record.aicte_id}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>COURSE & DEPARTMENT</div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{record.department} ({record.level})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>ACADEMIC BATCH</div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{record.admission_year}</div>
                  </div>
                </div>

                {/* Digital Verification Proof */}
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#0B2265", marginBottom: "4px" }}>
                    Cryptographic SHA-256 Signature (Tamper-Proof Proof):
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all", color: "#334155" }}>
                    {record.digital_signature_hash}
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code & Verification Badges */}
              <div style={{ textAlign: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "24px" }}>
                <div style={{ background: "#ffffff", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", display: "inline-block", marginBottom: "10px" }}>
                  <QRCodeSVG value={verificationUrl} size={110} level="M" />
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "16px", fontWeight: 600 }}>
                  Scan to Validate on Live AICTE Registry
                </div>

                {/* Trust Badges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Aadhaar Verified
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> DigiLocker Synced
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#0B2265", fontWeight: 600 }}>
                    <ShieldCheck size={14} /> National Academic Depository (NAD)
                  </div>
                </div>

                {/* Action button */}
                <div style={{ marginTop: "16px" }}>
                  <button
                    onClick={() => onOpenCertificate(record)}
                    style={{
                      width: "100%",
                      background: "var(--aicte-orange)",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Award size={13} /> View Degree Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
