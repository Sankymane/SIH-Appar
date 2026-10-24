import {
  CollegeSummary,
  CollegeDetail,
  Student,
  StudentProfile,
  StudentRemark,
  StakeholderDirectoryItem,
  StakeholderAlertItem,
  ForecastingResult,
  AnalyticsData,
  AuditLogItem
} from "./types";

const API_BASE = "/api/v1";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("aicte_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/institutions/meta/filters`);
  return res.json();
}

export async function fetchInstitutions(params: {
  state?: string;
  institution_type?: string;
  minority?: string;
  women?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{ total: number; page: number; page_size: number; total_pages: number; records: CollegeSummary[] }> {
  const q = new URLSearchParams();
  if (params.state && params.state !== "--All--") q.append("state", params.state);
  if (params.institution_type && params.institution_type !== "--All--") q.append("institution_type", params.institution_type);
  if (params.minority && params.minority !== "--All--") q.append("minority", params.minority);
  if (params.women && params.women !== "--All--") q.append("women", params.women);
  if (params.search) q.append("search", params.search);
  q.append("page", String(params.page || 1));
  q.append("page_size", String(params.page_size || 10));

  const res = await fetch(`${API_BASE}/institutions?${q.toString()}`);
  return res.json();
}

export async function fetchInstitutionDetail(aicte_id: string): Promise<CollegeDetail> {
  const res = await fetch(`${API_BASE}/institutions/${encodeURIComponent(aicte_id)}`);
  if (!res.ok) throw new Error("Institution not found");
  return res.json();
}

export async function searchInstitutions(query: string) {
  const res = await fetch(`${API_BASE}/auth/institutions-search?query=${encodeURIComponent(query)}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// 1. Institutional OTP Authentication
// ---------------------------------------------------------------------------
export async function instituteRequestOtp(aicte_id: string) {
  const res = await fetch(`${API_BASE}/auth/institute-request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aicte_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to trigger OTP to registered mobile");
  }
  return res.json();
}

export async function loginStep2(aicte_id: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/step2-verify-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aicte_id, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Password verification failed");
  }
  return res.json();
}

export async function loginStep3(aicte_id: string, otp: string, session_token: string) {
  const res = await fetch(`${API_BASE}/auth/step3-verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aicte_id, otp, session_token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "OTP verification failed");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// 2. Student OTP Authentication & Profile
// ---------------------------------------------------------------------------
export async function studentRequestOtp(apaar_id: string) {
  const res = await fetch(`${API_BASE}/auth/student-request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apaar_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to trigger Student OTP");
  }
  return res.json();
}

export async function studentVerifyOtp(apaar_id: string, otp: string, session_token: string) {
  const res = await fetch(`${API_BASE}/auth/student-verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apaar_id, otp, session_token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Student OTP verification failed");
  }
  return res.json();
}

export async function fetchStudentProfile(apaar_id?: string): Promise<StudentProfile> {
  const q = apaar_id ? `?apaar_id=${encodeURIComponent(apaar_id)}` : "";
  const res = await fetch(`${API_BASE}/student/profile${q}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Student profile not found");
  }
  return res.json();
}

export async function submitStudentRemark(payload: {
  remark_type: string;
  description: string;
  contact_email?: string;
  contact_mobile?: string;
}): Promise<StudentRemark> {
  const res = await fetch(`${API_BASE}/student/remarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to submit discrepancy remark");
  }
  return res.json();
}

export async function fetchStudentRemarks(): Promise<StudentRemark[]> {
  const res = await fetch(`${API_BASE}/student/remarks`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 3. Stakeholder (AICTE) Authentication & Operations
// ---------------------------------------------------------------------------
export async function regulatorRequestOtp(officer_id = "AICTE-REG-01") {
  const res = await fetch(`${API_BASE}/auth/regulator-request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ officer_id }),
  });
  return res.json();
}

export async function regulatorVerifyOtp(otp: string, session_token: string) {
  const res = await fetch(`${API_BASE}/auth/regulator-verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aicte_id: "AICTE-REG-01", otp, session_token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Stakeholder OTP verification failed");
  }
  return res.json();
}

export async function regulatorLogin() {
  const res = await fetch(`${API_BASE}/auth/regulator-quick-login`, {
    method: "POST",
  });
  return res.json();
}

export async function verifyPhoneEmail(user_json_url: string, role: string, identifier?: string) {
  const res = await fetch(`${API_BASE}/auth/phone-email-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_json_url, role, identifier }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "phone.email verification failed");
  }
  return res.json();
}

