import React, { useState, useEffect } from "react";
import {
  searchInstitutions,
  instituteRequestOtp,
  loginStep3,
  studentRequestOtp,
  studentVerifyOtp,
  regulatorRequestOtp,
  regulatorVerifyOtp,
  verifyPhoneEmail
} from "../api";
import { UserAuthContext } from "../types";
import { SignInButton } from "./SignInButton";
import {
  X,
  Search,
  Lock,
  KeyRound,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ShieldAlert,
  PhoneCall
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
  const [step, setStep] = useState<number>(1);

  // Student State
  const [apaarInput, setApaarInput] = useState<string>("126430259751");
  const [studentName, setStudentName] = useState<string>("");

  // Institute State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<{ aicte_id: string; name: string } | null>(null);

  // OTP Verification State (Enforced Global Phone 8767434172)
  const [otp, setOtp] = useState<string>("");
  const [simulatedOtp, setSimulatedOtp] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [otpMessage, setOtpMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    setLoginMode(initialMode);
    setStep(1);
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

  // 1. Student: Trigger OTP
  const handleStudentTriggerOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apaarInput.trim()) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await studentRequestOtp(apaarInput.trim());
      setSessionToken(res.session_token);
      setSimulatedOtp(res.simulated_otp);
      setStudentName(res.student_name);
      setOtpMessage(`Verification code sent to registered DigiLocker phone (+91 87674****72)`);
      setStep(2); // Go to OTP screen
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger student OTP");
    } finally {
      setLoading(false);
    }
  };

  // 1. Student: Verify OTP
  const handleStudentVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await studentVerifyOtp(apaarInput.trim(), otp.trim(), sessionToken);
      localStorage.setItem("aicte_token", res.access_token);
      onLoginSuccess({
        token: res.access_token,
        aicte_id: res.aicte_id,
        college_name: res.college_name,
        role: "STUDENT",
        apaar_id: res.apaar_id,
        student_name: res.student_name,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // 2. Institute: Select College and immediately trigger OTP to 8767434172
  const handleSelectCollegeTriggerOtp = async (college: { aicte_id: string; name: string }) => {
    setSelectedCollege(college);
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await instituteRequestOtp(college.aicte_id);
      setSessionToken(res.session_token);
      setSimulatedOtp(res.simulated_otp);
      setOtpMessage(`Verification code dispatched to authorized nodal phone (+91 87674****72)`);
      setStep(2); // Go to OTP screen
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger institute OTP");
    } finally {
      setLoading(false);
    }
  };

  // 2. Institute: Verify OTP
  const handleInstituteVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await loginStep3(selectedCollege.aicte_id, otp.trim(), sessionToken);
      localStorage.setItem("aicte_token", res.access_token);
      onLoginSuccess({
        token: res.access_token,
        aicte_id: res.aicte_id,
        college_name: res.college_name,
        role: "INSTITUTE_ADMIN",
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // 3. Stakeholder: Trigger OTP
  const handleStakeholderTriggerOtp = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await regulatorRequestOtp();
      setSessionToken(res.session_token);
      setSimulatedOtp(res.simulated_otp);
      setOtpMessage(`Security code dispatched to authorized regulator mobile (+91 87674****72)`);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger stakeholder OTP");
    } finally {
      setLoading(false);
    }
  };

  // 3. Stakeholder: Verify OTP
  const handleStakeholderVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await regulatorVerifyOtp(otp.trim(), sessionToken);
      localStorage.setItem("aicte_token", res.access_token);
      onLoginSuccess({
        token: res.access_token,
        aicte_id: res.aicte_id,
        college_name: res.college_name,
        role: "AICTE_VERIFIER",
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Stakeholder OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // phone.email Verified Callback Handler
  const handlePhoneEmailVerified = async (userJsonUrl: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const identifier =
        loginMode === "STUDENT"
          ? apaarInput.trim()
          : loginMode === "STAKEHOLDER"
          ? "AICTE_HQ_NEW_DELHI"
          : selectedCollege?.aicte_id || "1-44465113304";

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
      setErrorMsg(err.message || "phone.email verification failed");
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
          maxWidth: "520px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "2px solid #0B2265",
        }}
      >
        {/* Modal Top Masthead */}
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

        {/* Portal Role Switcher Tabs (Only visible on Step 1) */}
        {step === 1 && (
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
                padding: "10px",
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
                padding: "10px",
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
                padding: "10px",
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
        )}

        {/* Global Security OTP Routing Banner */}
        <div
          style={{
            background: "#fffbeb",
            borderBottom: "1px solid #fef3c7",
            padding: "8px 16px",
            fontSize: "11px",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <PhoneCall size={14} color="#b45309" />
          <span>
            Development Security Notice: All verification OTPs route strictly to: <strong>+91 8767434172</strong>
          </span>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px" }}>
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: INITIAL INPUT PER ROLE */}
          {/* ============================================================== */}
          {step === 1 && (
            <div>
              {/* 1. STUDENT LOGIN FORM */}
              {loginMode === "STUDENT" && (
                <form onSubmit={handleStudentTriggerOtp}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Enter 12-Digit Student APAAR ID *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={14}
                      value={apaarInput}
                      onChange={(e) => setApaarInput(e.target.value)}
                      placeholder="e.g. 126430259751"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "2px solid #0B2265",
                        fontSize: "18px",
                        letterSpacing: "2px",
                        fontWeight: 700,
                        color: "#0B2265",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "#166534",
                      marginBottom: "16px",
                    }}
                  >
                    💡 <strong>1-Click Demo Profile:</strong> Default APAAR <strong>126430259751</strong> (Sankalp Hemant Mane, DigiLocker ABC Card).
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: "#0B2265",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {loading ? "Dispatching OTP..." : "Send OTP to +91 8767434172 →"}
                  </button>
                </form>
              )}

              {/* 2. INSTITUTIONAL LOGIN FORM (Search & Select) */}
              {loginMode === "INSTITUTE" && (
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Search and Select Your Institution *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type college name (e.g., IIT, Xavier, D. Y. Patil, Govt)..."
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 36px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          boxSizing: "border-box",
                        }}
                      />
                      <Search
                        size={16}
                        color="#64748b"
                        style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>
                    Clicking your college immediately dispatches an OTP to <strong>+91 8767434172</strong>.
                  </div>

                  {/* Search Results List */}
                  <div
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      background: "#ffffff",
                    }}
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map((c) => (
                        <div
                          key={c.aicte_id}
                          onClick={() => handleSelectCollegeTriggerOtp(c)}
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                        >
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265" }}>{c.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            AICTE ID: {c.aicte_id} • {c.district}, {c.state}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                        {searchQuery ? "No matching institution found." : "Type above to search from 13,000+ AICTE colleges."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. STAKEHOLDER (AICTE) LOGIN FORM */}
              {loginMode === "STAKEHOLDER" && (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#f5f3ff",
                      color: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px auto",
                    }}
                  >
                    <ShieldAlert size={32} />
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265", marginBottom: "6px" }}>
                    AICTE Central Regulatory Bureau
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                    Authorized access for vigilance officers, state auditors, and central regulatory commissioners.
                  </p>

                  <button
                    onClick={handleStakeholderTriggerOtp}
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: "#7c3aed",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {loading ? "Dispatching 2FA OTP..." : "Send Regulator OTP to +91 8767434172 →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: ENTER OTP OR USE PHONE.EMAIL WIDGET */}
          {/* ============================================================== */}
          {step === 2 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px auto",
                  }}
                >
                  <KeyRound size={26} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265", margin: 0 }}>
                  Enter Verification Code
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>{otpMessage}</p>
              </div>

              <form
                onSubmit={
                  loginMode === "STUDENT"
                    ? handleStudentVerifyOtp
                    : loginMode === "STAKEHOLDER"
                    ? handleStakeholderVerifyOtp
                    : handleInstituteVerifyOtp
                }
              >
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    6-Digit One-Time Password (OTP) *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "2px solid #0B2265",
                      fontSize: "22px",
                      letterSpacing: "6px",
                      textAlign: "center",
                      fontWeight: 800,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* 1-Click Autofill Button for test convenience */}
                <button
                  type="button"
                  onClick={() => setOtp("123456")}
                  style={{
                    width: "100%",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px dashed #93c5fd",
                    padding: "8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginBottom: "14px",
                  }}
                >
                  ⚡ Autofill Master Test OTP: 123456
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "#FF5722",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    marginBottom: "16px",
                  }}
                >
                  {loading ? "Verifying..." : "Verify OTP & Enter Portal →"}
                </button>
              </form>

              {/* Or use phone.email 1-Tap Widget */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", textAlign: "center" }}>
                <SignInButton onVerified={handlePhoneEmailVerified} />
              </div>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                  }}
                  style={{ background: "none", border: "none", fontSize: "12px", color: "#64748b", cursor: "pointer", textDecoration: "underline" }}
                >
                  ← Back to Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
