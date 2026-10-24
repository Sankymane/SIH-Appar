import { useEffect, useState } from 'react'
import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Drawer, inputBase } from '../components/ui.jsx'
import { RegisterHeading, SeatsBar, TextTabs } from '../components/Register.jsx'
import { ErrorState, Loading, Pager, useApi } from '../components/Data.jsx'
import { navFor } from '../components/nav.js'
import { getInstitution, getInstitutionFilters, listInstitutions, reportUrl } from '../api/index.js'
import { cx, inr, pct } from '../lib/format.js'
import { Link } from '../lib/router.jsx'

const COMPLIANCE = {
  COMPLIANT: { label: 'Within intake', dot: 'bg-ok' },
  NEAR_CAPACITY: { label: 'Near capacity', dot: 'bg-warn' },
  EXCEEDED: { label: 'Over intake', dot: 'bg-err' },
}
const PAGE_SIZE = 25

function Detail({ code, aicte, onClose }) {
  const { data: d, error } = useApi(() => getInstitution(code), [code])
  return (
    <Drawer
      open
      title={d?.name ?? 'Loading…'}
      onClose={onClose}
      footer={
        d && (
          <div className="flex w-full flex-wrap gap-2">
            {aicte ? (
              <>
                <Link to={`/aicte/flagged?college=${encodeURIComponent(d.aicte_id)}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-2 px-4 text-sm font-medium text-white hover:bg-primary">
                  <Icon name="alert" size={17} /> Flagged records ({d.flagged_records_count})
                </Link>
                <a href={reportUrl('compliance', 'xlsx', d.aicte_id)} className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-card px-4 text-sm font-medium hover:bg-surface-low">
                  <Icon name="download" size={17} /> Compliance report
                </a>
              </>
            ) : (
              <Link to={`/login?as=institution&college=${encodeURIComponent(d.aicte_id)}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-2 px-4 text-sm font-medium text-white hover:bg-primary">
                <Icon name="lock" size={17} /> Sign in as this institution
              </Link>
            )}
          </div>
        )
      }
    >
      <ErrorState error={error} />
      {!d && !error && <Loading />}
      {d && (
        <div className="space-y-6">
          <dl className="divide-y divide-line-soft border-y border-line-soft text-[13.5px]">
            {[
              ['AICTE ID', d.aicte_id],
              ['Address', [d.address, d.district].filter(Boolean).join(', ')],
              ['State', d.state],
              ['Type', d.institution_type],
              ['Women’s institution', d.women === 'Y' ? 'Yes' : 'No'],
              ['Minority institution', d.minority === 'Y' ? 'Yes' : 'No'],
              ['Nodal officer', d.nodal_officer_name],
              ['Officer email', d.nodal_officer_email],
              ['Website', d.website],
            ]
              .filter(([, v]) => v)
              .map(([dt, dd]) => (
                <div key={dt} className="flex justify-between gap-4 py-2">
                  <dt className="shrink-0 text-muted">{dt}</dt>
                  <dd className="min-w-0 text-right font-medium break-words">{dd}</dd>
                </div>
              ))}
          </dl>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Sanctioned', inr(d.total_approved_intake)],
              ['Enrolled', inr(d.total_enrolled_students)],
              ['Flagged', inr(d.flagged_records_count), d.flagged_records_count > 0],
            ].map(([l, v, bad]) => (
              <div key={l} className="rounded-md bg-surface-low px-2 py-2.5">
                <div className="text-[12px] text-muted">{l}</div>
                <div className={cx('text-lg font-semibold', bad && 'text-err')}>{v}</div>
              </div>
            ))}
          </div>

          <section>
            <h3 className="mb-2 text-[13px] font-semibold">Approved courses, {d.courses[0]?.academic_year ?? '2026-2027'}</h3>
            <table className="w-full text-left text-[13px]">
              <thead className="text-[12px] text-muted">
                <tr className="border-b border-line">
                  <th className="py-1.5 pr-2 font-semibold">Course</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Sanctioned</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Regular</th>
                  <th className="py-1.5 text-right font-semibold">Supernum.</th>
                </tr>
              </thead>
              <tbody>
                {d.courses.map((c) => {
                  const over = c.enrolled_count > c.approved_intake
                  return (
                    <tr key={c.id} className="border-b border-line-soft align-top">
                      <td className="py-2 pr-2">
                        {c.department}
                        <div className="text-[12px] text-muted">
                          {c.level} · {c.shift}
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-right">{c.approved_intake}</td>
                      <td className={cx('py-2 pr-2 text-right', over && 'font-semibold text-err')}>{c.enrolled_count}</td>
                      <td className={cx('py-2 text-right', c.supernumerary_count > c.supernumerary_intake && 'font-semibold text-err')}>
                        {c.supernumerary_count}/{c.supernumerary_intake}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </Drawer>
  )
}

export default function InstitutionsExplorer({ account, path, params }) {
  const aicte = account?.role === 'aicte'
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filters, setFilters] = useState({ state: '', institution_type: '', women: '', minority: '' })
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(params?.get('college') ?? null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => setPage(1), [debounced, filters])

  const meta = useApi(() => getInstitutionFilters(), [])
  const list = useApi(() => listInstitutions({ ...filters, search: debounced, page, page_size: PAGE_SIZE }), [filters, debounced, page])
  const data = list.data

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const select = cx(inputBase, 'h-9 text-[13px]')

  return (
    <Shell
      subtitle={aicte ? 'AICTE oversight' : 'Public registry'}
      context={aicte ? 'National academic ledger for AICTE-approved institutions' : 'AICTE-approved institutions and their sanctioned intake'}
      nav={navFor(aicte ? 'aicte' : 'public', path)}
      user={account ? { name: account.name, role: account.title } : null}
      crumbs={aicte ? ['AICTE HQ, New Delhi', 'Institutions & intake'] : ['Approved institutions']}
    >
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[15px] font-semibold text-muted">{aicte ? 'Institutions & intake' : 'Approved institutions'}</h1>
        <span lang="hi" className="text-[14px] text-primary-3">
          {aicte ? 'संस्थान एवं प्रवेश क्षमता' : 'अनुमोदित संस्थान'}
        </span>
      </div>
      <p className="mt-1.5 max-w-220 text-[28px] leading-9 font-bold tracking-tight text-ink">
        {data ? `${inr(data.total)} AICTE-approved institutions` : 'AICTE-approved institutions'}
        {debounced || Object.values(filters).some(Boolean) ? ' match your filters.' : ' in the registry.'}
      </p>
      <p className="mt-2 max-w-3xl text-[15px] text-muted">
        Sanctioned intake comes from the AICTE approval list. Enrolment counts are students submitted with an APAAR ID
        for 2026–27. Open an institution to see intake course by course.
      </p>

      <section className="mt-8">
        <RegisterHeading
          en={aicte ? 'Institutions & intake' : 'Approved institutions'}
          right={
            aicte && (
              <a href={reportUrl('compliance', 'xlsx')} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-2 underline underline-offset-4">
                <Icon name="download" size={15} /> National compliance report (.xlsx)
              </a>
            )
          }
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Icon name="search" size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle" />
            <input className={cx(inputBase, 'h-9 w-full pl-8 text-[13px]')} placeholder="Name, AICTE ID, district or address" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search institutions" />
          </div>
          <select className={select} value={filters.state} onChange={set('state')} aria-label="State">
            <option value="">All states</option>
            {meta.data?.states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className={select} value={filters.institution_type} onChange={set('institution_type')} aria-label="Institution type">
            <option value="">All types</option>
            {meta.data?.institution_types.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className={select} value={filters.women} onChange={set('women')} aria-label="Women’s institution">
            <option value="">Women’s: any</option>
            <option value="Y">Women’s only</option>
            <option value="N">Co-educational</option>
          </select>
          <select className={select} value={filters.minority} onChange={set('minority')} aria-label="Minority institution">
            <option value="">Minority: any</option>
            <option value="Y">Minority</option>
            <option value="N">Non-minority</option>
          </select>
        </div>

        <ErrorState error={list.error} onRetry={list.reload} />
        {!data && !list.error && <Loading>Loading institutions…</Loading>}
        {data && (
          <>
            <div className={cx('mt-3 overflow-x-auto transition-opacity', list.loading && 'opacity-60')}>
              <table className="w-full min-w-245 text-left text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2.5 pr-3 font-semibold">Institution</th>
                    <th className="py-2.5 pr-3 font-semibold">District</th>
                    <th className="py-2.5 pr-3 font-semibold">Type</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Sanctioned</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Enrolled</th>
                    <th className="py-2.5 pl-6 font-semibold">Seats used</th>
                    <th className="py-2.5 pr-3 font-semibold">Intake</th>
                    <th className="py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((c) => {
                    const st = COMPLIANCE[c.compliance_status] ?? COMPLIANCE.COMPLIANT
                    return (
                      <tr key={c.aicte_id} className="border-b border-line-soft align-top hover:bg-surface-low">
                        <td className="py-3 pr-3">
                          <div className="font-medium text-ink">{c.name}</div>
                          <div className="text-[12.5px] text-muted">
                            {c.aicte_id}
                            {c.women === 'Y' && ' · Women’s'}
                            {c.minority === 'Y' && ' · Minority'}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-muted">{c.district}</td>
                        <td className="py-3 pr-3 text-muted">{c.institution_type}</td>
                        <td className="py-3 pr-3 text-right">{inr(c.total_approved_intake)}</td>
                        <td className="py-3 pr-3 text-right">{inr(c.total_enrolled_students)}</td>
                        <td className="py-3 pt-4.5 pl-6">
                          <SeatsBar sanctioned={c.total_approved_intake || 1} enrolled={c.total_enrolled_students} />
                          <div className="mt-1 text-[11.5px] text-muted">{pct(c.total_enrolled_students, c.total_approved_intake)}%</div>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          <span className={cx('mr-2 inline-block size-2', st.dot)} />
                          {st.label}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button type="button" onClick={() => setOpen(c.aicte_id)} className="font-semibold whitespace-nowrap text-primary-2 underline underline-offset-4 hover:text-primary">
                            Open file
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {!data.records.length && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted">
                        No institutions match these filters.
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
      {open && <Detail code={open} aicte={aicte} onClose={() => setOpen(null)} />}
    </Shell>
  )
}
