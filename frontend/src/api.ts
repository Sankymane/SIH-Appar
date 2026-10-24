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
  AuditLogItem,
  StudentRegistrationPayload
} from "./types";
import {
  MOCK_FILTERS,
  MOCK_COLLEGES,
  MOCK_STUDENT_PROFILE,
  MOCK_SYNTHETIC_STUDENTS,
  MOCK_ANALYTICS,
  MOCK_DIRECTORY,
  MOCK_ALERTS,
  MOCK_FORECASTING,
  MOCK_REMARKS,
  MOCK_AUDIT
} from "./mockData";

// Dynamically resolve API base URL from Vite environment variables (Vercel/Render production or local dev)
export const RAW_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8000"
).replace(/\/+$/, "");

export const API_BASE = RAW_BASE_URL.endsWith("/api/v1")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL}/api/v1`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("aicte_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFilterOptions() {
  try {
    const res = await fetch(`${API_BASE}/institutions/meta/filters`);
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_FILTERS;
  }
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
  try {
    const q = new URLSearchParams();
    if (params.state && params.state !== "--All--") q.append("state", params.state);
    if (params.institution_type && params.institution_type !== "--All--") q.append("institution_type", params.institution_type);
    if (params.minority && params.minority !== "--All--") q.append("minority", params.minority);
    if (params.women && params.women !== "--All--") q.append("women", params.women);
    if (params.search) q.append("search", params.search);
    q.append("page", String(params.page || 1));
    q.append("page_size", String(params.page_size || 10));

    const res = await fetch(`${API_BASE}/institutions?${q.toString()}`);
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    let filtered = [...MOCK_COLLEGES];
    if (params.state && params.state !== "--All--") {
      filtered = filtered.filter(c => c.state === params.state);
    }
    if (params.institution_type && params.institution_type !== "--All--") {
      filtered = filtered.filter(c => c.institution_type === params.institution_type);
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(term) || c.aicte_id.toLowerCase().includes(term));
    }
    return {
      total: filtered.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
      records: filtered
    };
  }
}

export async function fetchInstitutionDetail(aicte_id: string): Promise<CollegeDetail> {
  try {
    const res = await fetch(`${API_BASE}/institutions/${encodeURIComponent(aicte_id)}`);
    if (!res.ok) throw new Error("Institution not found");
    return await res.json();
  } catch {
    const found = MOCK_COLLEGES.find(c => c.aicte_id === aicte_id) || MOCK_COLLEGES[0];
    return {
      ...found,
      website: "https://aicte-india.org",
      contact_email: "registrar@institution.edu.in",
      contact_phone: "+91 •••••4172",
      nodal_officer_name: "Dr. Academic Registrar",
      nodal_officer_email: "registrar@institution.edu.in",
      nodal_officer_mobile: "+91 •••••4172",
      registered_phone: "+91 •••••4172",
      total_supernumerary_enrolled: 18,
      flagged_records_count: 2,
      courses: [
        {
          id: 1,
          program: "Engineering and Technology",
          department: "Computer Science and Engineering",
          level: "UG",
          shift: "1st Shift",
          approved_intake: 120,
          supernumerary_intake: 18,
          nri_quota: 3,
          fn_quota: 3,
          academic_year: "2026-2027",
          enrolled_count: 118,
          supernumerary_count: 18
        }
      ]
    };
  }
}

export async function searchInstitutions(query: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/institutions-search?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    const term = query.toLowerCase();
    return MOCK_COLLEGES.filter(c => c.name.toLowerCase().includes(term) || c.aicte_id.toLowerCase().includes(term));
  }
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
    throw new Error(err.detail || "Invalid or expired OTP");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// 2. Student Verification APIs
// ---------------------------------------------------------------------------
export async function studentRequestOtp(apaar_id: string) {
  const res = await fetch(`${API_BASE}/auth/student-request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apaar_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Student lookup failed");
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

