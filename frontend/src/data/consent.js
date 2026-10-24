// Consent and display data that the backend doesn't store yet. Consent grants
// and the student access log are kept in the browser per student (see
// state/AppState.jsx) until the backend adds endpoints for them.

export const ACADEMIC_YEAR = 'AY 2026–27'

export const VERIFIER_ORGS = [
  { id: 'infosys', name: 'Infosys Ltd.' },
  { id: 'tcs', name: 'Tata Consultancy Services' },
  { id: 'lnt', name: 'L&T Technology Services' },
  { id: 'wipro', name: 'Wipro Ltd.' },
]

export const INITIAL_GRANTS = [
  {
    id: 'g-infosys',
    orgId: 'infosys',
    org: 'Infosys Ltd.',
    purpose: 'Campus placement background verification',
    scope: ['Enrolment status', 'Programme & batch'],
    expires: '2026-11-30',
    status: 'active',
  },
  {
    id: 'g-tcs',
    orgId: 'tcs',
    org: 'Tata Consultancy Services',
    purpose: 'National Qualifier Test profile match',
    scope: ['Enrolment status'],
    expires: '2027-01-15',
    status: 'active',
  },
  {
    id: 'g-aicte',
    orgId: 'aicte',
    org: 'AICTE',
    purpose: 'Statutory intake and approval monitoring',
    scope: ['Enrolment record', 'Intake category'],
    expires: null,
    status: 'statutory',
  },
]

export const INITIAL_ACTIVITY = [
  { id: 'a1', kind: 'statutory', who: 'AICTE', what: 'Annual intake verification', result: 'Matched sanctioned seat', at: '2026-10-01T09:00:00+05:30' },
]

// Backend validation_status values (validation_engine.py) → labels for people
export const STATUS = {
  VALID: { label: 'Verified', short: 'Verified', tone: 'ok' },
  MISSING_APAAR: { label: 'APAAR ID missing', short: 'APAAR missing', tone: 'err' },
  INVALID_APAAR_FORMAT: { label: 'Invalid APAAR ID', short: 'Invalid APAAR', tone: 'err' },
  DUPLICATE_APAAR: { label: 'Duplicate in this institution', short: 'Duplicate', tone: 'err' },
  CROSS_INSTITUTION_DUPLICATE: { label: 'Enrolled at another institution', short: 'Dual enrolment', tone: 'err' },
  INTAKE_EXCEEDED: { label: 'Over sanctioned intake', short: 'Over intake', tone: 'err' },
  DATA_INCONSISTENCY: { label: 'Data inconsistency', short: 'Inconsistent', tone: 'warn' },
}

export const FLAG_STATUSES = Object.keys(STATUS).filter((s) => s !== 'VALID')

export const statusInfo = (s) => STATUS[s] ?? { label: s, short: s, tone: 'neutral' }

// A college must never learn where else a student is enrolled. The backend's
// remark names the other college, so institution screens replace it.
export function remarkFor(student, role) {
  if (role !== 'aicte' && student.validation_status === 'CROSS_INSTITUTION_DUPLICATE') {
    return 'This student is actively enrolled at another AICTE-approved institution this year. Ask them for a migration certificate.'
  }
  return student.validation_remarks
}

export const ADMISSION_TYPES = [
  { value: 'Regular', label: 'Regular (sanctioned intake)' },
  { value: 'Supernumerary-TFW', label: 'Supernumerary: Tuition Fee Waiver (TFW)' },
  { value: 'Supernumerary-PMSSS', label: 'Supernumerary: PM Special Scholarship (PMSSS)' },
  { value: 'Supernumerary-Sports', label: 'Supernumerary: Sports quota' },
  { value: 'Supernumerary-EWS', label: 'Supernumerary: EWS' },
]

export const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS']
export const GENDERS = ['Male', 'Female', 'Other']
