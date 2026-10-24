import React, { useState, useEffect } from "react";
import { searchInstitutions, verifyPhoneEmail } from "../api";
import { UserAuthContext } from "../types";
import { SignInButton } from "./SignInButton";
import {
  X,
  Search,
  ShieldCheck,
  Building,
  GraduationCap,
  ShieldAlert
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (authData: UserAuthContext) => void;
  initialMode?: "STUDENT" | "INSTITUTE" | "STAKEHOLDER";
  initialAicteId?: string;
  initialCollegeName?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = "INSTITUTE",
  initialAicteId,
  initialCollegeName,
}) => {
  const [loginMode, setLoginMode] = useState<"STUDENT" | "INSTITUTE" | "STAKEHOLDER">(initialMode);

  // Optional Institute selection
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<{ aicte_id: string; name: string } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    setLoginMode(initialMode);
    setErrorMsg("");
    if (initialAicteId && initialCollegeName) {
      setSelectedCollege({ aicte_id: initialAicteId, name: initialCollegeName });
    }
  }, [initialMode, initialAicteId, initialCollegeName, isOpen]);

  // Live autocomplete search for institutions
  useEffect(() => {
    if (loginMode === "INSTITUTE" && searchQuery.trim().length >= 1) {
      searchInstitutions(searchQuery).then((res) => {
        setSearchResults(res || []);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, loginMode]);

  if (!isOpen) return null;

  // STRICT AUTHENTICATION FLOW: ONLY triggered by window.phoneEmailListener
  const handlePhoneEmailVerified = async (userJsonUrl: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const identifier =
        loginMode === "STUDENT"
          ? undefined
          : loginMode === "STAKEHOLDER"
          ? "AICTE_HQ_NEW_DELHI"
          : selectedCollege?.aicte_id;

      const res = await verifyPhoneEmail(
        userJsonUrl,
        loginMode === "STUDENT" ? "STUDENT" : loginMode === "STAKEHOLDER" ? "AICTE_VERIFIER" : "INSTITUTE_ADMIN",
        identifier
      );

      localStorage.setItem("aicte_token", res.access_token);
      onLoginSuccess({
        token: res.access_token,
        aicte_id: res.aicte_id,
        college_name: res.college_name,
        role: res.role as any,
        apaar_id: res.apaar_id,
        student_name: res.student_name,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 34, 101, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "2px solid #0B2265",
        }}
      >
        {/* Top Masthead */}
        <div
          style={{
            background: "#0B2265",
            color: "#ffffff",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={22} color="#FF5722" />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800 }}>AICTE Secure Access Gateway</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>National APAAR Verification System</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Portal Role Switcher Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <button
            onClick={() => {
              setLoginMode("STUDENT");
              setErrorMsg("");
            }}
            style={{
              padding: "12px 10px",
              border: "none",
              background: loginMode === "STUDENT" ? "#ffffff" : "transparent",
              borderBottom: loginMode === "STUDENT" ? "3px solid #0B2265" : "none",
              color: loginMode === "STUDENT" ? "#0B2265" : "#64748b",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <GraduationCap size={15} /> Student
          </button>

          <button
            onClick={() => {
              setLoginMode("INSTITUTE");
              setErrorMsg("");
            }}
            style={{
              padding: "12px 10px",
              border: "none",
              background: loginMode === "INSTITUTE" ? "#ffffff" : "transparent",
              borderBottom: loginMode === "INSTITUTE" ? "3px solid #FF5722" : "none",
              color: loginMode === "INSTITUTE" ? "#FF5722" : "#64748b",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Building size={15} /> Institutional
          </button>

          <button
            onClick={() => {
              setLoginMode("STAKEHOLDER");
              setErrorMsg("");
            }}
            style={{
              padding: "12px 10px",
              border: "none",
              background: loginMode === "STAKEHOLDER" ? "#ffffff" : "transparent",
              borderBottom: loginMode === "STAKEHOLDER" ? "3px solid #7c3aed" : "none",
              color: loginMode === "STAKEHOLDER" ? "#7c3aed" : "#64748b",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <ShieldAlert size={15} /> AICTE Regulator
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "28px 24px" }}>
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "12px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", marginBottom: "16px", color: "#0B2265", fontSize: "13px", fontWeight: 700 }}>
              Verifying authenticated credentials...
            </div>
          )}

          {/* 1. STUDENT LOGIN */}
          {loginMode === "STUDENT" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                }}
              >
                <GraduationCap size={30} />
              </div>

              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265", marginBottom: "6px" }}>
                Student DigiLocker & APAAR Portal
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px", lineHeight: 1.5 }}>
                Click below to authenticate using your verified mobile number. Your APAAR record will be retrieved automatically from the database.
              </p>

              {/* The ONLY authentication element */}
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <SignInButton onVerified={handlePhoneEmailVerified} />
              </div>
            </div>
          )}

          {/* 2. INSTITUTIONAL LOGIN */}
          {loginMode === "INSTITUTE" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#fff7ed",
                    color: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                  }}
                >
                  <Building size={28} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265", marginBottom: "6px" }}>
                  Institutional Nodal Access
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                  Authenticate via your registered Nodal Administrator mobile number.
                </p>
              </div>

              {/* Optional College Selection Search */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Select Institution (Optional):
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search college name or AICTE ID..."
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 34px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                  <Search
                    size={15}
                    color="#64748b"
                    style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                  />
                </div>

                {selectedCollege && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#166534", fontWeight: 700 }}>
                    Selected: {selectedCollege.name} ({selectedCollege.aicte_id})
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div
                    style={{
                      maxHeight: "130px",
                      overflowY: "auto",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      background: "#ffffff",
                      marginTop: "4px",
                    }}
                  >
                    {searchResults.map((c) => (
                      <div
                        key={c.aicte_id}
                        onClick={() => {
                          setSelectedCollege(c);
                          setSearchResults([]);
                          setSearchQuery("");
                        }}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                      >
                        <div style={{ fontWeight: 700, color: "#0B2265" }}>{c.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{c.aicte_id}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* The ONLY authentication element */}
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <SignInButton onVerified={handlePhoneEmailVerified} />
              </div>
            </div>
          )}

          {/* 3. STAKEHOLDER LOGIN */}
          {loginMode === "STAKEHOLDER" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                }}
              >
                <ShieldAlert size={30} />
              </div>

              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265", marginBottom: "6px" }}>
                AICTE Central Regulatory Bureau
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px", lineHeight: 1.5 }}>
                Authorized regulatory access for state auditors and central commissioners. Authenticate via your registered mobile.
              </p>

              {/* The ONLY authentication element */}
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <SignInButton onVerified={handlePhoneEmailVerified} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
