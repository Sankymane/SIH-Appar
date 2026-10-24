import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { Badge } from '../components/ui.jsx'
import { RegisterHeading, SeatsBar } from '../components/Register.jsx'
import { BarList, ErrorState, Figures, Loading, useApi } from '../components/Data.jsx'
import { navFor } from '../components/nav.js'
import { getAnalytics, getInstitution, reportUrl } from '../api/index.js'
import { ACADEMIC_YEAR } from '../data/consent.js'
import { cx, inr } from '../lib/format.js'
import { Link } from '../lib/router.jsx'

export function institutionShellProps(account, path, crumb, inst) {
  return {
    subtitle: 'Institution portal',
    context: inst ? `${inst.name} · AICTE ID ${inst.aicte_id}` : account.org,
    nav: navFor('institution', path),
    user: { name: inst?.nodal_officer_name ?? 'Nodal officer', role: `${account.org}` },
    crumbs: [account.org, crumb],
    topExtra: <Badge tone="info" className="hidden md:inline-flex">{ACADEMIC_YEAR}</Badge>,
  }
}

export default function InstitutionOverview({ account, path }) {
  const id = account.aicteId
  const inst = useApi(() => getInstitution(id), [id])
  const stats = useApi(() => getAnalytics(id), [id])
  const d = inst.data
  const a = stats.data
  const btn = 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium'

  return (
    <Shell {...institutionShellProps(account, path, 'Overview', d)}>
      <ErrorState error={inst.error || stats.error} onRetry={() => (inst.reload(), stats.reload())} />
      {(!d || !a) && !(inst.error || stats.error) && <Loading>Loading your institution…</Loading>}
      {d && a && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <span>AICTE ID {d.aicte_id}</span>
            <span className="border-l border-line pl-4">{[d.district, d.state].filter(Boolean).join(', ')}</span>
            <span className="border-l border-line pl-4">{d.institution_type}</span>
            {d.nodal_officer_name && <span className="border-l border-line pl-4">Nodal officer: {d.nodal_officer_name}</span>}
          </div>
          <h1 className="mt-3 text-[15px] font-semibold text-muted">{d.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-220">
              <p className="text-[28px] leading-9 font-bold tracking-tight text-ink">
                {d.flagged_records_count > 0 ? (
                  <>
                    <span className="text-err">
                      {d.flagged_records_count} of your {inr(a.total_enrolled_students)} student records
                    </span>{' '}
                    need attention.
                  </>
                ) : a.total_enrolled_students ? (
                  `All ${inr(a.total_enrolled_students)} submitted student records passed validation.`
                ) : (
                  `You haven’t submitted any ${ACADEMIC_YEAR} student data yet.`
                )}
              </p>
              <p className="mt-2 text-[16px] leading-6 text-muted">
                {inr(d.total_enrolled_students)} students across {d.courses.length} approved courses, against {inr(d.total_approved_intake)} sanctioned seats.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/institution/upload" className={cx(btn, 'bg-primary-2 text-white hover:bg-primary')}>
                <Icon name="upload" size={17} /> Upload student data
              </Link>
              {d.flagged_records_count > 0 && (
                <Link to="/institution/students?status=flagged" className={cx(btn, 'border border-line bg-card hover:bg-surface-low')}>
                  <Icon name="alert" size={17} /> Review flagged
                </Link>
              )}
            </div>
          </div>

          <div className="mt-7">
            <Figures
              items={[
                ['Students submitted', inr(a.total_enrolled_students), `${inr(d.total_supernumerary_enrolled)} supernumerary`],
                ['Sanctioned seats', inr(a.total_approved_intake), `+${inr(a.total_supernumerary_intake)} supernumerary`],
                ['APAAR ID coverage', `${a.apaar_seeding_rate}%`, `${inr(a.total_apaar_seeded)} students`],
                ['Flagged records', inr(a.total_flagged_violations), 'need fixing', a.total_flagged_violations > 0],
              ]}
            />
          </div>

          <section className="mt-10">
            <RegisterHeading en="Course intake register" right={<span className="text-[12.5px] text-muted">Sanctioned seats vs. students submitted (tick = 100%)</span>} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-205 text-left text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2.5 pr-3 font-semibold">Course</th>
                    <th className="py-2.5 pr-3 font-semibold">Level</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Sanctioned</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Regular</th>
                    <th className="py-2.5 pl-6 font-semibold">Seats used</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Supernumerary</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">NRI / FN quota</th>
                  </tr>
                </thead>
                <tbody>
                  {d.courses.map((c) => {
                    const over = c.enrolled_count > c.approved_intake
                    const superOver = c.supernumerary_count > c.supernumerary_intake
                    return (
                      <tr key={c.id} className="border-b border-line-soft">
                        <td className="py-3 pr-3 font-medium" style={over ? { boxShadow: 'inset 3px 0 0 var(--color-err)', paddingLeft: 10 } : undefined}>
                          {c.department}
                        </td>
                        <td className="py-3 pr-3 text-muted">{c.level}</td>
                        <td className="py-3 pr-3 text-right">{c.approved_intake}</td>
                        <td className={cx('py-3 pr-3 text-right', over && 'font-semibold text-err')}>{c.enrolled_count}</td>
                        <td className="py-3 pl-6">
                          <SeatsBar sanctioned={c.approved_intake} enrolled={c.enrolled_count} />
                        </td>
                        <td className={cx('py-3 pr-3 text-right', superOver && 'font-semibold text-err')}>
                          {c.supernumerary_count} / {c.supernumerary_intake}
                        </td>
                        <td className="py-3 pr-3 text-right text-muted">
                          {c.nri_quota} / {c.fn_quota}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <RegisterHeading en="Admissions profile" />
            {a.total_enrolled_students ? (
              <div className="mt-4 grid gap-8 md:grid-cols-3">
                <BarList title="Admission quota" items={Object.entries(a.quota_distribution).map(([label, value]) => ({ label, value }))} />
                <BarList title="Social category" items={Object.entries(a.category_distribution).map(([label, value]) => ({ label, value }))} />
                <BarList title="Gender" items={Object.entries(a.gender_distribution).map(([label, value]) => ({ label, value }))} />
              </div>
            ) : (
              <p className="py-6 text-muted">Charts appear once you’ve submitted student data.</p>
            )}
          </section>

          <section className="mt-10">
            <RegisterHeading en="Reports for AICTE" />
            <ul className="mt-2 divide-y divide-line-soft">
              {[
                ['Student roster', 'Every student you’ve submitted, with APAAR ID, quota flags and validation status.', 'students'],
                ['Intake compliance', 'Sanctioned vs. admitted seats per course, with flagged discrepancies.', 'compliance'],
              ].map(([t, desc, type]) => (
                <li key={type} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{t}</div>
                    <div className="text-[13px] text-muted">{desc}</div>
                  </div>
                  <a href={reportUrl(type, 'xlsx', id)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary-2 underline underline-offset-4">
                    <Icon name="download" size={15} /> Excel
                  </a>
                  <a href={reportUrl(type, 'csv', id)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary-2 underline underline-offset-4">
                    <Icon name="download" size={15} /> CSV
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Shell>
  )
}
