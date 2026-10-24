import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { InstitutionsExplorer } from "./components/InstitutionsExplorer";
import { CollegeDetailDrawer } from "./components/CollegeDetailDrawer";
import { LoginModal } from "./components/LoginModal";
import { InstituteDashboard } from "./components/InstituteDashboard";
import { VerificationPortal } from "./components/VerificationPortal";
import { AuditTrailView } from "./components/AuditTrailView";
import { IntegrityAuditView } from "./components/IntegrityAuditView";
import { CertificatePreviewModal } from "./components/CertificatePreviewModal";
import { UserAuthContext, Student } from "./types";
import { regulatorLogin } from "./api";
import { ExternalLink, Code2, ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState<string>("explorer");

  // Auth State
  const [auth, setAuth] = useState<UserAuthContext>({
    token: "",
    aicte_id: "",
    college_name: "",
    role: "PUBLIC",
  });

  // Modal & Drawer States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginPreselect, setLoginPreselect] = useState<{ aicte_id: string; name: string } | undefined>(undefined);
  const [selectedCollegeForDrawer, setSelectedCollegeForDrawer] = useState<string | null>(null);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);

  // Restore stored session on mount
  useEffect(() => {
    const token = localStorage.getItem("aicte_token");
    if (token) {
      setAuth({
        token,
        aicte_id: "1-44525213207",
        college_name: "ST. XAVIER'S COLLEGE",
        role: "INSTITUTE_ADMIN",
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aicte_token");
    setAuth({
      token: "",
      aicte_id: "",
      college_name: "",
      role: "PUBLIC",
    });
    setCurrentTab("explorer");
  };

  const handleQuickRegulator = async () => {
    try {
      const res = await regulatorLogin();
      localStorage.setItem("aicte_token", res.access_token);
      setAuth({
        token: res.access_token,
        aicte_id: res.aicte_id,
        college_name: res.college_name,
        role: res.role,
      });
      setCurrentTab("dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDirectLoginFromExplorer = (aicte_id: string, name: string) => {
    setLoginPreselect({ aicte_id, name });
    setIsLoginModalOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Official AICTE Header (Utility Bar, Masthead, Blue Nav, Ticker, Orange Sub-Nav) */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        auth={auth}
        onOpenLoginModal={() => {
          setLoginPreselect(undefined);
          setIsLoginModalOpen(true);
        }}
        onLogout={handleLogout}
        onQuickRegulatorLogin={handleQuickRegulator}
      />

      {/* Main Tab Views */}
      <div style={{ flexGrow: 1 }}>
        {currentTab === "explorer" && (
          <InstitutionsExplorer
            onSelectCollege={(id) => setSelectedCollegeForDrawer(id)}
            onDirectLoginWithCollege={handleDirectLoginFromExplorer}
          />
        )}

        {currentTab === "dashboard" && (
          <InstituteDashboard auth={auth} />
        )}

        {currentTab === "verify" && (
          <VerificationPortal
            onOpenCertificate={(student) => setSelectedStudentForCert(student)}
            userRole={auth.role}
          />
        )}

        {currentTab === "audit" && (
          <AuditTrailView />
        )}

        {currentTab === "integrity" && (
          <IntegrityAuditView />
        )}

        {currentTab === "api-docs" && (
          <div style={{ maxWidth: "1000px", margin: "24px auto", padding: "0 20px" }}>
            <div
              style={{
                background: "#ffffff",
                border: "2px solid #0B2265",
                borderRadius: "8px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Code2 size={24} color="#0B2265" />
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265" }}>
                  AICTE-APAAR National Platform: REST API Ready Endpoints (Req 7)
                </h2>
              </div>
              <p style={{ fontSize: "13px", color: "#475569", marginBottom: "20px" }}>
                The platform is fully API-Ready for interoperability across Ministry of Education portals, DigiLocker, state technical boards, and institutional ERPs.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "12px", marginBottom: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#2e7d32", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>GET</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/verify/&#123;apaar_id&#125;</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Public student identity verification & cryptographic signature check.
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#0B2265", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>GET</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/institutions</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Filtered directory of AICTE-approved colleges with capacity limits.
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#d97706", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>POST</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/students</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Single student enrollment with automated duplicate & intake checks.
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#d97706", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>POST</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/students/bulk-upload</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Batch CSV/Excel ingestion with policy compliance validation.
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#d97706", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>POST</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/integrity/audit</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Layered L1-L5 enrollment integrity & anomaly audit with risk index and regulatory verdict.
                  </div>
                </div>
              </div>

              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "var(--aicte-orange)",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "10px 18px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Open Interactive Swagger OpenAPI Documentation <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* College Detail Side Panel Drawer (Req 3: Approved Intake vs Admitted Chart) */}
      {selectedCollegeForDrawer && (
        <CollegeDetailDrawer
          aicteId={selectedCollegeForDrawer}
          onClose={() => setSelectedCollegeForDrawer(null)}
          onDirectLogin={(id, name) => {
            setLoginPreselect({ aicte_id: id, name });
            setIsLoginModalOpen(true);
          }}
        />
      )}

      {/* 3-Step Secure Login Modal (Req 4) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialAicteId={loginPreselect?.aicte_id}
        initialCollegeName={loginPreselect?.name}
        onLoginSuccess={(authData) => {
          setAuth(authData);
          setCurrentTab("dashboard");
        }}
      />

      {/* Degree Certificate Preview Modal (Req 10) */}
      <CertificatePreviewModal
        student={selectedStudentForCert}
        onClose={() => setSelectedStudentForCert(null)}
      />

      {/* Official AICTE Footer */}
      <footer
        style={{
          background: "#071744",
          color: "#94a3b8",
          padding: "20px 24px",
          borderTop: "4px solid var(--aicte-orange)",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <b>All India Council for Technical Education (AICTE)</b> • Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
          </div>
          <div>
            National APAAR Registry Platform • SIH Problem Statement 26263
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
