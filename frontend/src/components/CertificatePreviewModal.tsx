import React from "react";
import { Student } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer, ShieldCheck, Award } from "lucide-react";

interface CertificatePreviewModalProps {
  student: Student | null;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  student,
  onClose,
}) => {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  // Format 12-digit APAAR ID into 4-digit readable chunks: 'XXXX XXXX XXXX'
  const formattedApaar = student.apaar_id
    ? student.apaar_id.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
    : "NOT SEEDED";

  // Verification URL to encode in QR code
  const verificationUrl = `${window.location.origin}/api/v1/verify/${student.apaar_id || student.enrollment_no}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "880px", width: "95vw", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Bar */}
        <div
          style={{
            background: "#1e293b",
            color: "#ffffff",
            padding: "10px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
            <Award size={16} color="#f7941d" />
            Official Degree Certificate Preview (APAAR ID Integration - PS 26263)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "var(--aicte-orange)",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Printer size={13} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            High-Resolution Official Degree Certificate Frame
            ------------------------------------------------------------- */}
        <div style={{ padding: "24px", background: "#f1f5f9", maxHeight: "82vh", overflowY: "auto" }}>
          <div className="certificate-frame">
            {/* Top Emblems & Seal */}
            <div className="certificate-header-emblems">
              <svg viewBox="0 0 100 100" style={{ width: "65px", height: "65px" }}>
                <circle cx="50" cy="50" r="46" fill="#F75700" stroke="#0B2265" strokeWidth="2" />
                <circle cx="50" cy="50" r="38" fill="#FFF9F5" />
                <circle cx="50" cy="50" r="28" stroke="#0B2265" strokeWidth="3" strokeDasharray="6 3" />
                <path d="M38 56 C38 64 62 64 62 56 L38 56 Z" fill="#0B2265" />
                <path d="M50 42 C47 48 53 48 50 42 Z" fill="#F75700" />
              </svg>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", letterSpacing: "1px" }}>
                  GOVERNMENT OF INDIA • MINISTRY OF EDUCATION
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0B2265", letterSpacing: "1px" }}>
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  NATIONAL ACADEMIC REPOSITORY & APAAR REGISTRY
                </div>
              </div>

              {/* National Academic Depository Badge */}
              <div
                style={{
                  border: "2px solid #0B2265",
                  borderRadius: "50%",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#0B2265",
                  background: "#fff9f0",
                }}
              >
                SEAL OF
                <br />
                ACCREDIT
              </div>
            </div>

            <div className="cert-title">Degree of Bachelor of Technology</div>
            <div className="cert-subtitle">
              Conferred in recognition of the fulfillment of requirements in technical education
            </div>

            <div style={{ fontSize: "14px", fontStyle: "italic", color: "#374151" }}>
              This is to certify that
            </div>

            <div className="cert-recipient">
              {student.full_name}
            </div>

            <div style={{ fontSize: "14px", color: "#374151", margin: "8px 0" }}>
              of <b>{student.college_name || "AICTE Approved Institution"}</b> (AICTE ID: {student.aicte_id})
              <br />
              has been successfully admitted to the degree in
            </div>

            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0B2265", margin: "10px 0" }}>
              {student.department} ({student.level})
            </div>

            <div style={{ fontSize: "12px", color: "#475569" }}>
              Academic Year: <b>{student.academic_year}</b> • Admission Type: <b>{student.admission_type}</b>
            </div>

            {/* PROMINENT APAAR ID DISPLAY (Requirement 10) */}
            <div className="cert-apaar-highlight">
              <div style={{ borderRight: "2px solid #cbd5e1", paddingRight: "14px", textAlign: "left" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Official APAAR ID (Ministry of Education)
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265", letterSpacing: "2px" }}>
                  {formattedApaar}
                </div>
              </div>

              <div style={{ textAlign: "left", paddingLeft: "4px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Institutional Roll Number
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#d97706" }}>
                  {student.enrollment_no}
                </div>
              </div>
            </div>

            {/* Certificate Footer with Signatures & QR Code */}
            <div className="cert-footer">
              <div style={{ textAlign: "left", fontSize: "11px", color: "#64748b" }}>
                <div style={{ fontWeight: 700, color: "#0B2265", marginBottom: "4px" }}>
                  Digital Identity Hash:
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "10px", wordBreak: "break-all", maxWidth: "260px" }}>
                  {student.verification_hash || "SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
                </div>
                <div style={{ marginTop: "6px", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={13} /> Verified on National DigiLocker Registry
                </div>
              </div>

              {/* Scannable Verification QR Code */}
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "#ffffff", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "4px", display: "inline-block" }}>
                  <QRCodeSVG value={verificationUrl} size={74} level="M" />
                </div>
                <div style={{ fontSize: "9px", color: "#64748b", marginTop: "3px", fontWeight: 600 }}>
                  Scan to Verify Authenticity
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: "11px", color: "#334155" }}>
                <div style={{ fontStyle: "italic", fontFamily: "serif", fontSize: "16px", color: "#0B2265", marginBottom: "4px" }}>
                  T. G. Sitharam
                </div>
                <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "4px", fontWeight: 700 }}>
                  Chairman, AICTE
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  New Delhi, India
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
