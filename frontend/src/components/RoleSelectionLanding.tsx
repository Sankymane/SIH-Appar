import React from "react";
import { GraduationCap, Building2, ShieldCheck, ArrowRight, ShieldAlert, Sparkles, Database, CheckCircle2, Search } from "lucide-react";

interface RoleSelectionLandingProps {
  onSelectRole: (role: "STUDENT" | "INSTITUTE" | "STAKEHOLDER") => void;
  onExplorePublicDirectory: () => void;
}

export const RoleSelectionLanding: React.FC<RoleSelectionLandingProps> = ({
  onSelectRole,
  onExplorePublicDirectory,
}) => {
  return (
    <div style={{ background: "#f8fafc", minHeight: "85vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Top Header Banner */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#e0f2fe",
              border: "1px solid #7dd3fc",
              color: "#0369a1",
              padding: "6px 16px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "16px",
              letterSpacing: "0.5px"
            }}
          >
            <ShieldCheck size={16} color="#0284c7" />
            GOVERNMENT OF INDIA • MINISTRY OF EDUCATION • AICTE
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 900,
              color: "#0B2265",
              lineHeight: 1.25,
              marginBottom: "12px",
              letterSpacing: "-0.5px"
            }}
          >
            National APAAR ID Student Data Management & Verification Platform
          </h1>
          
          <p style={{ fontSize: "15px", color: "#475569", maxWidth: "800px", margin: "0 auto 16px auto", lineHeight: 1.6 }}>
            Unified Automated Permanent Academic Account Registry (APAAR) ecosystem for AICTE-approved institutions, 
            verifiable student credentialing, automated intake compliance, and AI predictive forecasting.
          </p>

          {/* Privacy & Global OTP Notice */}
          <div
            style={{
              display: "inline-block",
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              color: "#92400e",
              padding: "8px 20px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            🔒 <strong>Strict Data Privacy Enforced:</strong> All security OTPs across all portals are routed strictly to authorized development mobile: <strong>+91 8767434172</strong>.
          </div>
        </div>

        {/* 3 Distinct Portal Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "36px"
          }}
        >
          {/* 1. Student Login Portal */}
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s, border-color 0.2s",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                background: "linear-gradient(90deg, #3b82f6, #0B2265)"
              }}
            />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1d4ed8"
                  }}
                >
                  <GraduationCap size={30} />
                </div>
                <span
                  style={{
                    background: "#dbeafe",
                    color: "#1e40af",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    textTransform: "uppercase"
                  }}
                >
                  Student Portal
                </span>
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2265", marginBottom: "8px" }}>
                Student Login
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
                For students with a 12-digit APAAR ID to view verified academic credentials, DigiLocker ABC card, and report data discrepancies.
              </p>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>DigiLocker Academic Bank of Credits (ABC) Card</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Verified institutional enrollment & earned credits</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span><strong>"Raise a Remark"</strong> grievance reporting</span>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "14px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                Sample APAAR: <strong>126430259751</strong> (Sankalp Hemant Mane)
              </div>

              <button
                onClick={() => onSelectRole("STUDENT")}
                style={{
                  width: "100%",
                  background: "#0B2265",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Access Student Portal <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 2. Institutional Login Portal */}
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #FF5722",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 10px 25px -5px rgba(255,87,34,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                background: "linear-gradient(90deg, #FF5722, #f97316)"
              }}
            />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "10px",
                    background: "#fff7ed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ea580c"
                  }}
                >
                  <Building2 size={30} />
                </div>
                <span
                  style={{
                    background: "#ffedd5",
                    color: "#c2410c",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    textTransform: "uppercase"
                  }}
                >
                  Colleges & Universities
                </span>
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2265", marginBottom: "8px" }}>
                Institutional Login
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
                For AICTE-approved institutions to upload cohorts, validate APAAR IDs, monitor sanctioned intake, and generate verifiable degrees.
              </p>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Instant autocomplete institute search & OTP dispatch</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Automated validation engine (duplicates, dual enrollment)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Verifiable degree certificate generation with QR code</span>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "14px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                Search any college (e.g. "IIT Bombay", "COEP", "St. Xavier's")
              </div>

              <button
                onClick={() => onSelectRole("INSTITUTE")}
                style={{
                  width: "100%",
                  background: "#FF5722",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Institute Secure Login <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 3. Stakeholder (AICTE) Login Portal */}
          <div
            style={{
              background: "#ffffff",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "6px",
                background: "linear-gradient(90deg, #7c3aed, #4f46e5)"
              }}
            />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "10px",
                    background: "#f5f3ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7c3aed"
                  }}
                >
                  <ShieldAlert size={30} />
                </div>
                <span
                  style={{
                    background: "#ede9fe",
                    color: "#6d28d9",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    textTransform: "uppercase"
                  }}
                >
                  Regulator Portal
                </span>
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2265", marginBottom: "8px" }}>
                Stakeholder (AICTE) Login
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
                For AICTE Regulators & Ministry of Education to monitor compliance, inspect phone registry, manage colleges with 2FA, and review predictive forecasting models.
              </p>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Registered phone directory mapping colleges to +91 8767434172</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Highlighted alerts for intake breaches & duplicate APAARs</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155" }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>Time-series intake forecasting & 30% surge early warnings</span>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "14px",
                  border: "1px dashed #cbd5e1"
                }}
              >
                Secondary OTP required for adding/removing colleges
              </div>

              <button
                onClick={() => onSelectRole("STAKEHOLDER")}
                style={{
                  width: "100%",
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                Stakeholder Bureau Login <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Public Explorer Link for transparency */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onExplorePublicDirectory}
            style={{
              background: "transparent",
              border: "1px solid #cbd5e1",
              color: "#475569",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Search size={15} />
            Browse Public Approved Institutions Directory (Public View)
          </button>
        </div>

      </div>
    </div>
  );
};
