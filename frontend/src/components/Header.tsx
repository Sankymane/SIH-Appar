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
  ScanSearch
} from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  auth: UserAuthContext;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onQuickRegulatorLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  auth,
  onOpenLoginModal,
  onLogout,
  onQuickRegulatorLogin,
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
        </div>
        <div className="top-utility-right">
          <div className="font-resizer">
            <span style={{ fontSize: "10px", opacity: 0.8 }}>Text Size:</span>
            <button className="font-btn">A-</button>
            <button className="font-btn">A</button>
            <button className="font-btn">A+</button>
          </div>
          <button className="hindi-btn">हिंदी</button>
          <button
            className="web-portal-login-btn"
            onClick={onOpenLoginModal}
            title="Institute APAAR Gateway"
          >
            <Lock size={11} /> Web Portal Login
          </button>
        </div>
      </div>

      {/* 2. White Brand Masthead */}
      <div className="brand-masthead">
        <div className="brand-emblem-wrap" onClick={() => setCurrentTab("explorer")}>
          {/* AICTE Official SVG Sun-Emblem */}
          <svg className="aicte-emblem-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#F75700" stroke="#0B2265" strokeWidth="2" />
            <circle cx="50" cy="50" r="38" fill="#FFF9F5" />
            {/* Cogwheel & Lamp */}
            <circle cx="50" cy="50" r="28" stroke="#0B2265" strokeWidth="3" strokeDasharray="6 3" />
            <path d="M50 24 L52 30 L48 30 Z" fill="#0B2265" />
            <path d="M50 76 L52 70 L48 70 Z" fill="#0B2265" />
            <path d="M24 50 L30 52 L30 48 Z" fill="#0B2265" />
            <path d="M76 50 L70 52 L70 48 Z" fill="#0B2265" />
            {/* Traditional Lamp (Deepak) */}
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
            <div className="apaar-badge-title">APAAR ID STUDENT REGISTRY</div>
            <div className="apaar-badge-sub">One Nation, One Student ID (NEP 2020)</div>
          </div>
        </div>
      </div>

      {/* 3. Deep Corporate Blue Main Navigation */}
      <nav className="main-navbar">
        <ul className="nav-links">
          <li
            className={`nav-item ${currentTab === "explorer" ? "active" : ""}`}
            onClick={() => setCurrentTab("explorer")}
          >
            <Building size={14} /> Approved Institutions Explorer
          </li>
          <li
            className={`nav-item ${currentTab === "dashboard" ? "active" : ""}`}
            onClick={() => {
              if (auth.role === "PUBLIC") {
                onOpenLoginModal();
              } else {
                setCurrentTab("dashboard");
              }
            }}
          >
            <BookOpen size={14} /> Institute Dashboard
            {auth.role === "INSTITUTE_ADMIN" && (
              <span style={{ background: "#2e7d32", padding: "1px 6px", borderRadius: "10px", fontSize: "10px" }}>
                Active
              </span>
            )}
          </li>
          <li
            className={`nav-item ${currentTab === "verify" ? "active" : ""}`}
            onClick={() => setCurrentTab("verify")}
          >
            <ShieldCheck size={14} /> APAAR Verification Portal
          </li>
          <li
            className={`nav-item ${currentTab === "integrity" ? "active" : ""}`}
            onClick={() => setCurrentTab("integrity")}
          >
            <ScanSearch size={14} /> Integrity &amp; Anomaly Audit
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
            <ExternalLink size={14} /> REST API (Swagger)
          </li>
        </ul>

        {/* Auth / Role Switcher Section */}
        <div className="nav-auth-section">
          {auth.role === "PUBLIC" ? (
            <>
              <button
                className="btn-regulator-toggle"
                onClick={onQuickRegulatorLogin}
                title="Switch to AICTE Regulator mode for compliance audits"
              >
                <ShieldCheck size={12} /> AICTE Regulator Mode
              </button>
              <button className="btn-institute-login" onClick={onOpenLoginModal}>
                <Lock size={12} /> Institute Secure Login
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ textAlign: "right", color: "#ffffff" }}>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>
                  {auth.role === "AICTE_VERIFIER" ? "AICTE Regulator Bureau" : auth.college_name.slice(0, 30) + "..."}
                </div>
                <div style={{ fontSize: "10px", opacity: 0.85 }}>
                  {auth.role === "AICTE_VERIFIER" ? "Central Verification Officer" : `AICTE ID: ${auth.aicte_id}`}
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <LogOut size={11} /> Logout
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
          &nbsp;&nbsp;&nbsp;&nbsp;★ Automated cross-institutional enrollment duplicate detection engine is now active across all 36 States & UTs.
          &nbsp;&nbsp;&nbsp;&nbsp;★ Nodal Officers must submit student intake verification before deadline.
        </div>
      </div>

      {/* 5. Orange Sub-Navbar (Mirroring screenshot #2) */}
      <div className="sub-navbar">
        <span className="sub-nav-item active" onClick={() => setCurrentTab("explorer")}>
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
