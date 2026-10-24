import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { RoleSelectionLanding } from "./components/RoleSelectionLanding";
import { InstitutionsExplorer } from "./components/InstitutionsExplorer";
import { CollegeDetailDrawer } from "./components/CollegeDetailDrawer";
import { LoginModal } from "./components/LoginModal";
import { InstituteDashboard } from "./components/InstituteDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { StakeholderDashboard } from "./components/StakeholderDashboard";
import { AuditTrailView } from "./components/AuditTrailView";
import { CertificatePreviewModal } from "./components/CertificatePreviewModal";
import { UserAuthContext, Student } from "./types";
import { ExternalLink, Code2, ShieldCheck, Database, CheckCircle2, Lock } from "lucide-react";

export default function App() {
  // Default to Role Selection Landing prompt on first load
  const [currentTab, setCurrentTab] = useState<string>("landing");

  // Auth State
  const [auth, setAuth] = useState<UserAuthContext>({
    token: "",
    aicte_id: "",
    college_name: "",
    role: "PUBLIC",
  });

  // Modal & Drawer States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalMode, setLoginModalMode] = useState<"STUDENT" | "INSTITUTE" | "STAKEHOLDER">("INSTITUTE");
  const [loginPreselect, setLoginPreselect] = useState<{ aicte_id: string; name: string } | undefined>(undefined);
  const [selectedCollegeForDrawer, setSelectedCollegeForDrawer] = useState<string | null>(null);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);

  // Restore stored session on mount if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aicte_auth_context");
      if (stored) {
        const parsed: UserAuthContext = JSON.parse(stored);
        if (parsed && (parsed.token || parsed.aicte_id)) {
          setAuth(parsed);
          if (parsed.role === "STUDENT") {
            setCurrentTab("student-dashboard");
          } else if (parsed.role === "AICTE_VERIFIER") {
            setCurrentTab("stakeholder-dashboard");
          } else {
            setCurrentTab("dashboard");
          }
          return;
        }
      }
    } catch {}

    const token = localStorage.getItem("aicte_token");
    if (token) {
      setAuth({
        token,
        aicte_id: "1-44465113304",
        college_name: "JAWAHARLAL NEHRU RAJKEEYA MAHAVIDYALAYA",
        role: "INSTITUTE_ADMIN",
      });
      setCurrentTab("dashboard");
    } else {
      setCurrentTab("landing");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aicte_token");
    localStorage.removeItem("aicte_auth_context");
    setAuth({
      token: "",
      aicte_id: "",
      college_name: "",
      role: "PUBLIC",
    });
    setCurrentTab("landing");
  };

  const handleOpenLogin = (mode: "STUDENT" | "INSTITUTE" | "STAKEHOLDER" = "INSTITUTE") => {
    setLoginModalMode(mode);
    setLoginPreselect(undefined);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (authData: UserAuthContext) => {
    setAuth(authData);
    localStorage.setItem("aicte_auth_context", JSON.stringify(authData));
    if (authData.token) {
      localStorage.setItem("aicte_token", authData.token);
    }
    if (authData.role === "STUDENT") {
      setCurrentTab("student-dashboard");
    } else if (authData.role === "AICTE_VERIFIER") {
      setCurrentTab("stakeholder-dashboard");
    } else {
      setCurrentTab("dashboard");
    }
  };

  const handleDirectLoginFromExplorer = (aicte_id: string, name: string) => {
    setLoginModalMode("INSTITUTE");
    setLoginPreselect({ aicte_id, name });
    setIsLoginModalOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* Official AICTE Header (Utility Bar, Masthead, Blue Nav, Ticker, Orange Sub-Nav) */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        auth={auth}
        onOpenLoginModal={handleOpenLogin}
        onLogout={handleLogout}
      />

      {/* Main Tab Views */}
      <div style={{ flexGrow: 1 }}>
        
        {/* 1. Landing Page Role Selection (Immediately prompted on initial load) */}
        {currentTab === "landing" && (
          <RoleSelectionLanding
            onSelectRole={(role) => handleOpenLogin(role)}
            onExplorePublicDirectory={() => setCurrentTab("explorer")}
          />
        )}

        {/* 2. Public Approved Institutions Explorer */}
        {currentTab === "explorer" && (
          <InstitutionsExplorer
            onSelectCollege={(id) => setSelectedCollegeForDrawer(id)}
            onDirectLoginWithCollege={handleDirectLoginFromExplorer}
          />
        )}

        {/* 3. Student Portal Dashboard (ABC DigiLocker Card & Raise a Remark) */}
        {currentTab === "student-dashboard" && (
          <StudentDashboard auth={auth} />
        )}

        {/* 4. Institutional Dashboard (Intake vs Enrollment, Uploads, Degree Certificate) */}
        {currentTab === "dashboard" && (
          <InstituteDashboard auth={auth} />
        )}

        {/* 5. Stakeholder (AICTE) Portal (Phone Directory, Alerts, 2FA Add/Remove, Forecasting) */}
        {currentTab === "stakeholder-dashboard" && (
          <StakeholderDashboard auth={auth} />
        )}

        {/* 6. Regulatory Audit Trail */}
        {currentTab === "audit" && (
          <div style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 20px" }}>
            <AuditTrailView />
          </div>
        )}

        {/* 7. REST API Documentation (Swagger) */}
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
                  <span style={{ background: "#2e7d32", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>POST</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/auth/student-request-otp</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Student APAAR lookup & security OTP dispatch to registered phone.
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#0B2265", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>GET</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/stakeholder/directory</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Registered 2FA phone directory mapping colleges to authorized numbers.
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#7c3aed", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>GET</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/stakeholder/forecasting</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Prophet & TFT time-series models (10-yr history, seasonal decomposition, &gt;30% overflow warnings).
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ background: "#ea580c", color: "#fff", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, fontSize: "10px" }}>POST</span>
                  <b style={{ marginLeft: "6px" }}>/api/v1/student/remarks</b>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Student grievance desk for wrong college mapping and profile errors.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#0B2265",
                    color: "#ffffff",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <ExternalLink size={14} /> Open Interactive Swagger UI (/docs)
                </a>
                <a
                  href="/redoc"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f1f5f9",
                    color: "#0B2265",
                    border: "1px solid #cbd5e1",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <Database size={14} /> ReDoc Documentation (/redoc)
                </a>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* College Detail Slide-out Drawer */}
      {selectedCollegeForDrawer && (
        <CollegeDetailDrawer
          aicteId={selectedCollegeForDrawer}
          onClose={() => setSelectedCollegeForDrawer(null)}
          onDirectLogin={(aicte_id: string, name: string) => {
            setSelectedCollegeForDrawer(null);
            handleDirectLoginFromExplorer(aicte_id, name);
          }}
        />
      )}

      {/* Degree Certificate Modal */}
      {selectedStudentForCert && (
        <CertificatePreviewModal
          student={selectedStudentForCert}
          onClose={() => setSelectedStudentForCert(null)}
        />
      )}

      {/* 2FA OTP Login Modal (Student / Institute / Stakeholder) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={loginModalMode}
        initialAicteId={loginPreselect?.aicte_id}
        initialCollegeName={loginPreselect?.name}
      />

      {/* Official AICTE Footer */}
      <footer style={{ background: "#0B2265", color: "#ffffff", padding: "20px 0", marginTop: "auto", borderTop: "4px solid #FF5722" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800 }}>ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE)</div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070</div>
          </div>
          <div style={{ fontSize: "11px", opacity: 0.7, textAlign: "right" }}>
            Smart India Hackathon (SIH) • Problem Statement 26263 • AICTE APAAR Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
