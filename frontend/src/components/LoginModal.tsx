import React, { useState, useEffect } from "react";
import { searchInstitutions, loginStep2, loginStep3 } from "../api";
import { UserAuthContext } from "../types";
import {
  X,
  Search,
  Lock,
  KeyRound,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (authData: UserAuthContext) => void;
  initialAicteId?: string;
  initialCollegeName?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialAicteId,
  initialCollegeName,
}) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Search & Select
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<{ aicte_id: string; name: string } | null>(null);

  // Step 2: Password
  const [password, setPassword] = useState<string>("aicte@123");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Step 3: OTP
  const [otp, setOtp] = useState<string>("");
  const [simulatedOtp, setSimulatedOtp] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [otpMessage, setOtpMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialAicteId && initialCollegeName) {
      setSelectedCollege({ aicte_id: initialAicteId, name: initialCollegeName });
      setStep(2);
    }
  }, [initialAicteId, initialCollegeName]);

  // Live search institutions for Step 1
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      searchInstitutions(searchQuery).then((res) => {
        setSearchResults(res || []);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectCollege = (c: any) => {
    setSelectedCollege({ aicte_id: c.aicte_id, name: c.name });
    setErrorMsg("");
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await loginStep2(selectedCollege.aicte_id, password);
      setSessionToken(res.session_token);
      setSimulatedOtp(res.simulated_otp);
      setOtpMessage(res.message);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await loginStep3(selectedCollege.aicte_id, otp || simulatedOtp, sessionToken);
      localStorage.setItem("aicte_token", res.access_token);
      onLoginSuccess({
        token: res.access_token,
        aicte_id: res.aicte_id,
        college_name: res.college_name,
        role: res.role,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={16} />
            <h3 style={{ fontSize: "14px", fontWeight: 700 }}>
              AICTE Institute Secure Login (3-Step Authentication)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Stepper Progress */}
          <div className="stepper-header">
            <div style={{ textAlign: "center" }}>
              <div className={`step-circle ${step >= 1 ? (step > 1 ? "completed" : "active") : ""}`}>
                {step > 1 ? <CheckCircle2 size={16} /> : "1"}
              </div>
              <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: 600 }}>Select Institute</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div className={`step-circle ${step >= 2 ? (step > 2 ? "completed" : "active") : ""}`}>
                {step > 2 ? <CheckCircle2 size={16} /> : "2"}
              </div>
              <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: 600 }}>Password</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div className={`step-circle ${step === 3 ? "active" : ""}`}>
                3
              </div>
              <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: 600 }}>2FA OTP</div>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #f87171",
                color: "#991b1b",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* -------------------------------------------------------------
              STEP 1: Institute Search & Selection
              ------------------------------------------------------------- */}
          {step === 1 && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                Step 1: Search & Select AICTE Approved Institution
              </label>
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <input
                  type="text"
                  className="filter-input"
                  style={{ paddingLeft: "32px" }}
                  placeholder="Type college name or AICTE ID (e.g. Xavier, Government, 1-44...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "#64748b" }} />
              </div>

              {/* Autocomplete Dropdown List */}
              <div
                style={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  background: "#ffffff",
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                    {searchQuery
                      ? "No matching institutes found."
                      : "Start typing to search institutes from the master registry..."}
                  </div>
                ) : (
                  searchResults.map((c) => (
                    <div
                      key={c.aicte_id}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                      onClick={() => handleSelectCollege(c)}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#0B2265" }}>{c.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        ID: <b>{c.aicte_id}</b> | {c.district}, {c.state}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              STEP 2: Password Entry
              ------------------------------------------------------------- */}
          {step === 2 && selectedCollege && (
            <form onSubmit={handleStep2Submit}>
              <div
                style={{
                  background: "#f0f7ff",
                  padding: "10px 14px",
                  borderRadius: "4px",
                  marginBottom: "16px",
                  fontSize: "12px",
                }}
              >
                <div style={{ color: "#64748b" }}>Logging in for:</div>
                <div style={{ fontWeight: 700, color: "#0B2265" }}>{selectedCollege.name}</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>AICTE ID: {selectedCollege.aicte_id}</div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Institutional Portal Password:
                </label>
                <input
                  type="password"
                  className="filter-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter institutional password"
                  required
                />
                <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontWeight: 600 }}>
                  Demo Master Password: <code>aicte@123</code>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <button
                  type="button"
                  style={{
                    background: "#e2e8f0",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-filter-submit"
                  style={{ width: "auto", flexGrow: 1, marginTop: 0 }}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Proceed to 2FA OTP"}
                </button>
              </div>
            </form>
          )}

          {/* -------------------------------------------------------------
              STEP 3: Simulated 2FA OTP
              ------------------------------------------------------------- */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit}>
              <div
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "#92400e", fontWeight: 600, marginBottom: "6px" }}>
                  {otpMessage || "OTP has been dispatched to registered Nodal Officer contact."}
                </div>

                {/* Simulated OTP Display for Evaluator */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "2px dashed #f59e0b",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    display: "inline-block",
                    margin: "6px 0",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", fontWeight: 700 }}>
                    Simulated SMS/Email Gateway Code
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "4px", color: "#d97706" }}>
                    {simulatedOtp || "482910"}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    style={{
                      background: "#0B2265",
                      color: "#ffffff",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                    onClick={() => setOtp(simulatedOtp || "482910")}
                  >
                    <Sparkles size={11} /> 1-Click Auto-Fill Code
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Enter 6-Digit OTP:
                </label>
                <input
                  type="text"
                  className="filter-input"
                  style={{ fontSize: "18px", letterSpacing: "4px", textAlign: "center", fontWeight: 700 }}
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="••••••"
                  required
                />
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", textAlign: "center" }}>
                  Master Bypass OTP: <code>123456</code>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <button
                  type="button"
                  style={{
                    background: "#e2e8f0",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-filter-submit"
                  style={{ width: "auto", flexGrow: 1, marginTop: 0 }}
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Verify OTP & Enter Dashboard"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
