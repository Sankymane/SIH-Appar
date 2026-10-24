import { useMemo, useRef, useState } from 'react'
import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { Badge, Button, Meter, Panel, Segmented, Severity, inputBase } from '../components/ui.jsx'
import { ErrorState, Loading, StatusTag, useApi } from '../components/Data.jsx'
import { institutionShellProps } from './InstitutionOverview.jsx'
import { bulkUploadStudents, getInstitution, listAllStudents } from '../api/index.js'
import { remarkFor } from '../data/consent.js'
import { downloadText, parseCsv, toCsv } from '../lib/csv.js'
import { CSV_HEADERS, REQUIRED_HEADERS, validateRows, sha256Hex } from '../lib/validation.js'
import { sampleAdmissions, sampleWithMistakes, templateRows } from '../lib/samples.js'
import { apaar as fmtApaar, cx, dateTime, inr, pct } from '../lib/format.js'
import { Link } from '../lib/router.jsx'

const PAGE = 10

function Steps({ stage, hasErrors }) {
  const steps = [
    { title: 'Choose file', done: stage !== 'empty' },
    { title: 'Check in browser', done: stage === 'uploading' || stage === 'done' || (stage === 'checked' && !hasErrors), active: stage === 'checked' && hasErrors },
    { title: 'Upload to AICTE', done: stage === 'done', active: (stage === 'checked' && !hasErrors) || stage === 'uploading' },
    { title: 'Server verdict', done: stage === 'done' },
  ]
  return (
    <ol className="grid gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft sm:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className={cx('flex items-center gap-3 px-4 py-3.5', s.active ? 'bg-saffron-bg/50' : 'bg-card')}>
          <span className={cx('flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold', s.done ? 'bg-ok text-white' : s.active ? 'bg-saffron text-white' : 'bg-surface-mid text-muted')}>
            {s.done ? <Icon name="check" size={15} strokeWidth={2.6} /> : i + 1}
          </span>
          <div className="min-w-0">
            <div className={cx('text-[13.5px] font-medium', s.done || s.active ? 'text-ink' : 'text-muted')}>{s.title}</div>
            <div className="text-[12px] text-muted">{s.done ? 'Done' : s.active ? 'Action needed' : 'Waiting'}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function InstitutionUpload({ account, path }) {
  const id = account.aicteId
  const ctx = useApi(async () => {
    const [institution, roster] = await Promise.all([getInstitution(id), listAllStudents({ aicte_id: id })])
    return { institution, roster }
  }, [id])

  const [stage, setStage] = useState('empty')
  const [file, setFile] = useState(null) // { name, text?, blob? }
  const [rows, setRows] = useState([])
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState(null)
  const fileRef = useRef(null)

  const inst = ctx.data?.institution
  // Freeze the check against the roster as it was when the file was loaded
  const [snapshot, setSnapshot] = useState(null)
  const result = useMemo(() => (snapshot && rows.length ? validateRows(rows, snapshot) : null), [snapshot, rows])

  const reset = () => {
    setStage('empty')
    setFile(null)
    setRows([])
    setOutcome(null)
    setError('')
  }

  const loadText = (text, name) => {
    const { headers, records } = parseCsv(text)
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
    if (!records.length) return setError(`${name} has no student rows. Download the template to see the format.`)
    if (missing.length) return setError(`${name} is missing these columns: ${missing.join(', ')}. Download the template and copy your data into it.`)
    setError('')
    setSnapshot({ courses: ctx.data.institution.courses, roster: ctx.data.roster })
    setFile({ name, text })
    setRows(records)
    setStage('checked')
    setTab('all')
    setQ('')
    setPage(0)
  }

  const onFile = (f) => {
    if (!f) return
    if (/\.xlsx?$/i.test(f.name)) {
      // Excel goes straight to the server, which parses it; no browser pre-check
      setError('')
      setFile({ name: f.name, blob: f })
      setRows([])
      setStage('checked')
      return
    }
    if (!/\.csv$/i.test(f.name)) return setError('Upload a .csv or .xlsx file.')
    const reader = new FileReader()
    reader.onload = () => loadText(String(reader.result), f.name)
    reader.readAsText(f)
  }

  const loadSample = (mistakes) => {
    const data = mistakes ? sampleWithMistakes(inst, ctx.data.roster) : sampleAdmissions(inst, ctx.data.roster)
    loadText(toCsv(CSV_HEADERS, data), mistakes ? 'admissions_2026_with_mistakes.csv' : 'admissions_2026.csv')
  }

  const upload = async () => {
    setStage('uploading')
    setError('')
    try {
      const content = file.blob ?? file.text
      const [res, hash] = await Promise.all([bulkUploadStudents(content, file.name), file.text ? sha256Hex(file.text) : Promise.resolve(null)])
      setOutcome({ ...res, hash, at: new Date().toISOString() })
      setStage('done')
      ctx.reload()
      window.scrollTo(0, 0)
    } catch (e) {
      setError(e.message)
      setStage('checked')
    }
  }

  const issues = result?.issues ?? []
  const filtered = issues.filter((i) => {
    if (tab !== 'all' && i.severity !== tab) return false
    if (q) {
      const s = q.toLowerCase()
      return [i.name, i.apaar, i.title, String(i.row)].some((v) => String(v ?? '').toLowerCase().includes(s))
    }
    return true
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE)
  const hasErrors = (result?.errorCount ?? 0) > 0

  const downloadReport = () => {
    const out = issues.map((i) => ({ row: i.row, apaar_id: i.apaar, full_name: i.name, department: i.course, field: i.field, severity: i.severity, issue: i.title, detail: i.detail, how_to_fix: i.fix }))
    downloadText(`${file.name.replace(/\.csv$/i, '')}_issues.csv`, toCsv(Object.keys(out[0] ?? { row: '' }), out))
  }

  return (
    <Shell {...institutionShellProps(account, path, 'Upload student data', inst)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-9 font-bold text-primary">Upload student data</h1>
          <p className="mt-1 max-w-2xl text-muted">
            One row per admitted student, keyed by APAAR ID. The file is checked here first, then AICTE’s validation
            engine checks every student again, including against other institutions.
          </p>
        </div>
        <Button icon="download" onClick={() => downloadText('AICTE_APAAR_Bulk_Student_Template.csv', toCsv(CSV_HEADERS, templateRows()))}>
          Download CSV template
        </Button>
      </div>

      <ErrorState error={ctx.error} onRetry={ctx.reload} />
      {!ctx.data && !ctx.error && <Loading>Loading your approved courses…</Loading>}

      {ctx.data && (
        <>
          <div className="mt-6">
            <Steps stage={stage} hasErrors={hasErrors} />
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          {error && (
            <div role="alert" className="mt-4 flex gap-2 rounded-md border border-err/30 bg-err-bg/50 px-4 py-3 text-[13.5px] text-err">
              <Icon name="alert" size={17} className="mt-0.5" /> {error}
            </div>
          )}

          {stage === 'empty' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]) }}
              className={cx('mt-6 flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors', drag ? 'border-saffron bg-saffron-bg/30' : 'border-line bg-card')}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-primary-tint text-primary-3">
                <Icon name="upload" size={26} />
              </span>
              <h2 className="mt-4 text-xl font-semibold">Drop your admissions file here</h2>
              <p className="mt-1 max-w-md text-muted">CSV is checked instantly in your browser before upload. Excel files are checked by the server.</p>
              <div className="mt-6">
                <Button variant="primary" icon="file" onClick={() => fileRef.current?.click()}>
                  Choose file
                </Button>
              </div>
              <div className="mt-8 border-t border-line-soft pt-5 text-[13px] text-muted">
                Demo files for this institution:
                <button type="button" className="ml-2 font-medium text-primary-3 underline-offset-2 hover:underline" onClick={() => loadSample(false)}>
                  admissions file
                </button>
                <span className="mx-2 text-subtle">·</span>
                <button type="button" className="font-medium text-primary-3 underline-offset-2 hover:underline" onClick={() => loadSample(true)}>
                  file with mistakes
                </button>
              </div>
            </div>
          )}

          {stage === 'done' && outcome && (
            <section className="mt-6 rounded-lg border border-line-soft bg-card">
              <div className={cx('flex flex-wrap items-start gap-4 border-b border-line-soft px-6 py-5', outcome.flagged_records ? 'bg-warn-bg/40' : 'bg-ok-bg/40')}>
                <span className={cx('flex size-11 items-center justify-center rounded-full text-white', outcome.flagged_records ? 'bg-warn' : 'bg-ok')}>
                  <Icon name={outcome.flagged_records ? 'alert' : 'check'} size={22} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-ink">
                    {outcome.flagged_records
                      ? `Uploaded. The server flagged ${outcome.flagged_records} ${outcome.flagged_records === 1 ? 'student' : 'students'}.`
                      : 'Uploaded. Every student was verified.'}
                  </h2>
                  <p className="text-muted">
                    {inr(outcome.successfully_enrolled)} of {inr(outcome.total_processed)} students verified against the national APAAR registry · {dateTime(outcome.at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/institution/students" className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-card px-4 text-sm font-medium hover:bg-surface-low">
                    <Icon name="users" size={17} /> Open roster
                  </Link>
                  <Button icon="upload" onClick={reset}>
                    Upload another file
                  </Button>
                </div>
              </div>
              {outcome.created_students.some((s) => s.validation_status !== 'VALID') && (
                <div className="px-6 py-5">
                  <h3 className="text-[15px] font-semibold">Flagged by the server</h3>
                  <p className="text-[13px] text-muted">These records are stored but marked for review. Fix or remove them from the roster.</p>
                  <ul className="mt-3 divide-y divide-line-soft border-y border-line-soft">
                    {outcome.created_students
                      .filter((s) => s.validation_status !== 'VALID')
                      .map((s) => (
                        <li key={s.id} className="flex flex-wrap gap-x-4 gap-y-1 py-3 text-[14px]">
                          <span className="w-56 shrink-0">
                            <span className="font-medium">{s.full_name}</span>
                            <span className="block font-mono text-[12px] text-muted">{/^\d{12}$/.test(s.apaar_id ?? '') ? fmtApaar(s.apaar_id) : s.apaar_id}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <StatusTag status={s.validation_status} long />
                            <span className="block text-[13px] text-muted">{remarkFor(s, 'institution')}</span>
                          </span>
                        </li>
                      ))}
                  </ul>
                  {outcome.total_processed > outcome.created_students.length && <p className="mt-2 text-[12.5px] text-muted">The server returns the first 50 rows; see the roster for the rest.</p>}
                </div>
              )}
              {outcome.hash && (
                <p className="border-t border-line-soft px-6 py-4 text-[12.5px] text-muted">
                  File fingerprint (SHA-256): <span className="font-mono break-all text-ink">{outcome.hash}</span>
                </p>
              )}
            </section>
          )}

          {(stage === 'checked' || stage === 'uploading') && file && (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-card px-4 py-3">
                <Icon name="file" className="text-primary-3" />
                <span className="font-mono text-[13px] text-ink">{file.name}</span>
                {result && <span className="text-[13px] text-muted">{inr(result.total)} rows</span>}
                <div className="ml-auto flex gap-2">
                  <Button size="sm" icon="upload" onClick={() => fileRef.current?.click()} disabled={stage === 'uploading'}>
                    Choose another file
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset} disabled={stage === 'uploading'}>
                    Start over
                  </Button>
                </div>
              </div>

              {!result && (
                <p className="mt-4 rounded-md bg-primary-tint/50 px-4 py-3 text-[13.5px] text-primary-3">
                  Excel files can’t be checked in the browser. Upload it and the server will check every row.
                </p>
              )}

              {result && (
                <>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-line-soft bg-card p-5">
                      <div className="text-[13px] text-muted">Rows checked</div>
                      <div className="mt-2 text-[30px] leading-9 font-semibold text-primary tnum">{inr(result.total)}</div>
                      <div className="text-[13px] text-muted">against {inst.courses.length} approved courses</div>
                    </div>
                    <div className="rounded-lg border border-line-soft bg-card p-5">
                      <div className="text-[13px] text-muted">Ready to upload</div>
                      <div className="mt-2 text-[30px] leading-9 font-semibold text-ok tnum">
                        {inr(result.validRows)} <span className="text-base text-muted">{pct(result.validRows, result.total)}%</span>
                      </div>
                      <Meter value={result.validRows} max={result.total} className="mt-2" />
                    </div>
                    <div className={cx('rounded-lg border bg-card p-5', hasErrors ? 'border-err/30' : 'border-line-soft')}>
                      <div className="text-[13px] text-muted">Errors to fix</div>
                      <div className={cx('mt-2 text-[30px] leading-9 font-semibold tnum', hasErrors ? 'text-err' : 'text-ink')}>{result.errorCount}</div>
                      <div className="text-[13px] text-muted">{hasErrors ? `in ${result.errorRows} rows · upload blocked` : 'None'}</div>
                    </div>
                    <div className="rounded-lg border border-line-soft bg-card p-5">
                      <div className="text-[13px] text-muted">Warnings</div>
                      <div className={cx('mt-2 text-[30px] leading-9 font-semibold tnum', result.warningCount ? 'text-warn' : 'text-ink')}>{result.warningCount}</div>
                      <div className="text-[13px] text-muted">Allowed, but worth checking</div>
                    </div>
                  </div>

                  {result.intake.length > 0 && (
                    <Panel className="mt-6" icon="scale" title="Seats after this upload" subtitle="Students already submitted plus this file, against sanctioned seats">
                      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                        {result.intake.map((c) => {
                          const total = c.existing + c.adding
                          const over = total > c.sanctioned
                          return (
                            <div key={c.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="font-medium text-ink">
                                  {c.name} <span className="text-[12.5px] font-normal text-muted">({c.level})</span>
                                </div>
                                {over ? <Badge tone="err">+{total - c.sanctioned} over</Badge> : <Badge tone="neutral">{c.sanctioned - total} seats left</Badge>}
                              </div>
                              <Meter value={total} max={c.sanctioned} className="mt-2.5" />
                              <div className="mt-1.5 flex justify-between text-[12.5px] text-muted tnum">
                                <span>
                                  {c.existing} already + <span className="text-ink">{c.adding} in file</span> = <span className={over ? 'font-semibold text-err' : 'text-ink'}>{total}</span> / {c.sanctioned}
                                </span>
                                <span>
                                  Supernumerary {c.superUsed} / {c.superAllowed}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Panel>
                  )}

                  <Panel
                    className="mt-6"
                    icon="alert"
                    title="Errors and warnings"
                    subtitle="Each issue shows the rule that raised it and how to fix it"
                    bodyClassName="p-0"
                    actions={
                      <>
                        <Segmented
                          value={tab}
                          onChange={(v) => { setTab(v); setPage(0) }}
                          options={[
                            { value: 'all', label: `All ${issues.length}` },
                            { value: 'error', label: `Errors ${result.errorCount}` },
                            { value: 'warning', label: `Warnings ${result.warningCount}` },
                          ]}
                        />
                        <div className="relative">
                          <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
                          <input className={cx(inputBase, 'h-8 w-48 pl-8 text-[13px]')} placeholder="Name, APAAR or row" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} aria-label="Search issues" />
                        </div>
                      </>
                    }
                  >
                    {issues.length === 0 ? (
                      <div className="flex flex-col items-center px-6 py-12 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-ok-bg text-ok">
                          <Icon name="checkCircle" size={24} />
                        </span>
                        <h3 className="mt-3 text-lg font-semibold">Every row passed</h3>
                        <p className="mt-1 max-w-md text-muted">Upload it now. The server will also check each student against every other institution.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-230 text-left text-[13.5px]">
                            <thead className="bg-surface-low text-[12.5px] text-muted">
                              <tr>
                                <th className="px-5 py-3 font-medium">Row</th>
                                <th className="px-3 py-3 font-medium">Student</th>
                                <th className="px-3 py-3 font-medium">APAAR ID</th>
                                <th className="px-3 py-3 font-medium">Issue</th>
                                <th className="px-3 py-3 font-medium">Severity</th>
                                <th className="px-5 py-3 font-medium">How to fix</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line-soft">
                              {shown.map((i) => (
                                <tr key={i.id}>
                                  <td className="px-5 py-3.5 align-top text-muted tnum">{i.row}</td>
                                  <td className="px-3 py-3.5 align-top">
                                    <div className="font-medium text-ink">{i.name}</div>
                                    <div className="text-[12.5px] text-muted">{i.course}</div>
                                  </td>
                                  <td className={cx('px-3 py-3.5 align-top font-mono text-[13px] whitespace-nowrap', i.field === 'apaar_id' ? 'text-err' : 'text-ink')}>
                                    {/^\d{12}$/.test(i.apaar ?? '') ? fmtApaar(i.apaar) : i.apaar || '—'}
                                  </td>
                                  <td className="px-3 py-3.5 align-top">
                                    <div className="font-medium text-ink">{i.title}</div>
                                    <div className="text-[12.5px] text-muted">{i.detail}</div>
                                  </td>
                                  <td className="px-3 py-3.5 align-top">
                                    <Severity level={i.severity} />
                                  </td>
                                  <td className="max-w-65 px-5 py-3.5 align-top text-[13px] text-muted">{i.fix}</td>
                                </tr>
                              ))}
                              {!shown.length && (
                                <tr>
                                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                                    No issues match these filters.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-line-soft px-5 py-3 text-[13px] text-muted">
                          <span>{filtered.length ? `${page * PAGE + 1}–${Math.min(filtered.length, (page + 1) * PAGE)} of ${filtered.length}` : '0 issues'}</span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" icon="chevronLeft" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" />
                            <span className="flex items-center px-2 tnum">
                              {page + 1} / {pages}
                            </span>
                            <Button size="sm" variant="ghost" icon="chevronRight" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page" />
                          </div>
                        </div>
                      </>
                    )}
                  </Panel>
                </>
              )}

              <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line-soft bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  {result && (
                    <Button icon="download" onClick={downloadReport} disabled={!issues.length}>
                      Download issue report
                    </Button>
                  )}
                  <span className={cx('flex-1 text-[13px]', hasErrors ? 'text-err' : 'text-ok')}>
                    {hasErrors
                      ? `Fix ${result.errorCount} errors before uploading.`
                      : result?.warningCount
                        ? `Ready to upload. ${result.warningCount} warnings will go to AICTE for review.`
                        : 'Ready to upload.'}
                  </span>
                  <Button variant="primary" icon="upload" disabled={hasErrors || stage === 'uploading'} onClick={upload}>
                    {stage === 'uploading' ? 'Uploading…' : 'Upload to AICTE'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Shell>
  )
}
