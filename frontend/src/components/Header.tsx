import React, { useState, useEffect } from "react";
import { UserAuthContext } from "../types";
import {
  Lock,
  LogOut,
  ShieldCheck,
  Building,
  ExternalLink,
  Search,
  BookOpen,
  Award,
  Globe,
  GraduationCap,
  ShieldAlert,
  PhoneCall,
  TrendingUp,
  User
} from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  auth: UserAuthContext;
  onOpenLoginModal: (mode?: "STUDENT" | "INSTITUTE" | "STAKEHOLDER") => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  auth,
  onOpenLoginModal,
  onLogout,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleDateString("en-US", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="aicte-header-wrapper">
      {/* 1. Top Utility Black Bar */}
      <div className="top-utility-bar">
        <div className="top-utility-left">
          <span>{currentDateTime || "Saturday, 10-24-2026, 1:34 PM"}</span>
          <span>|</span>
          <span className="utility-link">
            <Globe size={11} /> Screen Reader Access
          </span>
          <span>|</span>
          <span style={{ color: "#f97316", fontWeight: 700 }}>
            🔒 Dev 2FA Mobile: +91 8767434172
          </span>
        </div>
        <div className="top-utility-right">
          <div className="font-resizer">
            <span style={{ fontSize: "10px", opacity: 0.8 }}>Text Size:</span>
            <button className="font-btn">A-</button>
            <button className="font-btn">A</button>
            <button className="font-btn">A+</button>
          </div>
          <button className="hindi-btn">हिंदी</button>
          {auth.role === "PUBLIC" && (
            <button
              className="web-portal-login-btn"
              onClick={() => onOpenLoginModal("INSTITUTE")}
              title="Institute APAAR Gateway"
            >
              <Lock size={11} /> Institute Login
            </button>
          )}
        </div>
      </div>

      {/* 2. White Brand Masthead */}
      <div className="brand-masthead">
        <div className="brand-emblem-wrap" onClick={() => setCurrentTab(auth.role === "PUBLIC" ? "landing" : auth.role === "STUDENT" ? "student-dashboard" : auth.role === "AICTE_VERIFIER" ? "stakeholder-dashboard" : "dashboard")}>
          {/* AICTE Official SVG Sun-Emblem */}
          <svg className="aicte-emblem-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#F75700" stroke="#0B2265" strokeWidth="2" />
            <circle cx="50" cy="50" r="38" fill="#FFF9F5" />
            <circle cx="50" cy="50" r="28" stroke="#0B2265" strokeWidth="3" strokeDasharray="6 3" />
            <path d="M50 24 L52 30 L48 30 Z" fill="#0B2265" />
            <path d="M50 76 L52 70 L48 70 Z" fill="#0B2265" />
            <path d="M24 50 L30 52 L30 48 Z" fill="#0B2265" />
            <path d="M76 50 L70 52 L70 48 Z" fill="#0B2265" />
            <path d="M38 56 C38 64 62 64 62 56 L38 56 Z" fill="#0B2265" />
            <path d="M50 42 C47 48 53 48 50 42 Z" fill="#F75700" />
            <circle cx="50" cy="46" r="2" fill="#FFC107" />
          </svg>
          <div className="brand-titles">
            <h1>अखिल भारतीय तकनीकी शिक्षा परिषद्</h1>
            <h2>ALL INDIA COUNCIL FOR TECHNICAL EDUCATION</h2>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
              (A Statutory Body of the Government of India)
            </div>
          </div>
        </div>

        {/* Right Badge: APAAR ID Integration System */}
        <div className="brand-right-badges">
          <div className="apaar-badge">
            <div className="apaar-badge-title">APAAR ID STUDENT DATA MANAGEMENT</div>
            <div className="apaar-badge-sub">SIH Problem Statement 26263 • AICTE Approved Institutions</div>
          </div>
        </div>
      </div>

      {/* 3. Deep Corporate Blue Main Navigation */}
      <nav className="main-navbar">
        <ul className="nav-links">
          {auth.role === "PUBLIC" ? (
            <>
              <li
                className={`nav-item ${currentTab === "landing" ? "active" : ""}`}
                onClick={() => setCurrentTab("landing")}
              >
                <ShieldCheck size={14} /> Role Selection Portals
              </li>
              <li
                className={`nav-item ${currentTab === "explorer" ? "active" : ""}`}
                onClick={() => setCurrentTab("explorer")}
              >
                <Building size={14} /> Approved Institutions Directory
              </li>
              <li
                className={`nav-item ${currentTab === "api-docs" ? "active" : ""}`}
                onClick={() => setCurrentTab("api-docs")}
              >
                <ExternalLink size={14} /> REST API Ready (Req 7)
              </li>
            </>
          ) : auth.role === "STUDENT" ? (
            <>
              <li
                className={`nav-item ${currentTab === "student-dashboard" ? "active" : ""}`}
                onClick={() => setCurrentTab("student-dashboard")}
              >
                <GraduationCap size={14} /> My Academic Bank of Credits (ABC)
              </li>
            </>
          ) : auth.role === "AICTE_VERIFIER" ? (
            <>
              <li
                className={`nav-item ${currentTab === "stakeholder-dashboard" ? "active" : ""}`}
                onClick={() => setCurrentTab("stakeholder-dashboard")}
              >
                <ShieldAlert size={14} /> Stakeholder Oversight Bureau
              </li>
              <li
                className={`nav-item ${currentTab === "explorer" ? "active" : ""}`}
                onClick={() => setCurrentTab("explorer")}
              >
                <Building size={14} /> National Colleges Directory
              </li>
              <li
                className={`nav-item ${currentTab === "api-docs" ? "active" : ""}`}
                onClick={() => setCurrentTab("api-docs")}
              >
                <ExternalLink size={14} /> REST API Endpoints
              </li>
            </>
          ) : (
            // INSTITUTE_ADMIN
            <>
              <li
                className={`nav-item ${currentTab === "dashboard" ? "active" : ""}`}
                onClick={() => setCurrentTab("dashboard")}
              >
                <BookOpen size={14} /> Institute Dashboard
              </li>
              <li
                className={`nav-item ${currentTab === "explorer" ? "active" : ""}`}
                onClick={() => setCurrentTab("explorer")}
              >
                <Building size={14} /> AICTE Registry Explorer
              </li>
              <li
                className={`nav-item ${currentTab === "audit" ? "active" : ""}`}
                onClick={() => setCurrentTab("audit")}
              >
                <Award size={14} /> Regulatory Audit Trail
              </li>
              <li
                className={`nav-item ${currentTab === "api-docs" ? "active" : ""}`}
                onClick={() => setCurrentTab("api-docs")}
              >
                <ExternalLink size={14} /> REST API
              </li>
            </>
          )}
        </ul>

        {/* Auth / Role Switcher Section */}
        <div className="nav-auth-section">
          {auth.role === "PUBLIC" ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #93c5fd",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                onClick={() => onOpenLoginModal("STUDENT")}
              >
                <GraduationCap size={13} /> Student Login
              </button>

              <button
                style={{
                  background: "#FF5722",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                onClick={() => onOpenLoginModal("INSTITUTE")}
              >
                <Building size={13} /> Institute Login
              </button>

              <button
                style={{
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
                onClick={() => onOpenLoginModal("STAKEHOLDER")}
              >
                <ShieldAlert size={13} /> Regulator Login
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right", color: "#ffffff" }}>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>
                  {auth.role === "STUDENT"
                    ? (auth.student_name || "SANKALP HEMANT MANE")
                    : auth.role === "AICTE_VERIFIER"
                    ? "AICTE Central Regulatory Bureau"
                    : auth.college_name.slice(0, 30) + "..."}
                </div>
                <div style={{ fontSize: "10px", opacity: 0.85 }}>
                  {auth.role === "STUDENT"
                    ? `APAAR: ${auth.apaar_id || "126430259751"}`
                    : auth.role === "AICTE_VERIFIER"
                    ? "Authorized Vigilance Officer"
                    : `AICTE ID: ${auth.aicte_id}`}
                </div>
              </div>

              <button
                onClick={onLogout}
                style={{
                  background: "#dc2626",
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
                <LogOut size={12} /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 4. News Marquee Ticker */}
      <div className="news-ticker-container">
        <div className="news-badge">LATEST NEWS</div>
        <div className="ticker-content">
          ★ AICTE Directive 2026-2027: Mandatory APAAR ID Seeding for all sanctioned UG/PG admissions under NEP 2020.
          &nbsp;&nbsp;&nbsp;&nbsp;★ All security verification OTPs routed strictly to development phone +91 8767434172.
          &nbsp;&nbsp;&nbsp;&nbsp;★ AI-driven intake forecasting engine active: Institutions exceeding 30% projected demand flagged for early warnings.
          &nbsp;&nbsp;&nbsp;&nbsp;★ Nodal Officers must submit student intake verification before deadline.
        </div>
      </div>

      {/* 5. Orange Sub-Navbar (Mirroring official AICTE portal) */}
      <div className="sub-navbar">
        <span
          className="sub-nav-item active"
          onClick={() => setCurrentTab(auth.role === "PUBLIC" ? "landing" : auth.role === "STUDENT" ? "student-dashboard" : auth.role === "AICTE_VERIFIER" ? "stakeholder-dashboard" : "dashboard")}
        >
          <Building size={13} /> Dashboard
        </span>
        <span className="sub-nav-item" onClick={() => setCurrentTab("explorer")}>
          Universities/Institutes
        </span>
        <span className="sub-nav-item" onClick={() => setCurrentTab("explorer")}>
          Other Approvals
        </span>
        <span className="sub-nav-item">NBA</span>
        <span className="sub-nav-item">Autonomous</span>
        <span className="sub-nav-item">Working Professional</span>
        <span className="sub-nav-item">Faculties</span>
        <span className="sub-nav-item">Closed Courses</span>
        <span className="sub-nav-item">Closed Institutes</span>
        <span className="sub-nav-item" style={{ background: "#c53d00" }}>
          Unapproved Institutes
        </span>
      </div>
    </header>
  );
};