export async function registerStudent(payload: StudentRegistrationPayload) {
  try {
    const res = await fetch(`${API_BASE}/auth/student-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Student registration failed");
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    if (err.message && err.message !== "Failed to fetch" && err.message !== "NetworkError when attempting to fetch resource.") {
      throw err;
    }

    // Static GitHub Pages fallback
    const cleanPhone = (payload.mobile_number || "").replace(/\D/g, "").slice(-10);
    const apaarId = payload.apaar_id || `9${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    const newStudentProfile: StudentProfile = {
      apaar_id: apaarId,
      full_name: payload.full_name.toUpperCase(),
      enrollment_no: payload.enrollment_no || `EN26${cleanPhone.slice(-4)}`,
      gender: payload.gender || "Male",
      category: payload.category || "General",
      date_of_birth: payload.date_of_birth || "2004-01-01",
      date_of_admission: "2026-08-01",
      academic_year: payload.academic_year || "2026-2027",
      aicte_id: payload.aicte_id,
      college_name: "AICTE Affiliated Institution",
      program: payload.program || "Engineering and Technology",
      department: payload.department,
      level: payload.level || "UG",
      admission_type: "Regular",
      credits_earned: 24,
      cgpa: 8.5,
      digilocker_status: "DigiLocker Verified",
      validation_status: "VALID",
      verification_hash: `sha256:reg_${apaarId}`,
      is_verified: true,
      verified_by: "AICTE-APAAR National Student Registry",
      verified_at: new Date().toISOString(),
      mobile_number: cleanPhone
    };

    try {
      const existing = JSON.parse(localStorage.getItem("aicte_registered_students") || "[]");
      existing.push(newStudentProfile);
      localStorage.setItem("aicte_registered_students", JSON.stringify(existing));
    } catch {}

    return {
      success: true,
      message: "Student profile registered successfully.",
      apaar_id: apaarId,
      full_name: payload.full_name.toUpperCase(),
      mobile_number: cleanPhone,
      aicte_id: payload.aicte_id,
      college_name: "AICTE Affiliated Institution",
      enrollment_no: newStudentProfile.enrollment_no,
      access_token: "demo_gh_pages_reg_token"
    };
  }
}

export async function fetchStudentProfile(apaar_id?: string): Promise<StudentProfile> {
  try {
    const q = apaar_id ? `?apaar_id=${encodeURIComponent(apaar_id)}` : "";
    const res = await fetch(`${API_BASE}/student/profile${q}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    if (apaar_id) {
      for (const phone of Object.keys(MOCK_SYNTHETIC_STUDENTS)) {
        if (MOCK_SYNTHETIC_STUDENTS[phone].apaar_id === apaar_id) {
          return MOCK_SYNTHETIC_STUDENTS[phone];
        }
      }
      try {
        const localReg = JSON.parse(localStorage.getItem("aicte_registered_students") || "[]");
        const match = localReg.find((s: any) => s.apaar_id === apaar_id);
        if (match) return match;
      } catch {}
    }
    return MOCK_STUDENT_PROFILE;
  }
}

export async function submitStudentRemark(payload: {
  remark_type: string;
  description: string;
  contact_email?: string;
  contact_mobile?: string;
}): Promise<StudentRemark> {
  try {
    const res = await fetch(`${API_BASE}/student/remarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to submit remark");
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== "Failed to fetch") throw err;
    return {
      id: Date.now(),
      apaar_id: "126430259751",
      student_name: "SANKALP HEMANT MANE",
      aicte_id: "1-44465113304",
      remark_type: payload.remark_type,
      description: payload.description,
      status: "PENDING",
      contact_email: payload.contact_email,
      created_at: new Date().toISOString()
    };
  }
}

export async function fetchStudentRemarks(): Promise<StudentRemark[]> {
  try {
    const res = await fetch(`${API_BASE}/student/remarks`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_REMARKS;
  }
}

// ---------------------------------------------------------------------------
// 3. Stakeholder & phone.email Verification
// ---------------------------------------------------------------------------
export async function regulatorRequestOtp() {
  const res = await fetch(`${API_BASE}/auth/regulator-request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Regulator OTP dispatch failed");
  }
  return res.json();
}

export async function regulatorVerifyOtp(otp: string, session_token: string) {
  const res = await fetch(`${API_BASE}/auth/regulator-verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aicte_id: "AICTE-CENTRAL", otp, session_token }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Regulator 2FA verification failed");
  }
  return res.json();
}

const AUTHORIZED_ADMIN_PHONES = new Set([
  "8767434172",
  "9137270864",
  "9324862618",
  "8928197021",
  "8828246643",
  "9833074194"
]);

export async function verifyPhoneEmail(user_json_url: string, role: string, identifier?: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/phone-email-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_json_url, role, identifier }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "phone.email verification failed");
    }
    return await res.json();
  } catch (err: any) {
    // If backend returned actual 403 or 404, strictly throw that error
    if (err.message && err.message !== "Failed to fetch" && err.message !== "NetworkError when attempting to fetch resource.") {
      throw err;
    }

    // Static GitHub Pages fallback when no Python server is running:
    let clean10 = "8767434172";
    if (user_json_url.startsWith("http")) {
      try {
        const peRes = await fetch(user_json_url);
        if (peRes.ok) {
          const peData = await peRes.json();
          const phone = String(peData.user_phone_number || "");
          clean10 = phone.replace(/\D/g, "").slice(-10);
        }
      } catch {}
    } else if (user_json_url.startsWith("mock:")) {
      clean10 = user_json_url.split(":")[1]?.replace(/\D/g, "").slice(-10) || "8767434172";
    }

    if (role !== "STUDENT" && !AUTHORIZED_ADMIN_PHONES.has(clean10)) {
      throw new Error("Unauthorized: Insufficient Permissions");
    }

    if (role === "STUDENT") {
      if (clean10 === "8767434172") {
        return {
          access_token: "demo_gh_pages_preview_token",
          token_type: "bearer",
          aicte_id: identifier || "1-44465113304",
          college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
          role: role,
          apaar_id: "126430259751",
          student_name: "SANKALP HEMANT MANE"
        };
      }

      if (MOCK_SYNTHETIC_STUDENTS[clean10]) {
        const syn = MOCK_SYNTHETIC_STUDENTS[clean10];
        return {
          access_token: `demo_gh_pages_${clean10}`,
          token_type: "bearer",
          aicte_id: identifier || syn.aicte_id,
          college_name: syn.college_name,
          role: role,
          apaar_id: syn.apaar_id,
          student_name: syn.full_name
        };
      }

      // Check registered students in localStorage
      try {
        const localReg = JSON.parse(localStorage.getItem("aicte_registered_students") || "[]");
        const found = localReg.find((s: any) => s.mobile_number === clean10);
        if (found) {
          return {
            access_token: `demo_gh_pages_${clean10}`,
            token_type: "bearer",
            aicte_id: found.aicte_id,
            college_name: found.college_name,
            role: role,
            apaar_id: found.apaar_id,
            student_name: found.full_name
          };
        }
      } catch {}

      throw new Error(`No student record found for mobile ending in ${clean10.slice(-4)}. Please click 'Register Now' to create your student account.`);
    }

    return {
      access_token: "demo_gh_pages_preview_token",
      token_type: "bearer",
      aicte_id: identifier || "AICTE-CENTRAL",
      college_name: role === "AICTE_VERIFIER" ? "AICTE Central Regulatory Bureau" : "ST. XAVIER'S TECHNICAL INSTITUTE",
      role: role,
      apaar_id: null,
      student_name: null
    };
  }
}

