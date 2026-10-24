// Pre-upload checks for an admissions file, run in the browser before anything
// reaches the server. They mirror the backend's validation engine
// (backend/app/validation_engine.py) and add checks the bulk upload skips, so a
// college fixes mistakes first instead of storing flagged records.
//
// The cross-institution duplicate check can only run on the server: a college
// can't see other colleges' students.

// Same columns as the backend's bulk upload template, plus optional date_of_birth
export const CSV_HEADERS = ['apaar_id', 'enrollment_no', 'full_name', 'gender', 'category', 'department', 'admission_type', 'is_nri', 'is_oci', 'is_fn', 'date_of_birth']
export const REQUIRED_HEADERS = ['apaar_id', 'enrollment_no', 'full_name', 'department']

const ADMISSION_TYPES = ['Regular', 'Supernumerary-TFW', 'Supernumerary-PMSSS', 'Supernumerary-Sports', 'Supernumerary-EWS']
const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS']
const GENDERS = ['Male', 'Female', 'Other']
const RESERVED = ['SC', 'ST', 'OBC-NCL']

export const RULES = {
  REQUIRED: { severity: 'error', title: 'Required field missing', fix: 'Fill in the missing value.' },
  MISSING_APAAR: { severity: 'error', title: 'APAAR ID missing', fix: 'Ask the student for their APAAR ID from DigiLocker.' },
  APAAR_FORMAT: { severity: 'error', title: 'APAAR ID must be 12 digits', fix: 'Copy the ID from the student’s DigiLocker APAAR card.' },
  DUPLICATE_IN_FILE: { severity: 'error', title: 'Same APAAR ID twice in this file', fix: 'Remove the repeated row.' },
  DUPLICATE_ENROLMENT: { severity: 'error', title: 'Same enrolment number twice in this file', fix: 'Give each student a unique enrolment number.' },
  ALREADY_SUBMITTED: { severity: 'error', title: 'Already in your roster', fix: 'Remove this row. Edit the existing record from the Students page instead.' },
  COURSE_UNKNOWN: { severity: 'error', title: 'Course isn’t approved for your institution', fix: 'Use the course name exactly as it appears in your approved intake.' },
  ADMISSION_TYPE: { severity: 'error', title: 'Unknown admission type', fix: `Use one of: ${ADMISSION_TYPES.join(', ')}.` },
  INTAKE_EXCEEDED: { severity: 'error', title: 'Over sanctioned intake', fix: 'Move the student to a supernumerary category if eligible, or withdraw the admission.' },
  SUPERNUMERARY_EXCEEDED: { severity: 'error', title: 'Over supernumerary seats', fix: 'Check the supernumerary approval for this course.' },
  FN_RESERVED: { severity: 'error', title: 'Foreign national in a reserved category', fix: 'Foreign nationals can’t claim SC, ST or OBC reservation. Correct the category.' },
  DATE_FORMAT: { severity: 'error', title: 'Date of birth must be YYYY-MM-DD', fix: 'Re-enter the date from the school-leaving certificate.' },
  AGE_RANGE: { severity: 'error', title: 'Age outside the admissible range', fix: 'Check the date of birth against the SSC certificate.' },
  CATEGORY_UNKNOWN: { severity: 'warning', title: 'Unrecognised category', fix: `Use one of: ${CATEGORIES.join(', ')}.` },
  GENDER_UNKNOWN: { severity: 'warning', title: 'Unrecognised gender', fix: `Use one of: ${GENDERS.join(', ')}.` },
  NRI_AND_FN: { severity: 'warning', title: 'Marked both NRI and foreign national', fix: 'A student is usually one or the other. Check the passport.' },
}

const yes = (v) => ['true', '1', 'yes', 'y'].includes(String(v ?? '').trim().toLowerCase())
const cleanId = (v) => String(v ?? '').trim().replace(/[\s-]/g, '')
const isSuper = (t) => String(t).startsWith('Supernumerary')

function validIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/**
 * rows: parsed CSV records ({ __row, ...columns })
 * courses: backend CourseIntake list for this institution (with enrolled_count, supernumerary_count)
 * roster: this institution's existing students (backend Student list)
 */
