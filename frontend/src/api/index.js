// ─────────────────────────────────────────────────────────────────────────────
// API layer: every call to the FastAPI backend (backend/app) goes through here.
//
// The backend serves everything under /api/v1. In development, Vite proxies
// /api to http://127.0.0.1:8000 (see vite.config.js). Swagger docs for every
// endpoint: http://127.0.0.1:8000/docs
// ─────────────────────────────────────────────────────────────────────────────

import { issueCredential as signCredential, verifyCredential as checkSignature } from '../lib/credential.js'

export const API_BASE = import.meta.env?.VITE_API_BASE ?? '/api/v1'

let authToken = null
export function setAuthToken(token) {
  authToken = token
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', json, form, query } = {}) {
  const qs = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== '--All--'),
      ).toString()
    : ''
  const headers = {}
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  let body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}${qs}`, { method, headers, body })
  } catch {
    throw new ApiError('Can’t reach the APAAR Setu server. Check that the backend is running on port 8000.', 0)
  }
  const type = res.headers.get('content-type') || ''
  const data = type.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === 'object' && data?.detail
    const msg = Array.isArray(detail) ? detail.map((d) => d.msg).join('; ') : detail
    throw new ApiError(msg || `Request failed (${res.status})`, res.status)
  }
  return data
}

// ───────────── Sign-in ─────────────

/** GET /auth/institutions-search?query= → [{ aicte_id, name, district, state }] */
export function searchInstitutions(query) {
  return request('/auth/institutions-search', { query: { query, limit: 10 } })
}

/** POST /auth/step2-verify-password → { session_token, simulated_otp, message, aicte_id, college_name } */
export function verifyInstitutionPassword(aicteId, password) {
  return request('/auth/step2-verify-password', { method: 'POST', json: { aicte_id: aicteId, password } })
}

/** POST /auth/step3-verify-otp → { access_token, aicte_id, college_name, role } */
export function verifyInstitutionOtp(aicteId, otp, sessionToken) {
  return request('/auth/step3-verify-otp', { method: 'POST', json: { aicte_id: aicteId, otp, session_token: sessionToken } })
}

/** POST /auth/regulator-quick-login → { access_token, aicte_id, college_name, role: 'AICTE_VERIFIER' } */
export function regulatorSignIn() {
  return request('/auth/regulator-quick-login', { method: 'POST' })
}

// ───────────── Institutions ─────────────

/** GET /institutions/meta/filters → { states[], institution_types[], years[], programs[], levels[] } */
export function getInstitutionFilters() {
  return request('/institutions/meta/filters')
}

/**
 * GET /institutions?state=&institution_type=&women=&minority=&search=&page=&page_size=
 * → { total, page, page_size, total_pages, records: [{ aicte_id, name, address, district, state,
 *     institution_type, women, minority, total_approved_intake, total_enrolled_students,
 *     compliance_status: 'COMPLIANT'|'NEAR_CAPACITY'|'EXCEEDED' }] }
 */
export function listInstitutions(params = {}) {
  return request('/institutions', { query: params })
}

/**
 * GET /institutions/:aicte_id → { ...college, nodal_officer_*, total_approved_intake,
 *   total_enrolled_students, total_supernumerary_enrolled, flagged_records_count,
 *   courses: [{ id, program, department, level, shift, approved_intake, supernumerary_intake,
 *              nri_quota, fn_quota, enrolled_count, supernumerary_count }] }
 */
export function getInstitution(aicteId) {
  return request(`/institutions/${encodeURIComponent(aicteId)}`)
}

// ───────────── Students ─────────────

/**
 * GET /students?aicte_id=&department=&status=&search=&mask_pii=&page=&page_size=
 * → { total, page, page_size, total_pages, records: Student[] }
 */
export function listStudents(params = {}) {
  return request('/students', { query: params })
}

/** All pages of /students for one query (page size 100) */
export async function listAllStudents(params = {}) {
  const first = await listStudents({ ...params, page: 1, page_size: 100 })
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.total_pages - 1) }, (_, i) => listStudents({ ...params, page: i + 2, page_size: 100 })),
  )
  return [first, ...rest].flatMap((p) => p.records)
}

/** POST /students (single enrolment, runs the validation engine) → Student */
export function createStudent(data) {
  return request('/students', { method: 'POST', json: data })
}

/**
 * POST /students/bulk-upload (multipart CSV/XLSX)
 * → { total_processed, successfully_enrolled, flagged_records, errors[], created_students: Student[] (first 50) }
 */
export function bulkUploadStudents(content, filename) {
  const form = new FormData()
  const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/csv' })
  form.append('file', blob, filename)
  return request('/students/bulk-upload', { method: 'POST', form })
}

/** DELETE /students/:id */
export function deleteStudent(id) {
  return request(`/students/${id}`, { method: 'DELETE' })
}

// ───────────── Verification ─────────────

/**
 * GET /verify/:apaar_id (public)
 * → { is_valid, apaar_id, student_name, enrollment_no, college_name, aicte_id, program, department,
 *     level, admission_year, verification_status, validation_remarks, digital_signature_hash, verified_at }
 */
export function verifyApaar(apaarId) {
  return request(`/verify/${encodeURIComponent(apaarId.replace(/[\s-]/g, ''))}`)
}

/** POST /verify/:student_id/toggle-verification (AICTE override) → { is_verified, validation_status, message } */
export function toggleVerification(studentId) {
  return request(`/verify/${studentId}/toggle-verification`, { method: 'POST' })
}

// ───────────── Analytics, audit, reports ─────────────

/**
 * GET /analytics/dashboard?aicte_id= → { total_approved_intake, total_supernumerary_intake,
 *   total_enrolled_students, total_apaar_seeded, apaar_seeding_rate, total_flagged_violations,
 *   intake_utilization_rate, category_distribution, quota_distribution, gender_distribution,
 *   validation_status_breakdown, department_intake_comparison[] }
 */
export function getAnalytics(aicteId) {
  return request('/analytics/dashboard', { query: { aicte_id: aicteId } })
}

/** GET /audit-trail?action=&actor_role=&page=&page_size= → { total, page, total_pages, records[] } */
export function listAuditTrail(params = {}) {
  return request('/audit-trail', { query: params })
}

/** Download link for GET /reports/export/{students|compliance}?aicte_id=&format={xlsx|csv} */
export function reportUrl(type, format, aicteId) {
  const q = new URLSearchParams({ format })
  if (aicteId) q.set('aicte_id', aicteId)
  return `${API_BASE}/reports/export/${type}?${q}`
}

// ───────────── Signed credentials (frontend, Web Crypto) ─────────────
// The backend's verification_hash proves the record matches the registry. The
// signed QR credential adds offline verification and tamper detection on top.

export function issueCredential(record) {
  return signCredential(record)
}

export function verifyCredential(token) {
  return checkSignature(token)
}

/** Every flagged (non-VALID) student record, optionally for one institution */
export async function listFlaggedStudents(aicteId) {
  const statuses = ['MISSING_APAAR', 'INVALID_APAAR_FORMAT', 'DUPLICATE_APAAR', 'CROSS_INSTITUTION_DUPLICATE', 'INTAKE_EXCEEDED', 'DATA_INCONSISTENCY']
  const lists = await Promise.all(statuses.map((status) => listAllStudents({ status, aicte_id: aicteId })))
  return lists.flat().sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id))
}