export async function fetchStakeholderDirectory(params: {
  query?: string;
  state?: string;
  institution_type?: string;
  limit?: number;
}): Promise<StakeholderDirectoryItem[]> {
  try {
    const q = new URLSearchParams();
    if (params.query) q.append("query", params.query);
    if (params.state && params.state !== "--All--") q.append("state", params.state);
    if (params.institution_type && params.institution_type !== "--All--") q.append("institution_type", params.institution_type);
    if (params.limit) q.append("limit", String(params.limit));

    const res = await fetch(`${API_BASE}/stakeholder/directory?${q.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_DIRECTORY;
  }
}

export async function fetchStakeholderAlerts(): Promise<StakeholderAlertItem[]> {
  try {
    const res = await fetch(`${API_BASE}/stakeholder/alerts`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_ALERTS;
  }
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
  try {
    const res = await fetch(`${API_BASE}/stakeholder/forecasting`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_FORECASTING;
  }
}

export async function fetchStakeholderRemarks(status?: string): Promise<StudentRemark[]> {
  try {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await fetch(`${API_BASE}/stakeholder/remarks${q}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_REMARKS;
  }
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
  try {
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
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return {
      total: 1,
      page: 1,
      total_pages: 1,
      records: [
        {
          id: 1,
          apaar_id: "126430259751",
          masked_apaar_id: "1264-••••-9751",
          enrollment_no: "EN26CS1264",
          full_name: "SANKALP HEMANT MANE",
          gender: "Male",
          category: "General",
          date_of_admission: "2026-08-01",
          academic_year: "2026-2027",
          aicte_id: "1-44465113304",
          college_name: "ST. XAVIER'S TECHNICAL INSTITUTE",
          program: "Engineering and Technology",
          department: "Computer Science and Engineering",
          level: "UG",
          admission_type: "Regular",
          is_nri: false,
          is_oci: false,
          is_fn: false,
          validation_status: "VALID",
          validation_remarks: "All checks passed. Verified against ABC.",
          is_verified: true,
          credits_earned: 84,
          cgpa: 8.92
        }
      ]
    };
  }
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
  try {
    const q = aicte_id ? `?aicte_id=${encodeURIComponent(aicte_id)}` : "";
    const res = await fetch(`${API_BASE}/analytics/dashboard${q}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_ANALYTICS;
  }
}

export async function fetchAuditTrail(page = 1, page_size = 20): Promise<{ total: number; records: AuditLogItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/audit-trail?page=${page}&page_size=${page_size}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Offline");
    return await res.json();
  } catch {
    return MOCK_AUDIT;
  }
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
