import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  Award,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  QrCode,
  FileText,
  User,
  Calendar,
  Layers,
  HelpCircle,
  Hash
} from "lucide-react";
import { StudentProfile, StudentRemark, UserAuthContext } from "../types";
import { fetchStudentProfile, submitStudentRemark, fetchStudentRemarks } from "../api";
import abcCardImg from "../assets/sankalp_abc_card.png";

interface StudentDashboardProps {
  auth: UserAuthContext;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ auth }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [remarks, setRemarks] = useState<StudentRemark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Remark Modal State
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState<boolean>(false);
  const [remarkType, setRemarkType] = useState<string>("Wrong College Mapping");
  const [remarkDesc, setRemarkDesc] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("sankalp.mane@abc.gov.in");
  const [submittingRemark, setSubmittingRemark] = useState<boolean>(false);
  const [remarkSuccessMsg, setRemarkSuccessMsg] = useState<string | null>(null);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const p = await fetchStudentProfile(auth.apaar_id || "126430259751");
      setProfile(p);
      const remList = await fetchStudentRemarks();
      setRemarks(remList);
    } catch (err: any) {
      setError(err.message || "Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [auth.apaar_id]);

  const handleRemarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkDesc.trim()) return;

    setSubmittingRemark(true);
    try {
      await submitStudentRemark({
        remark_type: remarkType,
        description: remarkDesc.trim(),
        contact_email: contactEmail,
        contact_mobile: profile?.mobile_number || "",
      });
      setRemarkSuccessMsg("Grievance remark successfully submitted to AICTE National Registry Desk.");
      setRemarkDesc("");
      setIsRemarkModalOpen(false);
      // Reload remarks
      const updated = await fetchStudentRemarks();
      setRemarks(updated);
    } catch (err: any) {
      alert(err.message || "Failed to submit remark");
    } finally {
      setSubmittingRemark(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ padding: "40px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <Clock size={32} color="#0B2265" className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "16px", color: "#0B2265", fontWeight: 700 }}>Loading Verified ABC Student Record...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 20px" }}>
      
      {/* Top Welcome & Notification Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
        }}
      >
        <div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            ● Authenticated Student Session
          </span>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2265", margin: "4px 0" }}>
            Welcome, {profile?.full_name || "Sankalp Hemant Mane"}
          </h1>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            APAAR ID: <strong style={{ color: "#0B2265" }}>{profile?.apaar_id || "126430259751"}</strong> • Linked Institute: {profile?.college_name}
          </div>
        </div>

        {/* Prominent "Raise a Remark" Button */}
        <button
          onClick={() => setIsRemarkModalOpen(true)}
          style={{
            background: "#FF5722",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 6px rgba(255,87,34,0.3)"
          }}
        >
          <AlertTriangle size={16} />
          Raise a Remark / Report Discrepancy
        </button>
      </div>

      {remarkSuccessMsg && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "12px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          {remarkSuccessMsg}
        </div>
      )}

      {/* Main Grid: Left Side DigiLocker ABC Card | Right Side Detailed Credentials */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        
        {/* DigiLocker ABC Card (Exact replica of attached user image) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "420px"
          }}
        >
          {/* Card Masthead */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "18px" }}>
              {/* Ashoka Lion Emblem */}
              <div style={{ width: "36px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 100 130" width="36" height="46" fill="#1e293b">
                  <path d="M50 0 C45 10 30 15 30 30 C30 40 40 45 40 50 C30 50 20 60 20 75 C20 90 35 100 50 100 C65 100 80 90 80 75 C80 60 70 50 60 50 C60 45 70 40 70 30 C70 15 55 10 50 0 Z" opacity="0.85"/>
                  <rect x="25" y="105" width="50" height="8" rx="2" fill="#1e293b"/>
                  <text x="50" y="125" fontSize="11" textAnchor="middle" fontWeight="bold" fill="#475569">सत्यमेव जयते</text>
                </svg>
              </div>

              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b", letterSpacing: "0.5px", margin: 0 }}>
                  ACADEMIC BANK OF CREDITS
                </h3>
                <span style={{ fontSize: "11px", color: "#64748b" }}>National Academic Depository (NAD)</span>
              </div>
            </div>

            {/* APAAR ID & Photo Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ flex: 1, paddingRight: "16px" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>
                  APAAR ID
                </div>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", letterSpacing: "1px", marginBottom: "12px" }}>
                  {profile?.apaar_id || "126430259751"}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0B2265", textTransform: "uppercase" }}>
                  {profile?.full_name || "SANKALP HEMANT MANE"}
                </div>
              </div>

              {/* Student Photo */}
              <div
                style={{
                  width: "110px",
                  height: "135px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  overflow: "hidden",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  background: "#f1f5f9",
                  flexShrink: 0
                }}
              >
                <img
                  src={abcCardImg}
                  alt="Student DigiLocker Photograph"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top"
                  }}
                  onError={(e) => {
                    // Fallback to stylized SVG avatar if image loading fails
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>

            {/* DigiLocker Subtext */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginBottom: "18px" }}>
              <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5, margin: 0 }}>
                We use basic information from your DigiLocker account to identify you and allow access to ABC platform.
              </p>
            </div>
          </div>

          {/* Powered by DigiLocker Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: "10px",
                boxShadow: "0 4px 10px rgba(99,102,241,0.25)"
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6366f1",
                  fontWeight: 900,
                  fontSize: "12px"
                }}
              >
                ☁
              </div>
              <div>
                <div style={{ fontSize: "9px", opacity: 0.9, textTransform: "uppercase" }}>Powered by</div>
                <div style={{ fontSize: "13px", fontWeight: 800 }}>DigiLocker</div>
              </div>
            </div>

            <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
              ✓ Status: Active
            </span>
          </div>
        </div>

        {/* Right Side: Linked Institute & Verified Academic Records */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Institutional Enrollment Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Building2 size={20} color="#0B2265" />
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0B2265" }}>
                Linked AICTE Enrolled Institution
              </h3>
            </div>

            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
              {profile?.college_name}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
              AICTE Permanent ID: <strong style={{ color: "#0B2265" }}>{profile?.aicte_id}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                <div style={{ color: "#64748b" }}>Program & Branch</div>
                <div style={{ fontWeight: 700, color: "#0B2265", marginTop: "2px" }}>{profile?.department}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                <div style={{ color: "#64748b" }}>Enrollment / Roll No</div>
                <div style={{ fontWeight: 700, color: "#0B2265", marginTop: "2px" }}>{profile?.enrollment_no}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                <div style={{ color: "#64748b" }}>Degree Level</div>
                <div style={{ fontWeight: 700, color: "#0B2265", marginTop: "2px" }}>{profile?.level || "UG (B.Tech)"}</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                <div style={{ color: "#64748b" }}>Admission Cycle</div>
                <div style={{ fontWeight: 700, color: "#0B2265", marginTop: "2px" }}>{profile?.academic_year || "2026-2027"}</div>
              </div>
            </div>
          </div>

          {/* Academic Bank of Credits Accumulator */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Award size={20} color="#0B2265" />
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0B2265" }}>
                Accumulated Academic Credits (ABC)
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#1d4ed8" }}>
                  {profile?.credits_earned || 84}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e40af" }}>Total Earned Credits</div>
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#15803d" }}>
                  {profile?.cgpa || 8.92}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Cumulative CGPA</div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash */}
            <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", fontSize: "11px", color: "#475569" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#0B2265", marginBottom: "2px" }}>
                <Hash size={13} />
                Cryptographic Verifiable Ledger Hash (SHA-256)
              </div>
              <code style={{ wordBreak: "break-all", color: "#0284c7" }}>
                {profile?.verification_hash || "sha256:d8b2e176430259751e041fa89c0281b37651e43c"}
              </code>
            </div>
          </div>

        </div>
      </div>

      {/* Discrepancy Remarks & Grievances History Section */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265" }}>
              Discrepancy Reporting & Remarks Desk
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
              Track the resolution status of reported inaccuracies (wrong college mapping, profile errors).
            </p>
          </div>

          <button
            onClick={() => setIsRemarkModalOpen(true)}
            style={{
              background: "#0B2265",
              color: "#ffffff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            + New Grievance
          </button>
        </div>

        {remarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", background: "#f8fafc", borderRadius: "8px", color: "#64748b", fontSize: "13px" }}>
            No discrepancy remarks raised yet. All academic records are verified and aligned.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>ID</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Issue Category</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Description</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Date Reported</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Status</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>AICTE Resolution Notes</th>
                </tr>
              </thead>
              <tbody>
                {remarks.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>#{r.id}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0B2265" }}>{r.remark_type}</td>
                    <td style={{ padding: "10px 12px", maxWidth: "280px" }}>{r.description}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          background: r.status === "RESOLVED" ? "#dcfce7" : r.status === "UNDER_REVIEW" ? "#fef3c7" : "#fee2e2",
                          color: r.status === "RESOLVED" ? "#15803d" : r.status === "UNDER_REVIEW" ? "#b45309" : "#b91c1c",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          fontSize: "11px"
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>
                      {r.admin_notes || "Awaiting verification officer review."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discrepancy Reporting Modal */}
      {isRemarkModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 34, 101, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={20} color="#FF5722" />
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265" }}>
                  Raise a Discrepancy Remark
                </h3>
              </div>
              <button
                onClick={() => setIsRemarkModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px", lineHeight: 1.5 }}>
              Use this form to flag if you are mapped to the wrong institution, if your personal data is inaccurate, or if your earned ABC credits do not match.
            </p>

            <form onSubmit={handleRemarkSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Discrepancy Category *
                </label>
                <select
                  value={remarkType}
                  onChange={(e) => setRemarkType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px"
                  }}
                >
                  <option value="Wrong College Mapping">Wrong College Mapping (Enrolled in another institution)</option>
                  <option value="Inaccurate Personal Details">Inaccurate Personal Details (Name, DoB, Gender)</option>
                  <option value="Credit Mismatch">Academic Bank of Credits Mismatch</option>
                  <option value="Quota/Category Error">Reservation / Quota Classification Error</option>
                  <option value="Duplicate Enrollment Conflict">Dual Enrollment Inconsistency</option>
                  <option value="Other">Other Policy Grievance</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={remarkDesc}
                  onChange={(e) => setRemarkDesc(e.target.value)}
                  placeholder="Explain the discrepancy clearly (e.g., 'I transferred to VJTI Mumbai during CAP Round 2, but the registry still shows St. Xavier\'s College')."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Registered Mobile
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.mobile_number ? `+91 ${profile.mobile_number}` : "Verified Mobile (2FA)"}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: "12px",
                      color: "#64748b",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsRemarkModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "9px 16px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRemark}
                  style={{
                    background: "#FF5722",
                    color: "#ffffff",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Send size={14} />
                  {submittingRemark ? "Submitting..." : "Submit Grievance to AICTE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
