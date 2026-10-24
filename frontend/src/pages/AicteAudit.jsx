import { useState } from 'react'
import Shell from '../components/Shell.jsx'
import { RegisterHeading, TextTabs } from '../components/Register.jsx'
import { ErrorState, Loading, Pager, useApi } from '../components/Data.jsx'
import { navFor } from '../components/nav.js'
import { listAuditTrail } from '../api/index.js'
import { cx, dateTime } from '../lib/format.js'

const ROLES = [
  { value: '--All--', label: 'All' },
  { value: 'INSTITUTE_ADMIN', label: 'Institutions' },
  { value: 'AICTE_VERIFIER', label: 'AICTE' },
  { value: 'SYSTEM', label: 'Validation engine' },
]
const ROLE_LABEL = { INSTITUTE_ADMIN: 'Institution', AICTE_VERIFIER: 'AICTE', SYSTEM: 'Validation engine' }
const ACTION_LABEL = {
  SYSTEM_INIT: 'Registry initialised',
  INSTITUTE_LOGIN_SUCCESS: 'Signed in',
  STUDENT_ENROLLED: 'Student added',
  BULK_UPLOAD: 'Bulk upload',
  STUDENT_DELETED: 'Student removed',
  VERIFICATION_STATUS_CHANGED: 'Verification changed',
  VALIDATION_ALERT: 'Validation alert',
  INTAKE_EXCEEDED_ALERT: 'Intake alert',
}
const PAGE_SIZE = 25

export default function AicteAudit({ account, path }) {
  const [role, setRole] = useState('--All--')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(() => listAuditTrail({ actor_role: role, page, page_size: PAGE_SIZE }), [role, page])

  return (
    <Shell
      subtitle="AICTE oversight"
      context="National academic ledger for AICTE-approved institutions"
      nav={navFor('aicte', path)}
      user={{ name: account.name, role: account.title }}
      crumbs={['AICTE HQ, New Delhi', 'Audit trail']}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[15px] font-semibold text-muted">Audit trail</h1>
        <span lang="hi" className="text-[14px] text-primary-3">
          ऑडिट ट्रेल
        </span>
      </div>
      <p className="mt-1.5 max-w-220 text-[28px] leading-9 font-bold tracking-tight text-ink">
        Every sign-in, upload, approval and removal, newest first.
      </p>
      <p className="mt-2 max-w-3xl text-[15px] text-muted">Entries are written by the server and can’t be edited from any portal.</p>

      <section className="mt-8">
        <RegisterHeading en="Audit trail" right={<TextTabs label="By" options={ROLES} value={role} onChange={(v) => { setRole(v); setPage(1) }} />} />
        <ErrorState error={error} onRetry={reload} />
        {!data && !error && <Loading />}
        {data && (
          <>
            <div className={cx('overflow-x-auto', loading && 'opacity-60')}>
              <table className="w-full min-w-205 text-left text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2.5 pr-3 font-semibold">When</th>
                    <th className="py-2.5 pr-3 font-semibold">Action</th>
                    <th className="py-2.5 pr-3 font-semibold">By</th>
                    <th className="py-2.5 pr-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((l) => {
                    const alert = /ALERT|EXCEEDED|DELETED/.test(l.action)
                    return (
                      <tr key={l.id} className="border-b border-line-soft align-top">
                        <td className="py-3 pr-3 text-[13px] whitespace-nowrap text-muted">{dateTime(l.timestamp)}</td>
                        <td className={cx('py-3 pr-3 font-medium whitespace-nowrap', alert && 'text-err')}>{ACTION_LABEL[l.action] ?? l.action}</td>
                        <td className="max-w-70 py-3 pr-3">
                          {l.actor_name}
                          <div className="text-[12px] text-muted">{ROLE_LABEL[l.actor_role] ?? l.actor_role}</div>
                        </td>
                        <td className="max-w-130 py-3 pr-3 text-[13px] text-muted">{l.details}</td>
                      </tr>
                    )
                  })}
                  {!data.records.length && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted">
                        No entries for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.total_pages} total={data.total} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </section>
    </Shell>
  )
}
