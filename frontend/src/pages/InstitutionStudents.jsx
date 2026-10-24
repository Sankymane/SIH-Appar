import { useEffect, useState } from 'react'
import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Field, Modal, Toast, inputBase, inputClass } from '../components/ui.jsx'
import { RegisterHeading } from '../components/Register.jsx'
import { ErrorState, Loading, Pager, StatusTag, useApi } from '../components/Data.jsx'
import Certificate from '../components/Certificate.jsx'
import { institutionShellProps } from './InstitutionOverview.jsx'
import { createStudent, deleteStudent, getInstitution, listFlaggedStudents, listStudents } from '../api/index.js'
import { ADMISSION_TYPES, CATEGORIES, FLAG_STATUSES, GENDERS, remarkFor, statusInfo } from '../data/consent.js'
import { apaar as fmtApaar, cx, inr } from '../lib/format.js'

const PAGE_SIZE = 20

function AddStudent({ courses, onClose, onAdded }) {
  const [f, setF] = useState({
    full_name: '',
    enrollment_no: '',
    apaar_id: '',
    gender: 'Female',
    category: 'General',
    date_of_birth: '',
    course_id: courses[0]?.id ?? '',
    admission_type: 'Regular',
    is_nri: false,
    is_oci: false,
    is_fn: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const course = courses.find((c) => String(c.id) === String(f.course_id))
      const s = await createStudent({
        ...f,
        apaar_id: f.apaar_id.replace(/\s/g, '') || null,
        date_of_birth: f.date_of_birth || null,
        course_id: course?.id ?? null,
        department: course?.department ?? '',
        program: course?.program,
        level: course?.level ?? 'UG',
        academic_year: '2026-2027',
      })
      setResult(s)
      onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const ok = result.validation_status === 'VALID'
    return (
      <Modal open title={ok ? 'Student added' : 'Student added, but flagged'} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
        <div className={cx('rounded-md p-4', ok ? 'bg-ok-bg/50' : 'bg-err-bg/40')}>
          <StatusTag status={result.validation_status} long />
          <p className="mt-1.5 text-[14px]">{remarkFor(result, 'institution')}</p>
        </div>
        <p className="mt-3 text-[13.5px] text-muted">
          {result.full_name} · {result.enrollment_no}
          {!ok && '. Fix the details or remove the record from the roster.'}
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      open
      title="Add a student"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="add-student" disabled={busy || !f.full_name || !f.enrollment_no}>
            {busy ? 'Checking…' : 'Add and validate'}
          </Button>
        </>
      }
    >
      <form id="add-student" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Full name">
            <input className={inputClass} value={f.full_name} onChange={set('full_name')} autoFocus />
          </Field>
        </div>
        <Field label="Enrolment number">
          <input className={inputClass} value={f.enrollment_no} onChange={set('enrollment_no')} />
        </Field>
        <Field label="APAAR ID" hint="12 digits, from the student’s DigiLocker">
          <input className={cx(inputClass, 'font-mono')} inputMode="numeric" value={f.apaar_id} onChange={set('apaar_id')} placeholder="XXXX XXXX XXXX" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Course">
            <select className={inputClass} value={f.course_id} onChange={set('course_id')}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.department} ({c.level})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Admission type">
            <select className={inputClass} value={f.admission_type} onChange={set('admission_type')}>
              {ADMISSION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Gender">
          <select className={inputClass} value={f.gender} onChange={set('gender')}>
            {GENDERS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select className={inputClass} value={f.category} onChange={set('category')}>
            {CATEGORIES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Date of birth">
          <input type="date" className={inputClass} value={f.date_of_birth} onChange={set('date_of_birth')} />
        </Field>
        <fieldset className="self-end">
          <legend className="mb-1.5 text-[13px] font-medium">Status</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
            {[
              ['is_nri', 'NRI'],
              ['is_oci', 'OCI'],
              ['is_fn', 'Foreign national'],
            ].map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="checkbox" className="size-4 accent-[#1e2a5a]" checked={f[k]} onChange={set(k)} /> {l}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-err-bg/60 px-3 py-2 text-[13.5px] text-err">
          {error}
        </p>
      )}
    </Modal>
  )
}

export default function InstitutionStudents({ account, path, params }) {
  const id = account.aicteId
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [dept, setDept] = useState('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [mask, setMask] = useState(false)
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(params.get('add') === '1')
  const [cert, setCert] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => setPage(1), [status, dept, debounced, mask])

  const inst = useApi(() => getInstitution(id), [id])
  const list = useApi(async () => {
    if (status === 'flagged') {
      let rows = await listFlaggedStudents(id)
      if (dept) rows = rows.filter((r) => r.department === dept)
      if (debounced) {
        const s = debounced.toLowerCase()
        rows = rows.filter((r) => [r.full_name, r.apaar_id ?? '', r.enrollment_no].some((v) => v.toLowerCase().includes(s)))
      }
      return { total: rows.length, page, total_pages: Math.ceil(rows.length / PAGE_SIZE), records: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) }
    }
    return listStudents({ aicte_id: id, status, department: dept, search: debounced, mask_pii: mask || undefined, page, page_size: PAGE_SIZE })
  }, [id, status, dept, debounced, mask, page])

  const flash = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  const remove = async () => {
    try {
      const r = await deleteStudent(removing.id)
      flash(r.message)
      setRemoving(null)
      list.reload()
      inst.reload()
    } catch (e) {
      flash(e.message)
    }
  }

  const d = inst.data
  const data = list.data
  const showApaar = (s) => {
    if (mask || !/^\d{12}$/.test(s.apaar_id ?? '')) return s.apaar_id || 'No APAAR ID'
    return fmtApaar(s.apaar_id)
  }

  return (
    <Shell {...institutionShellProps(account, path, 'Students', d)}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[15px] font-semibold text-muted">Student roster</h1>
        <span lang="hi" className="text-[14px] text-primary-3">
          छात्र सूची
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-end justify-between gap-6">
        <p className="max-w-220 text-[28px] leading-9 font-bold tracking-tight text-ink">
          {d ? `${inr(d.total_enrolled_students)} students submitted for 2026–27.` : 'Students submitted for 2026–27.'}
          {d?.flagged_records_count > 0 && <span className="text-err"> {d.flagged_records_count} flagged.</span>}
        </p>
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)} disabled={!d}>
          Add a student
        </Button>
      </div>

      <section className="mt-8">
        <RegisterHeading
          en="Student roster"
          right={
            <button
              type="button"
              aria-pressed={mask}
              onClick={() => setMask((m) => !m)}
              className={cx('inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium', mask ? 'border-saffron-2 bg-saffron-bg/50 text-saffron' : 'border-line bg-card text-muted hover:text-ink')}
            >
              <Icon name={mask ? 'lock' : 'eye'} size={15} />
              {mask ? 'APAAR IDs masked' : 'Mask APAAR IDs'}
            </button>
          }
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Icon name="search" size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle" />
            <input className={cx(inputBase, 'h-9 w-full pl-8 text-[13px]')} placeholder="Name, APAAR ID or enrolment number" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
          </div>
          <select className={cx(inputBase, 'h-9 text-[13px]')} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            <option value="VALID">Verified</option>
            <option value="flagged">All flagged</option>
            {FLAG_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusInfo(s).label}
              </option>
            ))}
          </select>
          <select className={cx(inputBase, 'h-9 text-[13px]')} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Course">
            <option value="">All courses</option>
            {d?.courses.map((c) => (
              <option key={c.id} value={c.department}>
                {c.department}
              </option>
            ))}
          </select>
        </div>

        <ErrorState error={list.error} onRetry={list.reload} />
        {!data && !list.error && <Loading>Loading students…</Loading>}
        {data && (
          <>
            <div className={cx('mt-2 overflow-x-auto', list.loading && 'opacity-60')}>
              <table className="w-full min-w-245 text-left text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2.5 pr-3 font-semibold">Student</th>
                    <th className="py-2.5 pr-3 font-semibold">APAAR ID</th>
                    <th className="py-2.5 pr-3 font-semibold">Enrolment no.</th>
                    <th className="py-2.5 pr-3 font-semibold">Course & admission</th>
                    <th className="py-2.5 pr-3 font-semibold">Status</th>
                    <th className="py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((s) => (
                    <tr key={s.id} className="border-b border-line-soft align-top hover:bg-surface-low">
                      <td className="py-3 pr-3" style={s.validation_status !== 'VALID' ? { boxShadow: 'inset 3px 0 0 var(--color-err)', paddingLeft: 10 } : undefined}>
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-[12.5px] text-muted">
                          {s.gender} · {s.category}
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[13px] whitespace-nowrap">{showApaar(s)}</td>
                      <td className="py-3 pr-3 font-mono text-[12.5px] text-muted">{s.enrollment_no}</td>
                      <td className="max-w-70 py-3 pr-3">
                        {s.department}
                        <div className="text-[12.5px] text-muted">
                          {s.admission_type.replace('Supernumerary-', 'Supernumerary: ')}
                          {s.is_nri && ' · NRI'}
                          {s.is_oci && ' · OCI'}
                          {s.is_fn && ' · Foreign national'}
                        </div>
                      </td>
                      <td className="max-w-95 py-3 pr-3">
                        <StatusTag status={s.validation_status} long />
                        {s.validation_status !== 'VALID' && <div className="mt-0.5 text-[12.5px] text-muted">{remarkFor(s, 'institution')}</div>}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <button type="button" onClick={() => setCert(s)} className="mr-3 font-semibold text-primary-2 underline underline-offset-4" title="Certificate specimen with APAAR ID">
                          Certificate
                        </button>
                        <button type="button" onClick={() => setRemoving(s)} className="font-semibold text-err underline underline-offset-4">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!data.records.length && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted">
                        {status || dept || debounced ? 'No students match these filters.' : 'No students yet. Upload your admissions file to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={page} totalPages={data.total_pages} total={data.total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </section>

      {adding && d && (
        <AddStudent
          courses={d.courses}
          onClose={() => setAdding(false)}
          onAdded={() => {
            list.reload()
            inst.reload()
          }}
        />
      )}
      <Modal
        open={!!removing}
        title={removing ? `Remove ${removing.full_name}?` : ''}
        onClose={() => setRemoving(null)}
        footer={
          <>
            <Button onClick={() => setRemoving(null)}>Keep student</Button>
            <Button variant="danger" onClick={remove}>
              Remove student
            </Button>
          </>
        }
      >
        <p className="text-[14px]">The record is deleted from AICTE’s registry. The removal is written to the audit trail.</p>
      </Modal>
      <Certificate s={cert} onClose={() => setCert(null)} />
      <Toast message={toast} />
    </Shell>
  )
}
