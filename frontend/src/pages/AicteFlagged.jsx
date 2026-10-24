import { useState } from 'react'
import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Drawer, Modal, Toast, inputBase } from '../components/ui.jsx'
import { RegisterHeading, TextTabs } from '../components/Register.jsx'
import { ErrorState, Loading, StatusTag, useApi } from '../components/Data.jsx'
import Certificate from '../components/Certificate.jsx'
import { navFor } from '../components/nav.js'
import { deleteStudent, listFlaggedStudents, toggleVerification } from '../api/index.js'
import { FLAG_STATUSES, statusInfo } from '../data/consent.js'
import { apaar as fmtApaar, cx, dateTime } from '../lib/format.js'
import { navigate } from '../lib/router.jsx'

const urgentEdge = { boxShadow: 'inset 3px 0 0 var(--color-err)', paddingLeft: '10px' }

export default function AicteFlagged({ account, path, params }) {
  const college = params.get('college')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [cert, setCert] = useState(null)
  const { data, error, loading, reload } = useApi(() => listFlaggedStudents(college || undefined), [college])

  const flash = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2800)
  }

  const counts = Object.fromEntries(FLAG_STATUSES.map((s) => [s, (data ?? []).filter((r) => r.validation_status === s).length]))
  const shown = (data ?? []).filter((r) => {
    if (status !== 'all' && r.validation_status !== status) return false
    if (q) {
      const s = q.toLowerCase()
      return [r.full_name, r.college_name, r.aicte_id, r.enrollment_no, r.apaar_id ?? ''].some((v) => String(v).toLowerCase().includes(s))
    }
    return true
  })
  const open = data?.find((r) => r.id === openId)
  const institutions = new Set((data ?? []).map((r) => r.aicte_id)).size

  const approve = async () => {
    setBusy(true)
    try {
      const r = await toggleVerification(open.id)
      flash(`${open.full_name}: ${r.message}`)
      setOpenId(null)
      reload()
    } catch (e) {
      flash(e.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const r = await deleteStudent(open.id)
      flash(r.message)
      setConfirm(false)
      setOpenId(null)
      reload()
    } catch (e) {
      flash(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      subtitle="AICTE oversight"
      context="National academic ledger for AICTE-approved institutions"
      nav={navFor('aicte', path)}
      user={{ name: account.name, role: account.title }}
      crumbs={['AICTE HQ, New Delhi', 'Flagged records']}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[15px] font-semibold text-muted">Flagged records</h1>
        <span lang="hi" className="text-[14px] text-primary-3">
          चिह्नित रिकॉर्ड
        </span>
      </div>
      <p className="mt-1.5 max-w-220 text-[28px] leading-9 font-bold tracking-tight text-ink">
        {data ? (
          <>
            <span className="text-err">{data.length} student records</span> were flagged by the validation engine
            {college ? ` at ${data[0]?.college_name ?? 'this institution'}.` : ` across ${institutions} institutions.`}
          </>
        ) : (
          'Student records flagged by the validation engine'
        )}
      </p>
      <p className="mt-2 max-w-3xl text-[15px] text-muted">
        Each record was stored with the reason it failed. Review the evidence, then approve the record or remove it.
        Flags are decision support; action against an institution needs an officer’s review.
      </p>
      {college && (
        <button type="button" onClick={() => navigate('/aicte/flagged')} className="mt-3 inline-flex items-center gap-1 rounded-sm bg-primary-tint px-2 py-1 text-[13px] text-primary-3">
          Showing one institution ({college}) <Icon name="x" size={13} />
        </button>
      )}

      <section className="mt-8">
        <RegisterHeading
          en="Flagged records"
          right={
            <div className="relative">
              <Icon name="search" size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle" />
              <input className={cx(inputBase, 'h-8 w-60 pl-8 text-[13px]')} placeholder="Student, institution or APAAR ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search flagged records" />
            </div>
          }
        />
        <div className="mt-3">
          <TextTabs
            label="Finding"
            options={[{ value: 'all', label: `All ${data?.length ?? ''}` }, ...FLAG_STATUSES.map((s) => ({ value: s, label: `${statusInfo(s).short} ${counts[s] ?? ''}` }))]}
            value={status}
            onChange={setStatus}
          />
        </div>

        <ErrorState error={error} onRetry={reload} />
        {!data && !error && <Loading>Loading flagged records…</Loading>}
        {data && (
          <div className={cx('mt-2 overflow-x-auto', loading && 'opacity-60')}>
            <table className="w-full min-w-245 text-left text-[14px]">
              <thead className="text-[12px] text-muted">
                <tr className="border-b border-line">
                  <th className="py-2.5 pr-3 font-semibold">Enrolment no.</th>
                  <th className="py-2.5 pr-3 font-semibold">Student</th>
                  <th className="py-2.5 pr-3 font-semibold">Institution</th>
                  <th className="py-2.5 pr-3 font-semibold">Finding</th>
                  <th className="py-2.5 pr-3 font-semibold">Flagged</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-b border-line-soft align-top hover:bg-surface-low">
                    <td className="py-3 pr-3 font-mono text-[12.5px] whitespace-nowrap text-muted" style={r.validation_status === 'CROSS_INSTITUTION_DUPLICATE' ? urgentEdge : undefined}>
                      {r.enrollment_no}
                    </td>
                    <td className="py-3 pr-3">
                      {r.full_name}
                      <div className="font-mono text-[12px] text-muted">{/^\d{12}$/.test(r.apaar_id ?? '') ? fmtApaar(r.apaar_id) : r.apaar_id || 'No APAAR ID'}</div>
                    </td>
                    <td className="max-w-70 py-3 pr-3">
                      {r.college_name}
                      <div className="text-[12px] text-muted">
                        {r.aicte_id} · {r.department}
                      </div>
                    </td>
                    <td className="max-w-95 py-3 pr-3">
                      <StatusTag status={r.validation_status} long />
                      <div className="mt-0.5 text-[12.5px] text-muted">{r.validation_remarks}</div>
                    </td>
                    <td className="py-3 pr-3 text-[13px] whitespace-nowrap text-muted">{r.created_at ? dateTime(r.created_at) : '—'}</td>
                    <td className="py-3 pl-3 text-right">
                      <button type="button" onClick={() => setOpenId(r.id)} className="font-semibold whitespace-nowrap text-primary-2 underline underline-offset-4 hover:text-primary">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted">
                      {data.length ? 'Nothing matches these filters.' : 'No flagged records. Every submitted student passed validation.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer
        open={!!open}
        title={open ? open.full_name : ''}
        onClose={() => setOpenId(null)}
        footer={
          open && (
            <div className="flex w-full flex-wrap gap-2">
              <Button variant="primary" icon="checkCircle" onClick={approve} disabled={busy}>
                Approve after review
              </Button>
              <Button icon="file" onClick={() => setCert(open)}>
                Certificate
              </Button>
              <Button variant="dangerGhost" onClick={() => setConfirm(true)} disabled={busy}>
                Remove record
              </Button>
            </div>
          )
        }
      >
        {open && (
          <div className="space-y-5">
            <div>
              <StatusTag status={open.validation_status} long />
              <p className="mt-2 text-[14.5px] leading-6">{open.validation_remarks}</p>
            </div>
            <dl className="divide-y divide-line-soft border-y border-line-soft text-[13.5px]">
              {[
                ['APAAR ID', /^\d{12}$/.test(open.apaar_id ?? '') ? fmtApaar(open.apaar_id) : open.apaar_id || 'Missing'],
                ['Enrolment number', open.enrollment_no],
                ['Institution', `${open.college_name} (${open.aicte_id})`],
                ['Course', `${open.department} · ${open.level}`],
                ['Admission type', open.admission_type],
                ['Category', open.category],
                ['NRI / OCI / Foreign national', [open.is_nri && 'NRI', open.is_oci && 'OCI', open.is_fn && 'FN'].filter(Boolean).join(', ') || 'None'],
                ['Flagged', open.created_at ? dateTime(open.created_at) : '—'],
              ].map(([dt, dd]) => (
                <div key={dt} className="flex justify-between gap-4 py-2">
                  <dt className="shrink-0 text-muted">{dt}</dt>
                  <dd className="text-right font-medium">{dd}</dd>
                </div>
              ))}
            </dl>
            <p className="flex gap-2 rounded-md bg-primary-tint/60 p-3 text-[12.5px] leading-5 text-primary-3">
              <Icon name="info" size={16} className="mt-0.5" />
              Approving overrides the engine’s finding and marks the record verified. It’s written to the audit trail
              with your role.
            </p>
          </div>
        )}
      </Drawer>

      <Modal
        open={confirm && !!open}
        title={open ? `Remove ${open.full_name}’s record?` : ''}
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Keep record</Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              Remove record
            </Button>
          </>
        }
      >
        <p className="text-[14px]">The record is deleted from the registry. The removal is written to the audit trail.</p>
      </Modal>
      <Certificate s={cert} onClose={() => setCert(null)} />
      <Toast message={toast} />
    </Shell>
  )
}
