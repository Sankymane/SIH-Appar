import React, { useState, useEffect } from "react";
import { searchInstitutions, verifyPhoneEmail, registerStudent } from "../api";
import { UserAuthContext } from "../types";
import { SignInButton } from "./SignInButton";
import {
  X,
  Search,
  ShieldCheck,
  Building,
  GraduationCap,
  ShieldAlert,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound
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
  const [studentAction, setStudentAction] = useState<"SIGNIN" | "REGISTER">("SIGNIN");

  // Optional Institute selection for institutional login
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<{ aicte_id: string; name: string } | null>(null);

  // Student Registration Form State
  const [regFullName, setRegFullName] = useState<string>("");
  const [regMobile, setRegMobile] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regCollegeQuery, setRegCollegeQuery] = useState<string>("");
  const [regCollegeResults, setRegCollegeResults] = useState<any[]>([]);
  const [regCollege, setRegCollege] = useState<{ aicte_id: string; name: string } | null>(null);
  const [regProgram, setRegProgram] = useState<string>("Engineering and Technology");
  const [regDepartment, setRegDepartment] = useState<string>("Computer Science and Engineering");
  const [regGender, setRegGender] = useState<string>("Male");
  const [regCategory, setRegCategory] = useState<string>("General");
  const [regDob, setRegDob] = useState<string>("2004-06-15");
  const [regApaarId, setRegApaarId] = useState<string>("");
  const [regEnrollment, setRegEnrollment] = useState<string>("");
  const [regSubmitting, setRegSubmitting] = useState<boolean>(false);
  const [regSuccessData, setRegSuccessData] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    setLoginMode(initialMode);
    setErrorMsg("");
    setStudentAction("SIGNIN");
    setRegSuccessData(null);
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

  // Live autocomplete search for colleges in student registration
  useEffect(() => {
    if (studentAction === "REGISTER" && regCollegeQuery.trim().length >= 1) {
      searchInstitutions(regCollegeQuery).then((res) => {
        setRegCollegeResults(res || []);
      });
    } else {
      setRegCollegeResults([]);
    }
  }, [regCollegeQuery, studentAction]);

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

  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setErrorMsg("Please enter your full name as per official academic records.");
      return;
    }
    const cleanPhone = regMobile.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    const collegeAicteId = regCollege?.aicte_id || "1-44465113304";

    setRegSubmitting(true);
    setErrorMsg("");
    try {
      const res = await registerStudent({
        full_name: regFullName.trim(),
        mobile_number: cleanPhone,
        email: regEmail.trim() || undefined,
        aicte_id: collegeAicteId,
        program: regProgram,
        department: regDepartment.trim() || "Computer Science and Engineering",
        level: "UG",
        academic_year: "2026-2027",
        enrollment_no: regEnrollment.trim() || undefined,
        apaar_id: regApaarId.trim() || undefined,
        gender: regGender,
        category: regCategory,
        date_of_birth: regDob
      });

      setRegSuccessData(res);
      if (res.access_token) {
        localStorage.setItem("aicte_token", res.access_token);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register student record.");
    } finally {
      setRegSubmitting(false);
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

          {/* 1. STUDENT LOGIN & REGISTRATION */}
          {loginMode === "STUDENT" && (
            <div>
              {/* Sub-tabs: Sign In vs Register Now */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginBottom: "20px",
                  background: "#f1f5f9",
                  padding: "4px",
                  borderRadius: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStudentAction("SIGNIN");
                    setErrorMsg("");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "6px",
                    background: studentAction === "SIGNIN" ? "#0B2265" : "transparent",
                    color: studentAction === "SIGNIN" ? "#ffffff" : "#475569",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <KeyRound size={14} /> Sign In with Phone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentAction("REGISTER");
                    setErrorMsg("");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "6px",
                    background: studentAction === "REGISTER" ? "#FF5722" : "transparent",
                    color: studentAction === "REGISTER" ? "#ffffff" : "#475569",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <UserPlus size={14} /> Register Now (New Student)
                </button>
              </div>

              {/* ACTION A: SIGN IN */}
              {studentAction === "SIGNIN" && (
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
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.5 }}>
                    Authenticate with your verified mobile number. Already registered students (or <strong>8767434172</strong> for Sankalp Mane) will have their records retrieved automatically.
                  </p>

                  {/* The ONLY authentication element */}
                  <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                    <SignInButton clientId="11374656146720138530" onVerified={handlePhoneEmailVerified} />
                  </div>

                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>First time here? </span>
                    <button
                      type="button"
                      onClick={() => setStudentAction("REGISTER")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#FF5722",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Register your student account now →
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION B: REGISTER NOW */}
              {studentAction === "REGISTER" && (
                <div>
                  {regSuccessData ? (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          background: "#ecfdf5",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px auto",
                        }}
                      >
                        <CheckCircle2 size={34} />
                      </div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265", marginBottom: "6px" }}>
                        Registration Verified & Stored!
                      </h3>
                      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>
                        Your student profile is now registered in the National AICTE-APAAR database.
                      </p>

                      <div
                        style={{
                          background: "#f8fafc",
                          border: "2px dashed #059669",
                          borderRadius: "10px",
                          padding: "16px",
                          marginBottom: "20px",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                          Assigned APAAR ID
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#0B2265", letterSpacing: "2px", margin: "4px 0 10px 0" }}>
                          {regSuccessData.apaar_id}
                        </div>
                        <div style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>
                          Name: <strong>{regSuccessData.full_name}</strong>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Registered Mobile: <strong>+91 {regSuccessData.mobile_number}</strong>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Institution: <strong>{regSuccessData.college_name}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (regSuccessData.access_token) {
                            onLoginSuccess({
                              token: regSuccessData.access_token,
                              aicte_id: regSuccessData.aicte_id,
                              college_name: regSuccessData.college_name,
                              role: "STUDENT",
                              apaar_id: regSuccessData.apaar_id,
                              student_name: regSuccessData.full_name,
                            });
                            onClose();
                          } else {
                            setStudentAction("SIGNIN");
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "#FF5722",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 4px 12px rgba(255, 87, 34, 0.3)",
                        }}
                      >
                        Proceed to Student Dashboard <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleStudentRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ textAlign: "center", marginBottom: "6px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0B2265", margin: "0 0 4px 0" }}>
                          AICTE Student Registry Enrollment
                        </h3>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                          Enter your details below. You will be able to sign in anytime with this mobile number.
                        </p>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                          Full Name (as per Academic Records) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AARAV PRADEEP SHARMA"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Mobile Number & Email */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit mobile"
                            value={regMobile}
                            onChange={(e) => setRegMobile(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="student@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>

                      {/* Institution Autocomplete */}
                      <div style={{ position: "relative" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                          Institution / College *
                        </label>
                        {regCollege ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              background: "#f0fdf4",
                              border: "1px solid #86efac",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: "#166534" }}>{regCollege.name}</div>
                              <div style={{ fontSize: "11px", color: "#15803d" }}>AICTE ID: {regCollege.aicte_id}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRegCollege(null);
                                setRegCollegeQuery("");
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              placeholder="Type college name or AICTE ID..."
                              value={regCollegeQuery}
                              onChange={(e) => setRegCollegeQuery(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "9px 12px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "13px",
                                boxSizing: "border-box",
                              }}
                            />
                            {regCollegeResults.length > 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  background: "#ffffff",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                  zIndex: 100,
                                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                {regCollegeResults.map((c) => (
                                  <div
                                    key={c.aicte_id}
                                    onClick={() => {
                                      setRegCollege(c);
                                      setRegCollegeResults([]);
                                      setRegCollegeQuery("");
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
                        )}
                      </div>

                      {/* Department & Program */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Program
                          </label>
                          <select
                            value={regProgram}
                            onChange={(e) => setRegProgram(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              background: "#ffffff",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="Engineering and Technology">Engineering and Technology</option>
                            <option value="Management">Management</option>
                            <option value="Pharmacy">Pharmacy</option>
                            <option value="MCA">MCA</option>
                            <option value="Architecture">Architecture</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Department / Branch *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Computer Science and Engineering"
                            value={regDepartment}
                            onChange={(e) => setRegDepartment(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>

                      {/* Gender, Category, DOB */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Gender
                          </label>
                          <select
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 10px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              background: "#ffffff",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Category
                          </label>
                          <select
                            value={regCategory}
                            onChange={(e) => setRegCategory(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "9px 10px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              background: "#ffffff",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="General">General</option>
                            <option value="OBC-NCL">OBC-NCL</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={regDob}
                            onChange={(e) => setRegDob(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 8px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>

                      {/* Optional APAAR ID and Roll Number */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Existing APAAR ID (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={12}
                            placeholder="Leave blank to auto-generate"
                            value={regApaarId}
                            onChange={(e) => setRegApaarId(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Roll / Enrollment No (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. EN26CS091"
                            value={regEnrollment}
                            onChange={(e) => setRegEnrollment(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={regSubmitting}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "#FF5722",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "14px",
                          cursor: regSubmitting ? "not-allowed" : "pointer",
                          marginTop: "6px",
                          boxShadow: "0 4px 12px rgba(255, 87, 34, 0.3)",
                        }}
                      >
                        {regSubmitting ? "Registering & Validating..." : "Register & Generate APAAR ID"}
                      </button>

                      <div style={{ textAlign: "center", marginTop: "4px" }}>
                        <button
                          type="button"
                          onClick={() => setStudentAction("SIGNIN")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0B2265",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          ← Already have an account? Sign In with Phone
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
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
                <SignInButton clientId="11374656146720138530" onVerified={handlePhoneEmailVerified} />
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
                <SignInButton clientId="11374656146720138530" onVerified={handlePhoneEmailVerified} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