export async function fetchStakeholderDirectory(params: {
  query?: string;
  state?: string;
  institution_type?: string;
  limit?: number;
}): Promise<StakeholderDirectoryItem[]> {
  const q = new URLSearchParams();
  if (params.query) q.append("query", params.query);
  if (params.state && params.state !== "--All--") q.append("state", params.state);
  if (params.institution_type && params.institution_type !== "--All--") q.append("institution_type", params.institution_type);
  if (params.limit) q.append("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/stakeholder/directory?${q.toString()}`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function fetchStakeholderAlerts(): Promise<StakeholderAlertItem[]> {
  const res = await fetch(`${API_BASE}/stakeholder/alerts`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function requestSecondaryActionOtp(action: string, target_id?: string) {
  const res = await fetch(`${API_BASE}/stakeholder/request-action-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, target_id }),
  });
  return res.json();
}

export async function stakeholderAddCollege(data: {
  aicte_id: string;
  name: string;
  district: string;
  state: string;
  institution_type: string;
  total_approved_intake: number;
  programs?: string;
  secondary_otp: string;
  session_token: string;
}) {
  const res = await fetch(`${API_BASE}/stakeholder/add-college`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to add college");
  }
  return res.json();
}

export async function stakeholderRemoveCollege(aicte_id: string, secondary_otp: string, session_token: string, reason?: string) {
  const res = await fetch(`${API_BASE}/stakeholder/remove-college/${encodeURIComponent(aicte_id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ aicte_id, secondary_otp, session_token, reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to remove college");
  }
  return res.json();
}

export async function fetchStakeholderForecasting(): Promise<{
  status: string;
  model_architecture: string;
  historical_training_span: string;
  prediction_season: string;
  early_warning_threshold_pct: number;
  forecasts: ForecastingResult[];
}> {
  const res = await fetch(`${API_BASE}/stakeholder/forecasting`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function fetchStakeholderRemarks(status?: string): Promise<StudentRemark[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_BASE}/stakeholder/remarks${q}`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function updateStakeholderRemark(remark_id: number, status: string, admin_notes?: string) {
  const res = await fetch(`${API_BASE}/stakeholder/remarks/${remark_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status, admin_notes }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// 4. Common Student & Analytics APIs
// ---------------------------------------------------------------------------
export async function fetchStudents(params: {
  aicte_id?: string;
  department?: string;
  status?: string;
  search?: string;
  mask_pii?: boolean;
  page?: number;
  page_size?: number;
}): Promise<{ total: number; page: number; total_pages: number; records: Student[] }> {
  const q = new URLSearchParams();
  if (params.aicte_id) q.append("aicte_id", params.aicte_id);
  if (params.department && params.department !== "--All--") q.append("department", params.department);
  if (params.status && params.status !== "--All--") q.append("status", params.status);
  if (params.search) q.append("search", params.search);
  if (params.mask_pii) q.append("mask_pii", "true");
  q.append("page", String(params.page || 1));
  q.append("page_size", String(params.page_size || 15));

  const res = await fetch(`${API_BASE}/students?${q.toString()}`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function createStudent(data: any): Promise<Student> {
  const res = await fetch(`${API_BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Enrollment failed");
  }
  return res.json();
}

export async function bulkUploadStudents(file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/students/bulk-upload`, {
    method: "POST",
    headers: getAuthHeader(),
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Bulk upload failed");
  }
  return res.json();
}

export async function deleteStudent(student_id: number) {
  const res = await fetch(`${API_BASE}/students/${student_id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function fetchAnalytics(aicte_id?: string): Promise<AnalyticsData> {
  const q = aicte_id ? `?aicte_id=${encodeURIComponent(aicte_id)}` : "";
  const res = await fetch(`${API_BASE}/analytics/dashboard${q}`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function fetchAuditTrail(page = 1, page_size = 20): Promise<{ total: number; records: AuditLogItem[] }> {
  const res = await fetch(`${API_BASE}/audit-trail?page=${page}&page_size=${page_size}`, {
    headers: getAuthHeader(),
  });
  return res.json();
}

export async function verifyAPAAR(apaar_id: string) {
  const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(apaar_id)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Student record not found in AICTE registry");
  }
  return res.json();
}

export async function toggleVerification(student_id: number) {
  const res = await fetch(`${API_BASE}/verify/${student_id}/toggle-verification`, {
    method: "POST",
    headers: getAuthHeader(),
  });
  return res.json();
}

