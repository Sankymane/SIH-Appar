// Demo admissions files, generated from a college's real approved courses.
// Same college → same file every time, so uploading twice is caught.
//
// Every college's file includes the same three "shared applicants" (students who
// took admission at more than one college). The first college to upload them
// gets them verified; any other college that uploads them later is flagged by
// the server as a cross-institution duplicate.

import { CSV_HEADERS } from './validation.js'

const FIRST_F = ['Priya', 'Ananya', 'Sneha', 'Aditi', 'Pooja', 'Riya', 'Kavya', 'Isha', 'Neha', 'Tanvi', 'Shruti', 'Meera', 'Sakshi', 'Divya', 'Fatima']
const FIRST_M = ['Rahul', 'Aakash', 'Rohan', 'Arjun', 'Siddharth', 'Omkar', 'Pranav', 'Yash', 'Aditya', 'Kunal', 'Harsh', 'Tejas', 'Nikhil', 'Irfan', 'Karan']
const LAST = ['Deshmukh', 'Kulkarni', 'Verma', 'Iyer', 'Shinde', 'Mukherjee', 'Joshi', 'Patil', 'Naik', 'Gupta', 'Sharma', 'Reddy', 'Nair', 'Khan', 'Singh', 'Das', 'Mishra']
const CATS = ['General', 'General', 'OBC-NCL', 'SC', 'ST', 'EWS']

export const SHARED_APPLICANTS = [
  { apaar_id: '412907318826', full_name: 'Ishaan R. Mehta', gender: 'Male', category: 'General', date_of_birth: '2007-06-14' },
  { apaar_id: '506118243370', full_name: 'Nandini P. Rao', gender: 'Female', category: 'OBC-NCL', date_of_birth: '2007-11-02' },
  { apaar_id: '731564020915', full_name: 'Farhan A. Qureshi', gender: 'Male', category: 'EWS', date_of_birth: '2008-01-21' },
]

function rng(seedText) {
  let a = [...seedText].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 2166136261)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeId(r) {
  let s = String(2 + Math.floor(r() * 8))
  for (let i = 0; i < 11; i++) s += Math.floor(r() * 10)
  return s
}

const pad = (n) => String(n).padStart(2, '0')

function row(r, enrol, course, type = 'Regular', person) {
  const female = r() < 0.45
  const p = person ?? {
    apaar_id: makeId(r),
    full_name: `${(female ? FIRST_F : FIRST_M)[Math.floor(r() * 15)]} ${LAST[Math.floor(r() * LAST.length)]}`,
    gender: female ? 'Female' : 'Male',
    category: CATS[Math.floor(r() * CATS.length)],
    date_of_birth: `${course.level === 'PG' ? 2003 + Math.floor(r() * 2) : 2007 + Math.floor(r() * 2)}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 28))}`,
  }
  return { ...p, enrollment_no: enrol, department: course.department, admission_type: type, is_nri: 'false', is_oci: 'false', is_fn: 'false' }
}

export function sampleAdmissions(institution, roster) {
  const r = rng(institution.aicte_id)
  const tag = institution.aicte_id.replace(/\D/g, '').slice(-4)
  let seq = 0
  const enrol = () => `EN26-${tag}-${String(++seq).padStart(3, '0')}`
  const onRoster = new Set(roster.map((s) => String(s.apaar_id ?? '')))
  const courses = institution.courses.filter((c) => c.approved_intake - c.enrolled_count >= 6).slice(0, 4)
  const rows = []

  courses.forEach((c, i) => {
    const room = c.approved_intake - c.enrolled_count
    const n = Math.min(i === 0 ? 14 : 9, room - (i === 0 ? 4 : 0))
    for (let k = 0; k < n; k++) rows.push(row(r, enrol(), c))
    if (c.supernumerary_intake - c.supernumerary_count > 0) rows.push(row(r, enrol(), c, i % 2 ? 'Supernumerary-PMSSS' : 'Supernumerary-TFW'))
  })
  // A couple of quota flags so the profile charts have something to show
  if (rows[3]) rows[3].is_nri = 'true'
  if (rows[7]) rows[7].is_oci = 'true'

  // Shared applicants, plus the backend's seeded dual-enrolment student
  const first = courses[0]
  if (first) {
    for (const p of SHARED_APPLICANTS) if (!onRoster.has(p.apaar_id)) rows.push(row(r, enrol(), first, 'Regular', p))
    if (!onRoster.has('778899001122')) {
      rows.push(row(r, enrol(), first, 'Regular', { apaar_id: '778899001122', full_name: 'Manish V. Pandey', gender: 'Male', category: 'General', date_of_birth: '2005-03-25' }))
    }
  }
  return rows
}

export function sampleWithMistakes(institution, roster) {
  const rows = sampleAdmissions(institution, roster)
  const r = rng(`${institution.aicte_id}-mistakes`)
  const courses = institution.courses
  const c0 = courses[0]
  const tag = institution.aicte_id.replace(/\D/g, '').slice(-4)
  let seq = 500
  const enrol = () => `EN26-${tag}-${++seq}`

  if (rows[1]) rows[1].apaar_id = ''
  if (rows[4]) rows[4].apaar_id = '98234567'
  if (rows[6]) rows[6].apaar_id = '111111111111'
  if (rows[8]) rows[8].date_of_birth = '2016-05-12'
  if (rows[10]) {
    rows[10].is_fn = 'true'
    rows[10].category = 'SC'
  }
  if (rows[12]) rows[12].admission_type = 'Management Quota'
  const extra = []
  if (rows[2]) extra.push({ ...rows[2], enrollment_no: enrol() })
  extra.push({ ...row(r, enrol(), { ...c0, department: 'Artificial Intelligence and Data Science' }) })

  // Fill the smallest course past its sanctioned seats
  const target = [...courses].sort((a, b) => a.approved_intake - a.enrolled_count - (b.approved_intake - b.enrolled_count))[0]
  const onRoster = new Set(roster.map((x) => String(x.apaar_id ?? '')))
  const already = rows.filter((x) => x.department === target.department && x.admission_type === 'Regular' && !onRoster.has(x.apaar_id)).length
  const need = Math.max(0, target.approved_intake - target.enrolled_count - already) + 3
  for (let i = 0; i < Math.min(need, 80); i++) extra.push(row(r, enrol(), target))

  return [...rows, ...extra]
}

export function templateRows() {
  return [
    { apaar_id: '493017265881', enrollment_no: 'EN26-0001', full_name: 'Example Student', gender: 'Female', category: 'General', department: 'Computer Science and Engineering', admission_type: 'Regular', is_nri: 'false', is_oci: 'false', is_fn: 'false', date_of_birth: '2007-04-18' },
  ]
}

export { CSV_HEADERS }
