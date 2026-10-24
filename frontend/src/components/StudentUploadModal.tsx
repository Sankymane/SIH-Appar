import React, { useState } from "react";
import { createStudent, bulkUploadStudents } from "../api";
import { CourseIntake } from "../types";
import {
  X,
  Upload,
  UserPlus,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText
} from "lucide-react";

interface StudentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courses: CourseIntake[];
  aicteId: string;
}

export const StudentUploadModal: React.FC<StudentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  courses,
  aicteId,
}) => {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Student Form States
  const [apaarId, setApaarId] = useState<string>("");
  const [enrollmentNo, setEnrollmentNo] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [gender, setGender] = useState<string>("Male");
  const [category, setCategory] = useState<string>("General");
  const [dateOfBirth, setDateOfBirth] = useState<string>("2005-01-15");
  const [dateOfAdmission, setDateOfAdmission] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(courses[0]?.id || 1);
  const [admissionType, setAdmissionType] = useState<string>("Regular");
  const [isNri, setIsNri] = useState<boolean>(false);
  const [isOci, setIsOci] = useState<boolean>(false);
  const [isFn, setIsFn] = useState<boolean>(false);

  // Bulk Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const matchedCourse = courses.find((c) => c.id === Number(selectedCourseId));
    const dept = matchedCourse ? matchedCourse.department : "Computer Science and Engineering";
    const prog = matchedCourse ? matchedCourse.program : "Engineering and Technology";
    const lvl = matchedCourse ? matchedCourse.level : "UG";

    try {
      await createStudent({
        apaar_id: apaarId.trim() || null,
        enrollment_no: enrollmentNo.trim(),
        full_name: fullName.trim(),
        gender,
        category,
        date_of_birth: dateOfBirth,
        date_of_admission: dateOfAdmission,
        course_id: Number(selectedCourseId),
        department: dept,
        program: prog,
        level: lvl,
        admission_type: admissionType,
        is_nri: isNri,
        is_oci: isOci,
        is_fn: isFn,
        academic_year: "2026-2027",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to enroll student.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a valid CSV or Excel file to upload.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await bulkUploadStudents(selectedFile);
      setUploadResult(res);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "apaar_id,enrollment_no,full_name,gender,category,department,admission_type,is_nri,is_oci,is_fn\n" +
      "910010001012,EN26CS9001,Aarav Sharma,Male,General,Computer Science and Engineering,Regular,false,false,false\n" +
      "910010001020,EN26CS9002,Ananya Patel,Female,OBC-NCL,Computer Science and Engineering,Supernumerary-TFW,false,false,false\n" +
      "910010001031,EN26IT9003,Rohan Deshmukh,Male,SC,Information Technology,Supernumerary-PMSSS,false,false,false\n" +
      "778899001122,EN26CS9004,Duplicate Test,Male,General,Computer Science and Engineering,Regular,false,false,false\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "AICTE_APAAR_Bulk_Student_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Upload size={18} />
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>
              Student Data Enrollment & APAAR Upload Interface
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <button
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              background: activeTab === "single" ? "#ffffff" : "transparent",
              borderBottom: activeTab === "single" ? "3px solid var(--aicte-orange)" : "none",
              fontWeight: 700,
              fontSize: "13px",
              color: activeTab === "single" ? "var(--aicte-blue)" : "#64748b",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => setActiveTab("single")}
          >
            <UserPlus size={15} /> Single Student Enrollment
          </button>
          <button
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              background: activeTab === "bulk" ? "#ffffff" : "transparent",
              borderBottom: activeTab === "bulk" ? "3px solid var(--aicte-orange)" : "none",
              fontWeight: 700,
              fontSize: "13px",
              color: activeTab === "bulk" ? "var(--aicte-blue)" : "#64748b",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => setActiveTab("bulk")}
          >
            <FileSpreadsheet size={15} /> Bulk CSV/Excel Upload
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "78vh", overflowY: "auto" }}>
          {errorMsg && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #f87171",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* -------------------------------------------------------------
              TAB 1: Single Student Enrollment Form
              ------------------------------------------------------------- */}
          {activeTab === "single" && (
            <form onSubmit={handleSingleSubmit}>
              {/* Mandatory Fields Section (Req 2) */}
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0B2265", marginBottom: "10px" }}>
                1. APAAR Identifier & Academic Department (Mandatory Policy Fields)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    APAAR ID (12 Digits) *
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="e.g. 982347102938"
                    maxLength={12}
                    value={apaarId}
                    onChange={(e) => setApaarId(e.target.value)}
                  />
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                    Leave blank to test "Missing APAAR" validation check.
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Institutional Roll / Enrollment No *
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="e.g. EN26CS1099"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Department / Approved Course *
                </label>
                <select
                  className="filter-select"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.department} (Approved Intake: {c.approved_intake} seats | Supernumerary: {c.supernumerary_intake})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0B2265", margin: "16px 0 10px" }}>
                2. Student Demographic Details
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="e.g. Ananya R. Joshi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Gender *
                  </label>
                  <select className="filter-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Category *
                  </label>
                  <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="General">General</option>
                    <option value="OBC-NCL">OBC-NCL</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="filter-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Admission Date
                  </label>
                  <input
                    type="date"
                    className="filter-input"
                    value={dateOfAdmission}
                    onChange={(e) => setDateOfAdmission(e.target.value)}
                  />
                </div>
              </div>

              {/* Quota & Supernumerary Seats */}
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0B2265", margin: "16px 0 10px" }}>
                3. Admission Quota & Supernumerary Status
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Admission Type (Quota Allocation) *
                </label>
                <select
                  className="filter-select"
                  value={admissionType}
                  onChange={(e) => setAdmissionType(e.target.value)}
                >
                  <option value="Regular">Regular Sanctioned Intake</option>
                  <option value="Supernumerary-TFW">Supernumerary - Tuition Fee Waiver (TFW)</option>
                  <option value="Supernumerary-PMSSS">Supernumerary - PM Special Scholarship (PMSSS J&K)</option>
                  <option value="Supernumerary-Sports">Supernumerary - Sports Quota</option>
                  <option value="Supernumerary-EWS">Supernumerary - Economically Weaker Section (EWS)</option>
                </select>
              </div>

              {/* NRI, OCI, FN Policy Checkboxes */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  International & Special Categories:
                </div>
                <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isNri}
                      onChange={(e) => setIsNri(e.target.checked)}
                    />
                    NRI Category
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isOci}
                      onChange={(e) => setIsOci(e.target.checked)}
                    />
                    OCI Status (Overseas Citizen of India)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isFn}
                      onChange={(e) => setIsFn(e.target.checked)}
                    />
                    Foreign National (FN)
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  style={{
                    background: "#e2e8f0",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-filter-submit"
                  style={{ width: "auto", marginTop: 0 }}
                  disabled={loading}
                >
                  {loading ? "Validating & Enrolling..." : "Submit Student Record"}
                </button>
              </div>
            </form>
          )}

          {/* -------------------------------------------------------------
              TAB 2: Bulk CSV/Excel Upload
              ------------------------------------------------------------- */}
          {activeTab === "bulk" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0f7ff",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#0B2265" }}>
                    Bulk Data Upload Template
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>
                    Download the standardized AICTE template with pre-configured headers.
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    background: "#0B2265",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={downloadSampleTemplate}
                >
                  <Download size={12} /> Download Sample CSV
                </button>
              </div>

              <form onSubmit={handleBulkUpload}>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "8px",
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "#ffffff",
                    marginBottom: "16px",
                    cursor: "pointer",
                  }}
                  onClick={() => document.getElementById("bulk-file-input")?.click()}
                >
                  <FileSpreadsheet size={36} color="var(--aicte-orange)" style={{ margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                    {selectedFile ? selectedFile.name : "Click to select or drag CSV / Excel file here"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Supports .csv, .xlsx, .xls (Up to 1,000 students per batch)
                  </div>
                  <input
                    id="bulk-file-input"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {uploadResult && (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B2265", marginBottom: "8px" }}>
                      Automated Validation Batch Summary:
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px" }}>
                      <div style={{ background: "#ffffff", padding: "10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                        Total Processed: <b>{uploadResult.total_processed}</b>
                      </div>
                      <div style={{ background: "#dcfce7", padding: "10px", borderRadius: "4px", border: "1px solid #86efac", color: "#166534" }}>
                        Successfully Enrolled: <b>{uploadResult.successfully_enrolled}</b>
                      </div>
                      <div style={{ background: "#fee2e2", padding: "10px", borderRadius: "4px", border: "1px solid #fca5a5", color: "#991b1b" }}>
                        Flagged Policy Violations: <b>{uploadResult.flagged_records}</b>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    style={{
                      background: "#e2e8f0",
                      border: "none",
                      padding: "9px 18px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                    onClick={onClose}
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    className="btn-filter-submit"
                    style={{ width: "auto", marginTop: 0 }}
                    disabled={loading || !selectedFile}
                  >
                    {loading ? "Processing Batch..." : "Upload & Validate Batch"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
