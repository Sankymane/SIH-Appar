import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { RegisterHeading } from '../components/Register.jsx'
import { BarList, ErrorState, Figures, Loading, StatusTag, useApi } from '../components/Data.jsx'
import { navFor } from '../components/nav.js'
import { getAnalytics, listFlaggedStudents, reportUrl } from '../api/index.js'
import { ACADEMIC_YEAR, FLAG_STATUSES } from '../data/consent.js'
import { cx, dateTime, inr, pct } from '../lib/format.js'
import { Link } from '../lib/router.jsx'

const MEANING = {
  CROSS_INSTITUTION_DUPLICATE: 'The same APAAR ID is actively enrolled at another institution.',
  DUPLICATE_APAAR: 'The same APAAR ID appears twice within one institution.',
  INTAKE_EXCEEDED: 'Admitted after the course’s sanctioned or supernumerary seats were full.',
  MISSING_APAAR: 'Submitted without an APAAR ID.',
  INVALID_APAAR_FORMAT: 'The APAAR ID isn’t 12 digits, or is a repeated digit.',
  DATA_INCONSISTENCY: 'Details contradict each other, such as a foreign national in a reserved category.',
}

function ReportLinks() {
  const link = 'inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-card px-3 text-[13px] font-medium hover:bg-surface-low'
  return (
    <div className="flex flex-wrap gap-2">
      <a className={link} href={reportUrl('students', 'xlsx')}>
        <Icon name="download" size={15} /> Student master roster
      </a>
      <a className={link} href={reportUrl('compliance', 'xlsx')}>
        <Icon name="download" size={15} /> Intake compliance audit
      </a>
    </div>
  )
}

export default function AicteDashboard({ account, path }) {
  const stats = useApi(() => getAnalytics(), [])
  const flagged = useApi(() => listFlaggedStudents(), [])
  const a = stats.data
  const f = flagged.data

  const byStatus = Object.fromEntries(FLAG_STATUSES.map((s) => [s, (f ?? []).filter((r) => r.validation_status === s)]))
  const institutions = new Set((f ?? []).map((r) => r.aicte_id)).size
  const intakeColleges = new Set(byStatus.INTAKE_EXCEEDED.map((r) => r.aicte_id)).size

  return (
    <Shell
      subtitle="AICTE oversight"
      context="National academic ledger for AICTE-approved institutions"
      nav={navFor('aicte', path)}
      user={{ name: account.name, role: account.title }}
      crumbs={['AICTE HQ, New Delhi', 'National overview']}
    >
      <ErrorState error={stats.error || flagged.error} onRetry={() => (stats.reload(), flagged.reload())} />
      {(!a || !f) && !(stats.error || flagged.error) && <Loading>Loading the national ledger…</Loading>}
      {a && f && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <span>Approval Bureau, AICTE HQ</span>
            <span className="border-l border-line pl-4">{ACADEMIC_YEAR}</span>
            <span className="flex items-center gap-1.5 border-l border-line pl-4">
              <span className="size-2 rounded-full bg-ok" /> Live from the APAAR Setu registry
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3">
            <h1 className="text-[15px] font-semibold text-muted">National overview</h1>
            <span lang="hi" className="text-[14px] text-primary-3">
              राष्ट्रीय अवलोकन
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-220">
              <p className="text-[30px] leading-9.5 font-bold tracking-tight text-ink">
                <span className="text-err">{inr(f.length)} student records</span> need review across {institutions}{' '}
                {institutions === 1 ? 'institution' : 'institutions'}.
              </p>
              <p className="mt-2 text-[16px] leading-6 text-muted">
                <span className="font-semibold text-ink">
                  {byStatus.CROSS_INSTITUTION_DUPLICATE.length} {byStatus.CROSS_INSTITUTION_DUPLICATE.length === 1 ? 'student appears' : 'students appear'} at
                  more than one institution
                </span>
                , and {byStatus.INTAKE_EXCEEDED.length} admissions at {intakeColleges} {intakeColleges === 1 ? 'institution' : 'institutions'} went over
                sanctioned intake. {a.apaar_seeding_rate}% of submitted students have an APAAR ID.
              </p>
            </div>
            <ReportLinks />
          </div>

          <div className="mt-7">
            <Figures
              items={[
                ['Students submitted with APAAR records', inr(a.total_enrolled_students), `${inr(a.total_apaar_seeded)} with an APAAR ID`],
                ['Sanctioned seats nationwide', inr(a.total_approved_intake), `${a.intake_utilization_rate}% reported so far`],
                ['APAAR ID coverage', `${a.apaar_seeding_rate}%`, 'of submitted students'],
                ['Flagged records', inr(a.total_flagged_violations), 'awaiting review', a.total_flagged_violations > 0],
              ]}
            />
          </div>

          <section className="mt-10">
            <RegisterHeading
              en="Validation findings"
              right={
                <Link to="/aicte/flagged" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-2 underline underline-offset-4">
                  Review all flagged records <Icon name="chevronRight" size={14} />
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-205 text-left text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2.5 pr-3 font-semibold">Finding</th>
                    <th className="py-2.5 pr-3 font-semibold">What it means</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Records</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Institutions</th>
                    <th className="py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {FLAG_STATUSES.map((s) => {
                    const rows = byStatus[s]
                    const n = new Set(rows.map((r) => r.aicte_id)).size
                    return (
                      <tr key={s} className="border-b border-line-soft">
                        <td className="py-3 pr-3 font-medium">
                          <StatusTag status={s} long />
                        </td>
                        <td className="py-3 pr-3 text-[13px] text-muted">{MEANING[s]}</td>
                        <td className={cx('py-3 pr-3 text-right', rows.length ? 'font-semibold text-ink' : 'text-muted')}>{rows.length}</td>
                        <td className="py-3 pr-3 text-right text-muted">{n}</td>
                        <td className="py-3 pl-3 text-right">
                          {rows.length > 0 && (
                            <Link to={`/aicte/flagged?status=${s}`} className="font-semibold whitespace-nowrap text-primary-2 underline underline-offset-4">
                              Review
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <RegisterHeading en="Recently flagged" />
            <ul className="divide-y divide-line-soft">
              {f.slice(0, 5).map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-[14px]">
                  <span className="w-40 shrink-0">
                    <StatusTag status={r.validation_status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{r.full_name}</span>
                    <span className="text-muted"> · {r.college_name}</span>
                  </span>
                  <span className="text-[13px] text-muted">{r.created_at ? dateTime(r.created_at) : ''}</span>
                </li>
              ))}
              {!f.length && <li className="py-6 text-center text-muted">Nothing flagged yet.</li>}
            </ul>
          </section>

          <section className="mt-10">
            <RegisterHeading en="Admissions profile" right={<span className="text-[12.5px] text-muted">All submitted students, {ACADEMIC_YEAR}</span>} />
            <div className="mt-4 grid gap-8 md:grid-cols-3">
              <BarList title="Admission quota" items={Object.entries(a.quota_distribution).map(([label, value]) => ({ label, value }))} />
              <BarList title="Social category" items={Object.entries(a.category_distribution).map(([label, value]) => ({ label, value }))} />
              <BarList title="Gender" items={Object.entries(a.gender_distribution).map(([label, value]) => ({ label, value }))} />
            </div>
            <p className="mt-4 text-[12.5px] text-muted">
              {inr(a.total_enrolled_students)} students against {inr(a.total_approved_intake)} sanctioned seats ({pct(a.total_enrolled_students, a.total_approved_intake)}%). Most
              institutions haven’t submitted yet.
            </p>
          </section>
        </>
      )}
    </Shell>
  )
}
