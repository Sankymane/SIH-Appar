import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  PhoneCall,
  Search,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Lock,
  Key,
  ShieldCheck,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Award,
  ArrowLeft,
  ExternalLink,
  X,
  GraduationCap
} from "lucide-react";
import {
  StakeholderDirectoryItem,
  StakeholderAlertItem,
  ForecastingResult,
  StudentRemark,
  UserAuthContext,
  Student,
  AnalyticsData,
  CourseIntake
} from "../types";
import {
  fetchStakeholderDirectory,
  fetchStakeholderAlerts,
  fetchStakeholderForecasting,
  requestSecondaryActionOtp,
  stakeholderAddCollege,
  stakeholderRemoveCollege,
  fetchStakeholderRemarks,
  updateStakeholderRemark,
  fetchAuditTrail,
  fetchStudents,
  fetchAnalytics,
  fetchInstitutionDetail
} from "../api";
import { AuditTrailView } from "./AuditTrailView";
import { AutomatedValidationBanner } from "./AutomatedValidationBanner";
import { CertificatePreviewModal } from "./CertificatePreviewModal";
import { DocumentVerificationModule } from "./DocumentVerificationModule";

interface StakeholderDashboardProps {
  auth: UserAuthContext;
}

export const StakeholderDashboard: React.FC<StakeholderDashboardProps> = ({ auth }) => {
  const [activeTab, setActiveTab] = useState<"alerts" | "directory" | "management" | "forecasting" | "remarks" | "audit" | "verification">("alerts");

  // State data
  const [alerts, setAlerts] = useState<StakeholderAlertItem[]>([]);
  const [directory, setDirectory] = useState<StakeholderDirectoryItem[]>([]);
  const [forecastingList, setForecastingList] = useState<ForecastingResult[]>([]);
  const [remarks, setRemarks] = useState<StudentRemark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Directory Search & Filters
  const [dirSearch, setDirSearch] = useState<string>("");
  const [dirState, setDirState] = useState<string>("--All--");
  const [dirType, setDirType] = useState<string>("--All--");

  // Secondary OTP Modal State for High-Security Admin Actions
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<"ADD_COLLEGE" | "REMOVE_COLLEGE" | null>(null);
  const [actionPayload, setActionPayload] = useState<any>(null);
  const [secondarySessionToken, setSecondarySessionToken] = useState<string>("");
  const [secondaryOtpInput, setSecondaryOtpInput] = useState<string>("");
  const [simulatedSecondaryOtp, setSimulatedSecondaryOtp] = useState<string>("");
  const [otpActionError, setOtpActionError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Add College Form Fields
  const [newCollegeName, setNewCollegeName] = useState<string>("");
  const [newCollegeId, setNewCollegeId] = useState<string>("");
  const [newCollegeDistrict, setNewCollegeDistrict] = useState<string>("");
  const [newCollegeState, setNewCollegeState] = useState<string>("Maharashtra");
  const [newCollegeType, setNewCollegeType] = useState<string>("Private-Self Financing");
  const [newCollegeIntake, setNewCollegeIntake] = useState<number>(120);

  // Selected Forecast for deep view
  const [selectedForecastIndex, setSelectedForecastIndex] = useState<number>(0);

  // Selected College for Master Roster inspection
  const [selectedCollegeForRoster, setSelectedCollegeForRoster] = useState<{
    aicte_id: string;
    name: string;
    district?: string;
    state?: string;
    institution_type?: string;
    total_approved_intake?: number;
    total_enrolled?: number;
    compliance_status?: string;
    registered_phone?: string;
  } | null>(null);

  // Roster inspection states
  const [rosterStudents, setRosterStudents] = useState<Student[]>([]);
  const [rosterTotal, setRosterTotal] = useState<number>(0);
  const [rosterAnalytics, setRosterAnalytics] = useState<AnalyticsData | null>(null);
  const [rosterCourses, setRosterCourses] = useState<CourseIntake[]>([]);
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [rosterStatusFilter, setRosterStatusFilter] = useState<string>("--All--");
  const [rosterDeptFilter, setRosterDeptFilter] = useState<string>("--All--");
  const [rosterMaskPii, setRosterMaskPii] = useState<boolean>(false);
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterPageSize, setRosterPageSize] = useState<number>(15);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  const loadRosterData = async (aicteId: string) => {
    setRosterLoading(true);
    try {
      const [studentsRes, analyticsRes, detailRes] = await Promise.all([
        fetchStudents({
          aicte_id: aicteId,
          department: rosterDeptFilter !== "--All--" ? rosterDeptFilter : undefined,
          status: rosterStatusFilter !== "--All--" ? rosterStatusFilter : undefined,
          search: rosterSearch,
          mask_pii: rosterMaskPii,
          page: rosterPage,
          page_size: rosterPageSize,
        }),
        fetchAnalytics(aicteId),
        fetchInstitutionDetail(aicteId),
      ]);
      setRosterStudents(studentsRes.records || []);
      setRosterTotal(studentsRes.total || 0);
      setRosterAnalytics(analyticsRes);
      if (detailRes && detailRes.courses && detailRes.courses.length > 0) {
        setRosterCourses(detailRes.courses);
      } else {
        setRosterCourses([]);
      }
    } catch (err) {
      console.error("Failed to load college roster:", err);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollegeForRoster) {
      loadRosterData(selectedCollegeForRoster.aicte_id);
    }
  }, [selectedCollegeForRoster, rosterPage, rosterPageSize, rosterStatusFilter, rosterDeptFilter, rosterMaskPii]);

  const handleSelectCollegeForRoster = (college: {
    aicte_id: string;
    name: string;
    district?: string;
    state?: string;
    institution_type?: string;
    total_approved_intake?: number;
    total_enrolled?: number;
    compliance_status?: string;
    registered_phone?: string;
  }) => {
    setSelectedCollegeForRoster(college);
    setRosterPage(1);
    setRosterSearch("");
    setRosterStatusFilter("--All--");
    setRosterDeptFilter("--All--");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return <span className="badge-status badge-valid"><CheckCircle2 size={11} /> Valid & Verified</span>;
      case "CROSS_INSTITUTION_DUPLICATE":
        return <span className="badge-status badge-error"><AlertTriangle size={11} /> Cross-Institute Conflict</span>;
      case "DUPLICATE_APAAR":
        return <span className="badge-status badge-error"><AlertTriangle size={11} /> Same-College Duplicate</span>;
      case "INTAKE_EXCEEDED":
        return <span className="badge-status badge-error"><AlertTriangle size={11} /> Intake Exceeded</span>;
      case "MISSING_APAAR":
        return <span className="badge-status badge-warning">Missing APAAR ID</span>;
      case "INVALID_APAAR_FORMAT":
        return <span className="badge-status badge-warning">Invalid Format</span>;
      case "DATA_INCONSISTENCY":
        return <span className="badge-status badge-info">Inconsistent Quota</span>;
      default:
        return <span className="badge-status badge-info">{status}</span>;
    }
  };

  const availableDepts = Array.from(
    new Set([
      ...rosterCourses.map((c) => c.department),
      ...rosterStudents.map((s) => s.department),
    ])
  ).filter(Boolean);
  const displayDepartments = availableDepts.length > 0 ? availableDepts : [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics & Telecommunication",
    "Mechanical Engineering",
    "Civil Engineering"
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertData, dirData, forecastData, remarkData] = await Promise.all([
        fetchStakeholderAlerts(),
        fetchStakeholderDirectory({ query: dirSearch, state: dirState, institution_type: dirType }),
        fetchStakeholderForecasting(),
        fetchStakeholderRemarks(),
      ]);
      setAlerts(alertData);
      setDirectory(dirData);
      setForecastingList(forecastData.forecasts || []);
      setRemarks(remarkData);
    } catch (err: any) {
      console.error("Stakeholder data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dirSearch, dirState, dirType]);

  // Trigger Secondary OTP for Add College
  const handleInitiateAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName || !newCollegeId || !newCollegeDistrict) {
      alert("Please enter all required college details.");
      return;
    }

    try {
      const res = await requestSecondaryActionOtp("ADD_COLLEGE", newCollegeId);
      setSecondarySessionToken(res.session_token);
      setSimulatedSecondaryOtp(res.simulated_otp);
      setPendingAction("ADD_COLLEGE");
      setActionPayload({
        aicte_id: newCollegeId,
        name: newCollegeName,
        district: newCollegeDistrict,
        state: newCollegeState,
        institution_type: newCollegeType,
        total_approved_intake: Number(newCollegeIntake),
        programs: "Engineering and Technology",
      });
      setSecondaryOtpInput("");
      setOtpActionError(null);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to trigger secondary OTP");
    }
  };

  // Trigger Secondary OTP for Remove College
  const handleInitiateRemoveCollege = async (college: StakeholderDirectoryItem) => {
    const confirmChoice = window.confirm(
      `Are you sure you want to revoke approval and deactivate "${college.name}" (${college.aicte_id})?\n\nA secondary 2FA OTP will be dispatched to your authorized administrator mobile to confirm this regulatory action.`
    );
    if (!confirmChoice) return;

    try {
      const res = await requestSecondaryActionOtp("REMOVE_COLLEGE", college.aicte_id);
      setSecondarySessionToken(res.session_token);
      setSimulatedSecondaryOtp(res.simulated_otp);
      setPendingAction("REMOVE_COLLEGE");
      setActionPayload({ aicte_id: college.aicte_id, college_name: college.name });
      setSecondaryOtpInput("");
      setOtpActionError(null);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to trigger secondary OTP");
    }
  };

  // Confirm Secondary OTP and Execute Action
  const handleConfirmSecondaryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpActionError(null);

    try {
      if (pendingAction === "ADD_COLLEGE") {
        await stakeholderAddCollege({
          ...actionPayload,
          secondary_otp: secondaryOtpInput.trim(),
          session_token: secondarySessionToken,
        });
        setActionSuccessMsg(`Institution "${actionPayload.name}" successfully added to AICTE registry after secondary authorization.`);
        // Reset form
        setNewCollegeName("");
        setNewCollegeId("");
        setNewCollegeDistrict("");
      } else if (pendingAction === "REMOVE_COLLEGE") {
        await stakeholderRemoveCollege(
          actionPayload.aicte_id,
          secondaryOtpInput.trim(),
          secondarySessionToken,
          "Regulatory compliance sanction revoked"
        );
        setActionSuccessMsg(`Institution "${actionPayload.college_name}" approval revoked and deactivated.`);
      }

      setIsOtpModalOpen(false);
      setPendingAction(null);
      setActionPayload(null);
      loadData();
    } catch (err: any) {
      setOtpActionError(err.message || "Secondary OTP verification failed");
    }
  };

  // Handle Remark Resolution
  const handleResolveRemark = async (remarkId: number, newStatus: string) => {
    const notes = prompt("Enter resolution remarks / notes:", "Verified with state admissions authority; record updated.");
    if (notes === null) return;

    try {
      await updateStakeholderRemark(remarkId, newStatus, notes);
      const updatedRemarks = await fetchStakeholderRemarks();
      setRemarks(updatedRemarks);
    } catch (err: any) {
      alert(err.message || "Failed to update remark status");
    }
  };

  const selectedForecast = forecastingList[selectedForecastIndex] || forecastingList[0];

  return (
    <div style={{ maxWidth: "1280px", margin: "24px auto", padding: "0 20px" }}>
      
      {/* Bureau Masthead Banner */}
      <div
        style={{
          background: "#0B2265",
          color: "#ffffff",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(11, 34, 101, 0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            <ShieldCheck size={14} color="#f97316" />
            AICTE CENTRAL REGULATORY & VIGILANCE BUREAU
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "2px 0 6px 0" }}>
            National Stakeholder Compliance & Oversight Portal
          </h1>
          <p style={{ fontSize: "13px", opacity: 0.85, maxWidth: "750px", lineHeight: 1.4, margin: 0 }}>
            Real-time inspection of institutional compliance, transparent OTP phone registry, 
            tamper-evident 2FA administrative college management, and AI-driven intake forecasting models.
          </p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", padding: "12px 18px", borderRadius: "8px", textAlign: "right" }}>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>Administrator Status</div>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#22c55e", letterSpacing: "0.5px" }}>
            2FA Active
          </div>
          <div style={{ fontSize: "10px", opacity: 0.7 }}>Multi-Role Security Enforced</div>
        </div>
      </div>

      {actionSuccessMsg && (
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
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} color="#16a34a" />
            {actionSuccessMsg}
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", color: "#166534" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metric Pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "24px"
        }}
      >
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>TOTAL APPROVED INSTITUTIONS</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#0B2265", marginTop: "4px" }}>{directory.length}</div>
          <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px" }}>Across 36 States & UTs</div>
        </div>

        <div style={{ background: "#fff1f2", padding: "16px", borderRadius: "8px", border: "1px solid #fecdd3" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#e11d48" }}>HIGH-PRIORITY ALERTS</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#be123c", marginTop: "4px" }}>{alerts.length}</div>
          <div style={{ fontSize: "11px", color: "#e11d48", marginTop: "2px" }}>Intake limits & duplicate APAARs</div>
        </div>

        <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "8px", border: "1px solid #fef3c7" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#b45309" }}>PREDICTIVE SURGE WARNINGS (&gt;30%)</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#b45309", marginTop: "4px" }}>
            {forecastingList.filter((f) => f.is_critical_overflow).length}
          </div>
          <div style={{ fontSize: "11px", color: "#b45309", marginTop: "2px" }}>Early warnings before admission season</div>
        </div>

        <div style={{ background: "#f5f3ff", padding: "16px", borderRadius: "8px", border: "1px solid #ddd6fe" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#6d28d9" }}>STUDENT DISCREPANCY REMARKS</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#6d28d9", marginTop: "4px" }}>{remarks.length}</div>
          <div style={{ fontSize: "11px", color: "#6d28d9", marginTop: "2px" }}>Reported from ABC / DigiLocker</div>
        </div>
      </div>

      {/* Stakeholder Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0",
          gap: "8px",
          marginBottom: "24px",
          overflowX: "auto"
        }}
      >
        <button
          onClick={() => {
            setActiveTab("alerts");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "alerts" ? "3px solid #e11d48" : "none",
            color: !selectedCollegeForRoster && activeTab === "alerts" ? "#e11d48" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <AlertTriangle size={16} />
          Highlighted Alerts ({alerts.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("directory");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "directory" ? "3px solid #0B2265" : "none",
            color: !selectedCollegeForRoster && activeTab === "directory" ? "#0B2265" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <PhoneCall size={16} />
          Registered Phone Directory
        </button>

        <button
          onClick={() => {
            setActiveTab("management");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "management" ? "3px solid #FF5722" : "none",
            color: !selectedCollegeForRoster && activeTab === "management" ? "#FF5722" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Building2 size={16} />
          Institute Management (2FA Add/Remove)
        </button>

        <button
          onClick={() => {
            setActiveTab("forecasting");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "forecasting" ? "3px solid #7c3aed" : "none",
            color: !selectedCollegeForRoster && activeTab === "forecasting" ? "#7c3aed" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <TrendingUp size={16} />
          Intake Forecasting & Predictive Alerts
        </button>

        <button
          onClick={() => {
            setActiveTab("remarks");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "remarks" ? "3px solid #0284c7" : "none",
            color: !selectedCollegeForRoster && activeTab === "remarks" ? "#0284c7" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Users size={16} />
          Student Grievances Desk ({remarks.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("audit");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "audit" ? "3px solid #475569" : "none",
            color: !selectedCollegeForRoster && activeTab === "audit" ? "#0B2265" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Clock size={16} />
          System Audit Trail
        </button>

        <button
          onClick={() => {
            setActiveTab("verification");
            setSelectedCollegeForRoster(null);
          }}
          style={{
            padding: "10px 18px",
            border: "none",
            background: !selectedCollegeForRoster && activeTab === "verification" ? "rgba(5, 150, 105, 0.08)" : "none",
            borderBottom: !selectedCollegeForRoster && activeTab === "verification" ? "3px solid #059669" : "none",
            color: !selectedCollegeForRoster && activeTab === "verification" ? "#065f46" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "6px 6px 0 0"
          }}
        >
          <ShieldCheck size={16} style={{ color: !selectedCollegeForRoster && activeTab === "verification" ? "#059669" : "inherit" }} />
          Document Forgery Detection (PhotoHolmes)
        </button>

        {selectedCollegeForRoster && (
          <button
            style={{
              padding: "10px 18px",
              border: "none",
              background: "#eff6ff",
              borderBottom: "3px solid #FF5722",
              color: "#0B2265",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "default",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "6px 6px 0 0"
            }}
          >
            <Users size={16} color="#FF5722" />
            Active Roster: {selectedCollegeForRoster.aicte_id}
          </button>
        )}
      </div>

      {/* CONDITIONAL CONTENT: STUDENT MASTER ROSTER VIEW OR STANDARD TABS */}
      {selectedCollegeForRoster ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Breadcrumb Navigation Bar with Back & Switcher */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedCollegeForRoster(null)}
                style={{
                  background: "#0B2265",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                title="Return to Stakeholder Dashboard"
              >
                <ArrowLeft size={16} /> Back to Directory & Institutions
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b" }}>
                <span>Stakeholder Portal</span>
                <span>/</span>
                <span>Institutional Registry</span>
                <span>/</span>
                <span style={{ color: "#0B2265", fontWeight: 700 }}>{selectedCollegeForRoster.name}</span>
              </div>
            </div>

            {/* Quick Switcher dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Switch Institution:</span>
              <select
                value={selectedCollegeForRoster.aicte_id}
                onChange={(e) => {
                  const found = directory.find((d) => d.aicte_id === e.target.value);
                  if (found) {
                    handleSelectCollegeForRoster(found);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  maxWidth: "280px",
                  background: "#f8fafc",
                  color: "#0B2265",
                  fontWeight: 600
                }}
              >
                {directory.map((col) => (
                  <option key={col.aicte_id} value={col.aicte_id}>
                    {col.name} ({col.aicte_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Institutional Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #0B2265 0%, #071744 100%)",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "20px 24px",
              boxShadow: "0 4px 12px rgba(11, 34, 101, 0.15)",
              borderLeft: "6px solid #FF5722"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ flex: 1, minWidth: "300px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span
                    style={{
                      background: "#FF5722",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    AICTE APPROVED INSTITUTION
                  </span>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "#f8fafc",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "4px",
                      fontFamily: "monospace"
                    }}
                  >
                    ID: {selectedCollegeForRoster.aicte_id}
                  </span>
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.3px", color: "#ffffff" }}>
                  {selectedCollegeForRoster.name}
                </h2>

                <div style={{ fontSize: "13px", color: "#cbd5e1", display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
                  {selectedCollegeForRoster.district && selectedCollegeForRoster.state && (
                    <span>📍 {selectedCollegeForRoster.district}, {selectedCollegeForRoster.state}</span>
                  )}
                  {selectedCollegeForRoster.institution_type && (
                    <span>🏛️ {selectedCollegeForRoster.institution_type}</span>
                  )}
                  {selectedCollegeForRoster.registered_phone && (
                    <span>📱 2FA Nodal: +91 •••••{selectedCollegeForRoster.registered_phone.slice(-4)}</span>
                  )}
                  <span>
                    Compliance:{" "}
                    <strong
                      style={{
                        color: selectedCollegeForRoster.compliance_status === "EXCEEDED" ? "#fca5a5" : "#86efac"
                      }}
                    >
                      {selectedCollegeForRoster.compliance_status || "COMPLIANT"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 4 Summary KPIs */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px", minWidth: "100px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Approved Intake</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", marginTop: "2px" }}>
                    {rosterAnalytics?.total_approved_intake || selectedCollegeForRoster.total_approved_intake || 0}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px", minWidth: "100px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Total Enrolled</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
                    {rosterAnalytics?.total_enrolled_students || selectedCollegeForRoster.total_enrolled || rosterTotal || 0}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px", minWidth: "100px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>APAAR Seeding</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#4ade80", marginTop: "2px" }}>
                    {rosterAnalytics?.apaar_seeding_rate != null ? `${rosterAnalytics.apaar_seeding_rate}%` : "100%"}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px", minWidth: "100px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Flagged Records</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#f87171", marginTop: "2px" }}>
                    {rosterAnalytics?.total_flagged_violations ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Validation Engine Banner */}
          {rosterAnalytics && (
            <AutomatedValidationBanner
              statusBreakdown={rosterAnalytics.validation_status_breakdown}
              selectedFilter={rosterStatusFilter}
              onSelectFilter={(st) => {
                setRosterStatusFilter(st);
                setRosterPage(1);
              }}
            />
          )}

          {/* STUDENT DATA ROSTER TABLE */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0B2265", margin: 0 }}>
                  Student-Level Academic Registry (APAAR ID Master Roster)
                </h3>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                  Showing {rosterStudents.length} of {rosterTotal} student records for {selectedCollegeForRoster.name}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Department Filter */}
                <select
                  value={rosterDeptFilter}
                  onChange={(e) => {
                    setRosterDeptFilter(e.target.value);
                    setRosterPage(1);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    color: "#334155"
                  }}
                >
                  <option value="--All--">All Departments</option>
                  {displayDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* Privacy Masking Toggle */}
                <button
                  style={{
                    background: rosterMaskPii ? "#fef3c7" : "#f1f5f9",
                    color: rosterMaskPii ? "#92400e" : "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                  onClick={() => setRosterMaskPii(!rosterMaskPii)}
                  title="Toggle masked APAAR display (XXXX-XXXX-1234)"
                >
                  {rosterMaskPii ? <EyeOff size={13} /> : <Eye size={13} />}
                  {rosterMaskPii ? "Privacy Mode: Active" : "Mask APAAR"}
                </button>

                {/* Refresh Button */}
                <button
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => loadRosterData(selectedCollegeForRoster.aicte_id)}
                  title="Refresh student roster"
                >
                  <RefreshCw size={13} color="#475569" />
                </button>

                {/* Search Input */}
                <input
                  type="text"
                  className="dt-search-input"
                  placeholder="Search student, APAAR, roll..."
                  value={rosterSearch}
                  onChange={(e) => {
                    setRosterSearch(e.target.value);
                    setRosterPage(1);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && loadRosterData(selectedCollegeForRoster.aicte_id)}
                  style={{ minWidth: "220px" }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="aicte-table">
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>APAAR ID</th>
                    <th style={{ width: "10%" }}>Roll / Enrollment</th>
                    <th style={{ width: "16%" }}>Student Name</th>
                    <th style={{ width: "14%" }}>Department / Course</th>
                    <th style={{ width: "8%" }}>Quota</th>
                    <th style={{ width: "6%", textAlign: "center" }}>NRI/FN</th>
                    <th style={{ width: "18%" }}>Validation Engine Status</th>
                    <th style={{ width: "16%", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#FF5722" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          <RefreshCw size={16} /> Loading student academic registry records...
                        </div>
                      </td>
                    </tr>
                  ) : rosterStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                        No students found in this institution matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    rosterStudents.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, color: "#0B2265", fontFamily: "monospace", fontSize: "12px" }}>
                          {s.apaar_id || <span style={{ color: "#d97706" }}>[MISSING]</span>}
                        </td>
                        <td style={{ fontWeight: 600, color: "#475569" }}>{s.enrollment_no}</td>
                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                        <td style={{ fontSize: "11px" }}>{s.department}</td>
                        <td>
                          <span style={{ fontSize: "11px", fontWeight: 600 }}>{s.admission_type}</span>
                        </td>
                        <td style={{ textAlign: "center", fontSize: "11px" }}>
                          {s.is_nri ? "NRI" : s.is_fn ? "FN" : s.is_oci ? "OCI" : "-"}
                        </td>
                        <td>
                          <div>{getStatusBadge(s.validation_status)}</div>
                          {s.validation_remarks && (
                            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px", lineHeight: 1.2 }}>
                              {s.validation_remarks}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                          <button
                            style={{
                              background: "#0B2265",
                              color: "#ffffff",
                              border: "none",
                              padding: "3px 8px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              marginRight: "4px",
                            }}
                            onClick={() => setSelectedStudentForCert(s)}
                            title="Inspect sample Degree Certificate with APAAR ID Integration (PS 26263)"
                          >
                            <Award size={10} style={{ display: "inline", marginRight: "3px" }} /> Certificate
                          </button>

                          <button
                            style={{
                              background: "#f1f5f9",
                              color: "#0B2265",
                              border: "1px solid #cbd5e1",
                              padding: "3px 6px",
                              borderRadius: "3px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onClick={() => setSelectedStudentForDetail(s)}
                            title="View complete student academic profile"
                          >
                            <Eye size={11} style={{ display: "inline", marginRight: "2px" }} /> Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "12px", color: "#64748b" }}>
              <div>
                Showing page <strong>{rosterPage}</strong> of <strong>{Math.ceil(rosterTotal / rosterPageSize) || 1}</strong> ({rosterTotal} total students)
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  disabled={rosterPage <= 1}
                  onClick={() => setRosterPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: rosterPage <= 1 ? "#f1f5f9" : "#ffffff",
                    cursor: rosterPage <= 1 ? "not-allowed" : "pointer",
                    color: rosterPage <= 1 ? "#94a3b8" : "#0B2265",
                    fontWeight: 600
                  }}
                >
                  Previous
                </button>

                <button
                  disabled={rosterPage >= Math.ceil(rosterTotal / rosterPageSize)}
                  onClick={() => setRosterPage(p => p + 1)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: rosterPage >= Math.ceil(rosterTotal / rosterPageSize) ? "#f1f5f9" : "#ffffff",
                    cursor: rosterPage >= Math.ceil(rosterTotal / rosterPageSize) ? "not-allowed" : "pointer",
                    color: rosterPage >= Math.ceil(rosterTotal / rosterPageSize) ? "#94a3b8" : "#0B2265",
                    fontWeight: 600
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* TAB 1: HIGHLIGHTED HIGH-VISIBILITY ALERTS */}
      {activeTab === "alerts" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265" }}>
              Active Regulatory & Intake Non-Compliance Alerts
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              Bold, high-visibility flags generated by the automated validation engine and forecasting models.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {alerts.map((alert) => {
              const isCrit = alert.severity === "CRITICAL";
              return (
                <div
                  key={alert.id}
                  style={{
                    background: isCrit ? "#fff1f2" : "#fffbeb",
                    border: `2px solid ${isCrit ? "#e11d48" : "#f59e0b"}`,
                    borderRadius: "8px",
                    padding: "18px 20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: isCrit ? "#e11d48" : "#f59e0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        flexShrink: 0
                      }}
                    >
                      <AlertTriangle size={20} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span
                          style={{
                            background: isCrit ? "#be123c" : "#b45309",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            textTransform: "uppercase"
                          }}
                        >
                          {alert.severity} • {alert.alert_type.replace(/_/g, " ")}
                        </span>
                        <strong style={{ fontSize: "15px", color: isCrit ? "#9f1239" : "#92400e" }}>
                          {alert.title}
                        </strong>
                      </div>

                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                        <button
                          onClick={() => handleSelectCollegeForRoster({
                            aicte_id: alert.aicte_id,
                            name: alert.college_name,
                            compliance_status: "EXCEEDED"
                          })}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontWeight: 700,
                            color: "#0B2265",
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontSize: "13px"
                          }}
                          title="Click to view Student-Level Academic Registry (APAAR ID Master Roster)"
                        >
                          {alert.college_name}
                        </button>{" "}
                        <span style={{ color: "#64748b", fontWeight: 500 }}>({alert.aicte_id})</span>
                      </div>

                      <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                        {alert.details}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleSelectCollegeForRoster({
                        aicte_id: alert.aicte_id,
                        name: alert.college_name,
                        compliance_status: "EXCEEDED"
                      })}
                      style={{
                        background: "#0B2265",
                        color: "#fff",
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
                      title="Inspect all student records and APAAR validation statuses"
                    >
                      <Users size={14} /> Student Roster ({alert.aicte_id})
                    </button>

                    <button
                      onClick={() => {
                        setDirSearch(alert.college_name);
                        setActiveTab("directory");
                      }}
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
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
                      Inspect in Directory <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED PHONE DIRECTORY */}
      {activeTab === "directory" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265" }}>
                AICTE Approved Institutions & 2FA Phone Registry
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Transparent mapping of registered nodal phones receiving system 2FA authorization codes.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search college, AICTE ID, district..."
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  minWidth: "260px"
                }}
              />

              <select
                value={dirType}
                onChange={(e) => setDirType(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <option value="--All--">All Institution Types</option>
                <option value="Government">Government</option>
                <option value="Private-Self Financing">Private-Self Financing</option>
                <option value="Govt aided">Govt aided</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>AICTE ID</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>College Name</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>District & State</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Institution Type</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Registered 2FA Mobile</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Intake vs Enrolled</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Status</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {directory.map((c) => (
                  <tr key={c.aicte_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => handleSelectCollegeForRoster(c)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontWeight: 700,
                          color: "#0B2265",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          textDecoration: "underline"
                        }}
                        title="Click to view Student Master Roster"
                      >
                        {c.aicte_id}
                        <ExternalLink size={11} color="#FF5722" />
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                      <button
                        onClick={() => handleSelectCollegeForRoster(c)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontWeight: 600,
                          color: "#1e293b",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: "12px",
                          lineHeight: 1.3
                        }}
                        title="Inspect Student-Level Academic Registry (APAAR ID Master Roster)"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{c.district}, {c.state}</td>
                    <td style={{ padding: "10px 12px" }}>{c.institution_type}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontWeight: 700 }}>
                        {c.registered_phone ? `+91 •••••${c.registered_phone.slice(-4)}` : "Verified via 2FA"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <strong>{c.total_enrolled}</strong> / {c.total_approved_intake}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          background: c.compliance_status === "COMPLIANT" ? "#dcfce7" : c.compliance_status === "EXCEEDED" ? "#fee2e2" : "#f1f5f9",
                          color: c.compliance_status === "COMPLIANT" ? "#15803d" : c.compliance_status === "EXCEEDED" ? "#b91c1c" : "#64748b",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: 700,
                          fontSize: "11px"
                        }}
                      >
                        {c.is_active ? c.compliance_status : "DEACTIVATED"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          onClick={() => handleSelectCollegeForRoster(c)}
                          title="View Student-Level Academic Registry (APAAR ID Master Roster)"
                          style={{
                            background: "#0B2265",
                            color: "#ffffff",
                            border: "none",
                            padding: "4px 9px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <Users size={12} /> Student Roster
                        </button>

                        {c.is_active ? (
                          <button
                            onClick={() => handleInitiateRemoveCollege(c)}
                            title="Revoke Approval (Requires 2FA OTP)"
                            style={{
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fca5a5",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Trash2 size={12} /> Revoke (2FA)
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Inactive</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INSTITUTE MANAGEMENT (2FA ADD / REMOVE COLLEGE) */}
      {activeTab === "management" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "24px" }}>
          
          {/* Register New College Form */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <PlusCircle size={20} color="#FF5722" />
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265" }}>
                Register New AICTE Approved College
              </h3>
            </div>
            
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "18px" }}>
              Adding an institution to the National Registry requires secondary 2FA verification. An authorization code will be dispatched to your registered administrator mobile.
            </p>

            <form onSubmit={handleInitiateAddCollege}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMT. KASHIBAL NAVALE COLLEGE OF ENGINEERING"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    AICTE Permanent ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-46209999999"
                    value={newCollegeId}
                    onChange={(e) => setNewCollegeId(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PUNE"
                    value={newCollegeDistrict}
                    onChange={(e) => setNewCollegeDistrict(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Institution Type
                  </label>
                  <select
                    value={newCollegeType}
                    onChange={(e) => setNewCollegeType(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Private-Self Financing">Private-Self Financing</option>
                    <option value="Government">Government</option>
                    <option value="Govt aided">Govt aided</option>
                    <option value="University Managed-Govt">University Managed-Govt</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Sanctioned Intake Capacity
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={600}
                    value={newCollegeIntake}
                    onChange={(e) => setNewCollegeIntake(Number(e.target.value))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px dashed #cbd5e1", fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>
                🔒 <strong>High Security Action:</strong> Clicking proceed will trigger an authorization code to your registered mobile.
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  background: "#FF5722",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                Proceed with 2FA OTP Verification →
              </button>
            </form>
          </div>

          {/* Guidelines & Revocation Policy */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Lock size={20} color="#0B2265" />
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0B2265" }}>
                2FA Administrative Safeguards
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "16px" }}>
              Under SIH PS 26263 requirements, all modifications to the National AICTE College Registry enforce secondary 2FA verification to prevent unauthorized registry tampering.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #10b981" }}>
                <strong>Add College Safeguard:</strong> Automatically binds the new college to the central APAAR validation engine, provisions course intake limits, and issues initial registry credentials.
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #ef4444" }}>
                <strong>Revoke / Remove Safeguard:</strong> Requisite secondary OTP required. Revoking an institution disables further student enrollment uploads while preserving existing verifiable credential histories for audit trails.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: INTAKE FORECASTING & PREDICTIVE ALERTS (Prophet & TFT) */}
      {activeTab === "forecasting" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f5f3ff", color: "#6d28d9", padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 800, marginBottom: "4px" }}>
                <Sparkles size={13} />
                TIME-SERIES FORECASTING ENGINE (PROPHET + TFT ADDITIVE DECOMPOSITION)
              </div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#0B2265" }}>
                Pre-Season Enrollment Demand Projections (2027–2028)
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Trained on 10 years of historical enrollment data (2017 to 2026). Generates early warning alerts when projected intake exceeds capacity by ≥30%.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedForecastIndex}
                onChange={(e) => setSelectedForecastIndex(Number(e.target.value))}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "2px solid #7c3aed",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6d28d9"
                }}
              >
                {forecastingList.map((f, idx) => (
                  <option key={idx} value={idx}>
                    {f.college_name} {f.is_critical_overflow ? "⚠️ (>30% Overflow)" : ""}
                  </option>
                ))}
              </select>

              {selectedForecast && (
                <button
                  onClick={() => {
                    const cid = selectedForecast.aicte_id || "1-44465113304";
                    const found = directory.find((d) => d.aicte_id === cid);
                    handleSelectCollegeForRoster(found || {
                      aicte_id: cid,
                      name: selectedForecast.college_name || "Forecasted Institution",
                      compliance_status: "COMPLIANT"
                    });
                  }}
                  style={{
                    background: "#0B2265",
                    color: "#fff",
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
                  title="Inspect all student details and APAAR statuses for this forecasted institution"
                >
                  <Users size={14} /> View Student Roster
                </button>
              )}
            </div>
          </div>

          {/* Active Forecast Details & Critical Warning Banner */}
          {selectedForecast && (
            <div>
              {selectedForecast.is_critical_overflow && (
                <div
                  style={{
                    background: "#fff1f2",
                    border: "2px solid #e11d48",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    marginBottom: "20px",
                    boxShadow: "0 4px 12px rgba(225,29,72,0.15)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}
                >
                  <AlertTriangle size={24} color="#e11d48" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "15px", color: "#9f1239", display: "block", marginBottom: "4px" }}>
                      ⚠️ PREDICTIVE PRE-SEASON WARNING: DEMAND SURGE EXCEEDS CAPACITY BY {selectedForecast.projected_overflow_pct}%
                    </strong>
                    <div style={{ fontSize: "13px", color: "#334155", marginBottom: "6px" }}>
                      Sanctioned Intake: <strong>{selectedForecast.current_approved_intake} seats</strong> | Projected Demand (Expected P50): <strong>{selectedForecast.projected_intake_p50} applicants</strong> (Upper Bound P90: {selectedForecast.projected_intake_p90}).
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#be123c" }}>
                      Mandated Policy Action: {selectedForecast.recommended_action}
                    </div>
                  </div>
                </div>
              )}

              {/* Forecast Metrics Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "20px"
                }}
              >
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>CURRENT SANCTIONED INTAKE</div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#0B2265", marginTop: "4px" }}>
                    {selectedForecast.current_approved_intake}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>AICTE Sanction Ceiling</div>
                </div>

                <div style={{ background: "#eff6ff", padding: "16px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8" }}>PROJECTED DEMAND (P50 EXPECTED)</div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#1d4ed8", marginTop: "4px" }}>
                    {selectedForecast.projected_intake_p50}
                  </div>
                  <div style={{ fontSize: "11px", color: "#1e40af", marginTop: "2px" }}>
                    Surge: +{selectedForecast.projected_overflow_pct}% over capacity
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>TFT 90% UPPER UNCERTAINTY BOUND</div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#475569", marginTop: "4px" }}>
                    {selectedForecast.projected_intake_p90}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Peak admission surge scenario</div>
                </div>

                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>SEASONAL ADMISSION PEAK</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#0B2265", marginTop: "4px" }}>
                    {selectedForecast.seasonal_admission_peak_month}
                  </div>
                  <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px" }}>Annual cycle decomposed</div>
                </div>
              </div>

              {/* 10-Year Historical Time Series & Decomposition Table */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0B2265", marginBottom: "12px" }}>
                  10-Year Historical Enrollment & Seasonal Decomposition Table (2017 to 2026)
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                  Additive decomposition: <code>Observed = Trend + Seasonal + Residual</code>. Isolates annual July-August admission waves to prevent false alarms.
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Academic Year</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Approved Intake</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Actual Admitted</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Trend T(t)</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Seasonal S(t)</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Residual ε(t)</th>
                        <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1" }}>Annual Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedForecast.historical_points.map((pt) => (
                        <tr key={pt.year} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0B2265" }}>{pt.year}</td>
                          <td style={{ padding: "8px 10px" }}>{pt.approved_intake}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 700 }}>{pt.actual_enrolment}</td>
                          <td style={{ padding: "8px 10px", color: "#0284c7" }}>{pt.trend}</td>
                          <td style={{ padding: "8px 10px", color: "#16a34a" }}>
                            {pt.seasonal >= 0 ? `+${pt.seasonal}` : pt.seasonal}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#64748b" }}>{pt.residual}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <span style={{ color: pt.growth_rate_pct >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                              {pt.growth_rate_pct >= 0 ? `+${pt.growth_rate_pct}%` : `${pt.growth_rate_pct}%`}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Projected Year Row */}
                      <tr style={{ background: "#fdf4ff", borderTop: "2px solid #c084fc", fontWeight: 800 }}>
                        <td style={{ padding: "10px", color: "#7c3aed" }}>
                          {selectedForecast.projected_year} (Forecast)
                        </td>
                        <td style={{ padding: "10px" }}>{selectedForecast.current_approved_intake}</td>
                        <td style={{ padding: "10px", color: selectedForecast.is_critical_overflow ? "#be123c" : "#15803d", fontSize: "14px" }}>
                          {selectedForecast.projected_intake_p50} (P50)
                        </td>
                        <td style={{ padding: "10px", color: "#0284c7" }}>Model Projected</td>
                        <td style={{ padding: "10px", color: "#16a34a" }}>+4.5 (Admission Surge)</td>
                        <td style={{ padding: "10px", color: "#64748b" }}>±12.4</td>
                        <td style={{ padding: "10px", color: selectedForecast.is_critical_overflow ? "#be123c" : "#15803d" }}>
                          +{selectedForecast.projected_overflow_pct}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: STUDENT GRIEVANCES DESK */}
      {activeTab === "remarks" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265" }}>
              National Student Discrepancy & Grievance Desk
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Official repository of discrepancy reports submitted by students via their APAAR ID login.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>ID</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Student Name</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>APAAR ID</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Linked College</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Category</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Description</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Status</th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #cbd5e1" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {remarks.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>#{r.id}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0B2265" }}>{r.student_name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#0284c7" }}>{r.apaar_id}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => {
                          const cname = r.college_name || "SMT. KASHIBAL NAVALE COLLEGE OF ENGINEERING";
                          const found = directory.find((d) => d.name.toLowerCase() === cname.toLowerCase());
                          if (found) {
                            handleSelectCollegeForRoster(found);
                          } else {
                            handleSelectCollegeForRoster({
                              aicte_id: "1-44465113304",
                              name: cname
                            });
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "#0B2265",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontSize: "12px",
                          textAlign: "left"
                        }}
                        title="Click to view college student roster"
                      >
                        {r.college_name || "Institution Roster"}
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.remark_type}</td>
                    <td style={{ padding: "10px 12px", maxWidth: "260px" }}>{r.description}</td>
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
                    <td style={{ padding: "10px 12px" }}>
                      {r.status !== "RESOLVED" ? (
                        <button
                          onClick={() => handleResolveRemark(r.id, "RESOLVED")}
                          style={{
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>✓ Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === "audit" && <AuditTrailView />}

      {/* TAB 7: PHOTOHOLMES DOCUMENT FORGERY DETECTION */}
      {activeTab === "verification" && <DocumentVerificationModule />}
        </>
      )}

      {/* SECONDARY 2FA OTP MODAL FOR HIGH-SECURITY ADMIN ACTIONS */}
      {isOtpModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 34, 101, 0.7)",
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
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)"
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  border: "2px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                  color: "#1d4ed8"
                }}
              >
                <Key size={28} />
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0B2265", margin: "0 0 6px 0" }}>
                Secondary 2FA Authorization Required
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Action: <strong>{pendingAction === "ADD_COLLEGE" ? "Add College to Registry" : "Revoke College Approval"}</strong>
              </p>
            </div>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "10px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#166534",
                marginBottom: "18px",
                textAlign: "center"
              }}
            >
              🔒 A secondary verification OTP has been routed to your authorized administrator mobile.
            </div>

            {otpActionError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  marginBottom: "14px"
                }}
              >
                {otpActionError}
              </div>
            )}

            <form onSubmit={handleConfirmSecondaryOtp}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Enter 6-Digit Secondary Action OTP
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={secondaryOtpInput}
                  onChange={(e) => setSecondaryOtpInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #0B2265",
                    fontSize: "20px",
                    letterSpacing: "6px",
                    textAlign: "center",
                    fontWeight: 800,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* 1-Click Autofill Button for test convenience */}
              <button
                type="button"
                onClick={() => setSecondaryOtpInput("123456")}
                style={{
                  width: "100%",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px dashed #93c5fd",
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: "18px"
                }}
              >
                Autofill Test Master OTP: 123456
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: "#0B2265",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Authorize Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE PREVIEW MODAL */}
      {selectedStudentForCert && (
        <CertificatePreviewModal
          student={selectedStudentForCert}
          onClose={() => setSelectedStudentForCert(null)}
        />
      )}

      {/* STUDENT PROFILE DETAIL MODAL */}
      {selectedStudentForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForDetail(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "640px", width: "95vw", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <GraduationCap size={20} color="#0B2265" />
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0B2265", margin: 0 }}>
                  Student Academic & APAAR ID Master Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px", marginBottom: "18px" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Student Full Name</span>
                <strong style={{ fontSize: "14px", color: "#0B2265" }}>{selectedStudentForDetail.full_name}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>12-Digit APAAR ID</span>
                <strong style={{ fontFamily: "monospace", color: "#FF5722", fontSize: "14px" }}>
                  {selectedStudentForDetail.apaar_id || "MISSING / NOT SEEDED"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Roll / Enrollment No</span>
                <strong style={{ color: "#334155" }}>{selectedStudentForDetail.enrollment_no}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Enrolled Institution</span>
                <strong style={{ color: "#334155" }}>{selectedStudentForDetail.college_name || selectedCollegeForRoster?.name}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Department / Course</span>
                <strong style={{ color: "#334155" }}>{selectedStudentForDetail.department}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Admission Quota</span>
                <strong style={{ color: "#334155" }}>{selectedStudentForDetail.admission_type}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Category & Gender</span>
                <strong style={{ color: "#334155" }}>{selectedStudentForDetail.category} • {selectedStudentForDetail.gender}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "11px", display: "block", textTransform: "uppercase" }}>Academic Year</span>
                <strong style={{ color: "#334155" }}>{selectedStudentForDetail.academic_year}</strong>
              </div>
            </div>

            {selectedStudentForDetail.verification_hash && (
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Cryptographic Integrity Proof (SHA-256 Tamper-Proofing - PS 26263):
                </span>
                <code style={{ fontSize: "11px", color: "#0B2265", wordBreak: "break-all", background: "#f1f5f9", padding: "2px 6px", borderRadius: "3px" }}>
                  {selectedStudentForDetail.verification_hash}
                </code>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <div>
                {getStatusBadge(selectedStudentForDetail.validation_status)}
                {selectedStudentForDetail.validation_remarks && (
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    {selectedStudentForDetail.validation_remarks}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setSelectedStudentForCert(selectedStudentForDetail);
                    setSelectedStudentForDetail(null);
                  }}
                  style={{
                    background: "#0B2265",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Award size={14} /> View Certificate
                </button>
                <button
                  onClick={() => setSelectedStudentForDetail(null)}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