export function validateRows(rows, { courses, roster }) {
  const issues = []
  const byDept = Object.fromEntries(courses.map((c) => [c.department.toLowerCase(), c]))
  const existingIds = new Map(roster.filter((s) => s.apaar_id).map((s) => [cleanId(s.apaar_id), s.enrollment_no]))
  const seenId = new Map()
  const seenEnrol = new Map()
  const counts = Object.fromEntries(courses.map((c) => [c.id, { regular: 0, supernumerary: 0 }]))

  const add = (row, rule, field, detail) =>
    issues.push({
      id: `${row.__row}-${rule}`,
      row: row.__row,
      apaar: row.apaar_id,
      name: row.full_name || '—',
      course: row.department,
      field,
      rule,
      severity: RULES[rule].severity,
      title: RULES[rule].title,
      detail,
      fix: RULES[rule].fix,
    })

  for (const row of rows) {
    for (const f of ['enrollment_no', 'full_name', 'department']) {
      if (!String(row[f] ?? '').trim()) add(row, 'REQUIRED', f, `“${f}” is empty.`)
    }

    const raw = String(row.apaar_id ?? '').trim()
    const id = cleanId(raw)
    let distinct = true
    if (!raw || ['none', 'null', 'na', 'nan'].includes(raw.toLowerCase())) {
      add(row, 'MISSING_APAAR', 'apaar_id', 'No APAAR ID given.')
    } else if (!/^\d{12}$/.test(id)) {
      add(row, 'APAAR_FORMAT', 'apaar_id', `“${raw}” has ${id.length} characters${/\D/.test(id) ? ', including non-digits' : ''}.`)
    } else if (new Set(id).size === 1) {
      add(row, 'APAAR_FORMAT', 'apaar_id', 'An APAAR ID can’t be one repeated digit.')
    } else if (seenId.has(id)) {
      add(row, 'DUPLICATE_IN_FILE', 'apaar_id', `Also in row ${seenId.get(id)}.`)
      distinct = false
    } else if (existingIds.has(id)) {
      add(row, 'ALREADY_SUBMITTED', 'apaar_id', `Submitted earlier as enrolment ${existingIds.get(id)}.`)
      distinct = false
    }
    if (/^\d{12}$/.test(id) && !seenId.has(id)) seenId.set(id, row.__row)

    const enrol = String(row.enrollment_no ?? '').trim()
    if (enrol) {
      if (seenEnrol.has(enrol)) add(row, 'DUPLICATE_ENROLMENT', 'enrollment_no', `Also in row ${seenEnrol.get(enrol)}.`)
      else seenEnrol.set(enrol, row.__row)
    }

    const type = String(row.admission_type ?? '').trim() || 'Regular'
    if (!ADMISSION_TYPES.includes(type)) add(row, 'ADMISSION_TYPE', 'admission_type', `“${type}” isn’t a recognised admission type.`)

    const course = byDept[String(row.department ?? '').trim().toLowerCase()]
    if (String(row.department ?? '').trim() && !course) add(row, 'COURSE_UNKNOWN', 'department', `“${row.department}” isn’t on your approved list.`)

    const category = String(row.category ?? '').trim() || 'General'
    if (!CATEGORIES.includes(category)) add(row, 'CATEGORY_UNKNOWN', 'category', `“${category}”.`)
    const gender = String(row.gender ?? '').trim() || 'Male'
    if (!GENDERS.includes(gender)) add(row, 'GENDER_UNKNOWN', 'gender', `“${gender}”.`)

    if (yes(row.is_fn) && RESERVED.includes(category)) add(row, 'FN_RESERVED', 'category', `Foreign national with category ${category}.`)
    if (yes(row.is_fn) && yes(row.is_nri)) add(row, 'NRI_AND_FN', 'is_nri', 'Both NRI and FN are marked.')

    const dob = String(row.date_of_birth ?? '').trim()
    if (dob) {
      if (!validIsoDate(dob)) add(row, 'DATE_FORMAT', 'date_of_birth', `“${dob}” isn’t a valid date.`)
      else {
        const age = new Date().getFullYear() - Number(dob.slice(0, 4))
        if (age < 14 || age > 65) add(row, 'AGE_RANGE', 'date_of_birth', `Student would be ${age} years old.`)
      }
    }

    // Seat counting: only rows that are a real, distinct student
    if (course && distinct && ADMISSION_TYPES.includes(type)) {
      const c = counts[course.id]
      if (isSuper(type)) {
        c.supernumerary++
        const used = (course.supernumerary_count ?? 0) + c.supernumerary
        if (used > course.supernumerary_intake) add(row, 'SUPERNUMERARY_EXCEEDED', 'admission_type', `Supernumerary seat ${used} of ${course.supernumerary_intake}.`)
      } else {
        c.regular++
        const used = (course.enrolled_count ?? 0) + c.regular
        if (used > course.approved_intake) add(row, 'INTAKE_EXCEEDED', 'admission_type', `Seat ${used} of ${course.approved_intake} sanctioned.`)
      }
    }
  }

  const errorRows = new Set(issues.filter((i) => i.severity === 'error').map((i) => i.row))
  return {
    issues,
    total: rows.length,
    validRows: rows.length - errorRows.size,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
    errorRows: errorRows.size,
    intake: courses
      .filter((c) => counts[c.id].regular || counts[c.id].supernumerary)
      .map((c) => ({
        id: c.id,
        name: c.department,
        level: c.level,
        sanctioned: c.approved_intake,
        existing: c.enrolled_count ?? 0,
        adding: counts[c.id].regular,
        superAllowed: c.supernumerary_intake,
        superUsed: (c.supernumerary_count ?? 0) + counts[c.id].supernumerary,
      })),
  }
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
