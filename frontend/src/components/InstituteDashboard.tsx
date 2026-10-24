import React, { useState, useEffect } from "react";
import { fetchStudents, fetchAnalytics, fetchInstitutionDetail, deleteStudent, toggleVerification } from "../api";
import { Student, AnalyticsData, CourseIntake, UserAuthContext } from "../types";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { AutomatedValidationBanner } from "./AutomatedValidationBanner";
import { StudentUploadModal } from "./StudentUploadModal";
import { CertificatePreviewModal } from "./CertificatePreviewModal";
import { ReportsModal } from "./ReportsModal";
import {
  Upload,
  UserPlus,
  FileSpreadsheet,
  Award,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building,
  RefreshCw
} from "lucide-react";

interface InstituteDashboardProps {
  auth: UserAuthContext;
}

export const InstituteDashboard: React.FC<InstituteDashboardProps> = ({ auth }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courses, setCourses] = useState<CourseIntake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Options
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("--All--");
  const [maskPii, setMaskPii] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);

  // Active college ID (if regulator, can inspect all colleges or default)
  const targetAicteId = auth.role === "AICTE_VERIFIER" ? undefined : auth.aicte_id;

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, analyticsRes] = await Promise.all([
        fetchStudents({
          aicte_id: targetAicteId,
          status: statusFilter,
          search: searchQuery,
          mask_pii: maskPii,
          page,
          page_size: pageSize,
        }),
        fetchAnalytics(targetAicteId),
      ]);

      setStudents(studentsRes.records || []);
      setTotalStudents(studentsRes.total || 0);
      setAnalytics(analyticsRes);

      // Fetch course intakes for dropdowns
      if (auth.aicte_id && auth.aicte_id !== "AICTE-CENTRAL") {
        const detail = await fetchInstitutionDetail(auth.aicte_id);
        setCourses(detail.courses || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [page, pageSize, statusFilter, maskPii]);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the student registry?`)) {
      await deleteStudent(id);
      loadDashboardData();
    }
  };

  const handleToggleVerify = async (id: number) => {
    await toggleVerification(id);
    loadDashboardData();
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
      case "APAAR_NOT_IN_REGISTRY":
        return <span className="badge-status badge-error"><AlertTriangle size={11} /> Not in APAAR Registry</span>;
      case "APAAR_INACTIVE":
        return <span className="badge-status badge-error"><AlertTriangle size={11} /> APAAR Inactive</span>;
      case "DATA_INCONSISTENCY":
        return <span className="badge-status badge-info">Inconsistent Quota</span>;
      default:
        return <span className="badge-status badge-info">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "20px auto", padding: "0 24px" }}>
      {/* Institutional Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B2265 0%, #071744 100%)",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(11, 34, 101, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "12px", borderRadius: "8px" }}>
            <Building size={32} color="#f7941d" />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#f7941d", fontWeight: 700, letterSpacing: "1px" }}>
              {auth.role === "AICTE_VERIFIER" ? "REGULATORY AUDIT & SURVEILLANCE DESK" : "INSTITUTION STUDENT DATA REGISTRY"}
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0" }}>
              {auth.college_name}
            </h1>
            <div style={{ fontSize: "12px", opacity: 0.85 }}>
              AICTE ID: <b>{auth.aicte_id}</b> • Academic Year: <b>2026-2027</b> • Role: <b>{auth.role}</b>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            style={{
              background: "#ffffff",
              color: "#0B2265",
              border: "none",
              padding: "9px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => setIsUploadModalOpen(true)}
          >
            <UserPlus size={14} color="#0B2265" /> Enroll Student / Upload CSV
          </button>

          <button
            style={{
              background: "var(--aicte-orange)",
              color: "#ffffff",
              border: "none",
              padding: "9px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => setIsReportsModalOpen(true)}
          >
            <FileSpreadsheet size={14} /> Regulatory Reports
          </button>
        </div>
      </div>

      {/* Analytics Charts & KPI Dashboard (Req 4) */}
      {analytics && <AnalyticsCharts data={analytics} />}

      {/* Automated Validation Engine Summary (Req 3) */}
      {analytics && (
        <AutomatedValidationBanner
          statusBreakdown={analytics.validation_status_breakdown}
          selectedFilter={statusFilter}
          onSelectFilter={(st) => {
            setStatusFilter(st);
            setPage(1);
          }}
        />
      )}

      {/* -------------------------------------------------------------
          STUDENT DATA ROSTER TABLE
          ------------------------------------------------------------- */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0B2265" }}>
              Student-Level Academic Registry (APAAR ID Master Roster)
            </h3>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Showing {students.length} of {totalStudents} student records
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Privacy Masking Toggle (Req 8) */}
            <button
              style={{
                background: maskPii ? "#fef3c7" : "#f1f5f9",
                color: maskPii ? "#92400e" : "#475569",
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
              onClick={() => setMaskPii(!maskPii)}
              title="Toggle masked APAAR display (XXXX-XXXX-1234)"
            >
              {maskPii ? <EyeOff size={13} /> : <Eye size={13} />}
              {maskPii ? "Privacy Mode: Active" : "Mask APAAR"}
            </button>

            <button
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                padding: "6px 10px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={loadDashboardData}
              title="Refresh student roster"
            >
              <RefreshCw size={13} color="#475569" />
            </button>

            {/* Search Input */}
            <input
              type="text"
              className="dt-search-input"
              placeholder="Search student, APAAR, roll..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => e.key === "Enter" && loadDashboardData()}
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
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#f75700" }}>
                    Loading student academic registry records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No students found in this category.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
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
                        title="Generate sample Degree Certificate displaying APAAR ID (Req 10)"
                      >
                        <Award size={10} style={{ display: "inline", marginRight: "3px" }} /> Certificate
                      </button>

                      <button
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          padding: "3px 6px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDelete(s.id, s.full_name)}
                        title="Delete record"
                      >
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="datatable-footer" style={{ marginTop: "16px" }}>
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalStudents)} of {totalStudents} entries
          </div>

          <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span style={{ padding: "4px 8px", fontSize: "12px", fontWeight: 700 }}>Page {page}</span>
            <button
              className="page-btn"
              disabled={page * pageSize >= totalStudents}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => loadDashboardData()}
        courses={courses}
        aicteId={auth.aicte_id}
      />

      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        aicteId={targetAicteId}
        collegeName={auth.college_name}
      />

      <CertificatePreviewModal
        student={selectedStudentForCert}
        onClose={() => setSelectedStudentForCert(null)}
      />
    </div>
  );
};
