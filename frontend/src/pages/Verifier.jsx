import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Brand } from '../components/Shell.jsx'
import { CameraScanner, decodeQrFile } from '../components/QrScanner.jsx'
import { Avatar, Badge, Button, Segmented, inputBase, inputClass } from '../components/ui.jsx'
import { VERIFIER_ORGS } from '../data/consent.js'
import { shortCode, tamperToken } from '../lib/credential.js'
import { issueCredential, verifyApaar, verifyCredential } from '../api/index.js'
import Certificate from '../components/Certificate.jsx'
import { StatusTag } from '../components/Data.jsx'
import { apaar as fmtApaar } from '../lib/format.js'
import { GovFooter, GovStrip } from '../components/GovChrome.jsx'
import { usePrefs } from '../state/Prefs.jsx'
import { downloadText } from '../lib/csv.js'
import { Link } from '../lib/router.jsx'
import { cx, dateOnly, dateTime } from '../lib/format.js'
import { studentKey, useAppState } from '../state/AppState.jsx'

function Detail({ label, value, mono }) {
  return (
    <div className="rounded-md bg-surface-low px-4 py-3">
      <div className="text-[12.5px] text-muted">{label}</div>
      <div className={cx('mt-0.5 font-medium text-ink', mono && 'font-mono tnum')}>{value}</div>
    </div>
  )
}

function RecordCard({ p }) {
  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={p.n} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{p.n}</h3>
            <Badge tone={p.s === 'Active' ? 'ok' : 'neutral'} dot>
              {p.s} enrolment
            </Badge>
          </div>
          <div className="text-[13.5px] text-muted">{p.p}</div>
        </div>
        <div className="text-right">
          <div className="text-[12.5px] text-muted">APAAR ID</div>
          <div className="font-mono font-semibold tnum">{p.a}</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Detail label="Institution" value={p.i} />
        <Detail label="Enrolment number" value={p.b} mono />
        <Detail label="Academic year" value={p.y} mono />
      </div>
    </div>
  )
}

export default function Verifier({ params }) {
  const { consentFor, log } = useAppState()
  const { t } = usePrefs()
  const [mode, setMode] = useState(params.get('t') ? 'paste' : 'lookup')
  const [apaarInput, setApaarInput] = useState(params.get('apaar') ?? '')
  const [lookup, setLookup] = useState(null) // { record } | { error }
  const [cert, setCert] = useState(null)
  const [org, setOrg] = useState('infosys')
  const [code, setCode] = useState(params.get('t') ?? '')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [fileErr, setFileErr] = useState('')
  const resultRef = useRef(null)
  const startedRef = useRef(false)
  const orgName = VERIFIER_ORGS.find((o) => o.id === org)?.name

  const run = async (token, opts = {}) => {
    setBusy(true)
    const r = await verifyCredential(token)
    setBusy(false)
    if (r.status === 'malformed') {
      setResult(r)
      return
    }
    const key = studentKey(r.payload.pid, r.payload.b)
    const consent = consentFor(key, org)
    setResult({ ...r, consent, org: orgName })
    if (!opts.silent) {
      if (r.status === 'tampered') log(key, { kind: 'blocked', who: orgName, what: 'Presented an altered copy of your credential', result: 'Signature check failed' })
      else if (r.status === 'verified' && consent.state === 'active') log(key, { kind: 'verified', who: orgName, what: 'Verified your credential', result: 'Signature valid, consent active' })
      else if (r.status === 'verified') log(key, { kind: 'blocked', who: orgName, what: 'Tried to view your record', result: 'Details withheld: no active consent' })
    }
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const runLookup = async (id) => {
    setBusy(true)
    setLookup(null)
    try {
      setLookup({ record: await verifyApaar(id) })
    } catch (e) {
      setLookup({ error: e.message })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const t = params.get('t')
    if (startedRef.current) return
    startedRef.current = true // StrictMode runs effects twice in dev; log once
    if (t) {
      setCode(t)
      run(t)
    } else if (params.get('apaar')) {
      runLookup(params.get('apaar'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-evaluate consent if the verifying organisation changes.
  useEffect(() => {
    if (result && result.status !== 'malformed') run(code, { silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org])

  // Demo: issue a credential for the backend's seeded student, then verify it
  const loadDemo = async (tampered) => {
    setBusy(true)
    try {
      const credential = await issueCredential(await verifyApaar('778899001122'))
      const t = tampered ? tamperToken(credential.token) : credential.token
      setMode('paste')
      setCode(t)
      await run(t)
    } catch (e) {
      setResult({ status: 'malformed', reason: e.message })
    } finally {
      setBusy(false)
    }
  }

  const onImage = async (file) => {
    if (!file) return
    setFileErr('')
    const text = await decodeQrFile(file).catch(() => null)
    if (!text) {
      setFileErr('No QR code found in that image. Try a sharper, straight-on photo.')
      return
    }
    setCode(text)
    run(text)
  }

  const report = () => {
    const p = result.payload
    const lines = [
      'APAAR Setu verification report',
      `Checked: ${dateTime(result.checkedAt)}`,
      `Checked by: ${result.org}`,
      `Result: ${result.status === 'verified' ? 'Signature valid' : result.status}`,
      `Signing key: ${result.keyId}`,
      `Credential fingerprint (SHA-256): ${result.digest}`,
      '',
      `Student: ${p.n}`,
      `APAAR ID: ${p.a}`,
      `Institution: ${p.i}`,
      `Programme: ${p.p}`,
      `Enrolment number: ${p.b}`,
      `Enrolment status: ${p.s}`,
    ]
    downloadText(`verification-${p.cid}.txt`, lines.join('\n'), 'text/plain')
  }

  const showDetails = result?.status === 'verified' && result.consent?.state === 'active'

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <GovStrip />
      <header className="border-b border-line-soft bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-5 py-4">
          <Link to="/">
            <Brand subtitle="Credential verification" dark={false} />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="org" className="text-[13px] text-muted">
              {t('Verifying as')}
            </label>
            <select id="org" className={cx(inputBase, 'h-9')} value={org} onChange={(e) => setOrg(e.target.value)}>
              {VERIFIER_ORGS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 outline-none">
        <h1 className="text-[30px] leading-10 font-bold text-primary">{t('Verify a student')}</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Look up an APAAR ID in the live AICTE registry, or check the signed QR code a student shares with you. A signed
          code can’t be altered without failing the check, and the student decides which organisations see their details.
        </p>

        <section className="mt-6 rounded-lg border border-line-soft bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'lookup', label: 'Look up APAAR ID' },
                { value: 'paste', label: 'Paste code' },
                { value: 'camera', label: 'Scan with camera' },
                { value: 'image', label: 'Upload QR image' },
              ]}
            />
            <div className="flex items-center gap-1 text-[13px] text-muted">
              Demo:
              {mode === 'lookup' ? (
                <Button size="sm" variant="ghost" onClick={() => { setApaarInput('7788 9900 1122'); runLookup('778899001122') }} disabled={busy}>
                  Seeded student
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => loadDemo(false)} disabled={busy}>
                    Genuine credential
                  </Button>
                  <Button size="sm" variant="dangerGhost" onClick={() => loadDemo(true)} disabled={busy}>
                    Altered copy
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="p-5">
            {mode === 'lookup' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  runLookup(apaarInput)
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <label className="min-w-60 flex-1">
                  <span className="mb-1.5 block text-[13px] font-medium">Student’s 12-digit APAAR ID</span>
                  <input className={cx(inputClass, 'font-mono text-[15px] tracking-wider')} inputMode="numeric" value={apaarInput} onChange={(e) => setApaarInput(e.target.value)} placeholder="XXXX XXXX XXXX" />
                </label>
                <Button variant="primary" type="submit" icon="search" disabled={apaarInput.replace(/\D/g, '').length !== 12 || busy}>
                  {busy ? 'Checking…' : 'Check registry'}
                </Button>
                <p className="w-full text-[12.5px] text-muted">Checks the live AICTE registry. For tamper-proof verification of a student’s shared record, use their signed QR code.</p>
              </form>
            )}
            {mode === 'paste' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (code.trim()) run(code)
                }}
              >
                <label htmlFor="code" className="mb-1.5 block text-[13px] font-medium">
                  Credential code
                </label>
                <textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste the code shared by the student. It starts with AS1."
                  className={cx(inputClass, 'h-28 py-2 font-mono text-[12.5px] break-all')}
                />
                <div className="mt-3 flex justify-end">
                  <Button variant="primary" type="submit" icon="shieldCheck" disabled={!code.trim() || busy}>
                    {busy ? 'Checking…' : 'Verify'}
                  </Button>
                </div>
              </form>
            )}
            {mode === 'camera' && <CameraScanner onResult={(t) => { setCode(t); run(t) }} />}
            {mode === 'image' && (
              <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-line px-6 py-12 text-center hover:border-primary-3">
                <Icon name="image" size={28} className="text-primary-3" />
                <span className="mt-3 font-medium">Choose a photo or screenshot of the QR code</span>
                <span className="mt-1 text-[13px] text-muted">PNG or JPG. The image never leaves this device.</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = '' }} />
                {fileErr && <span className="mt-3 text-[13px] text-err">{fileErr}</span>}
              </label>
            )}
          </div>
        </section>

        {mode === 'lookup' && lookup?.error && (
          <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-err/30 bg-err-bg/40 px-5 py-4 text-err">
            <Icon name="xCircle" className="mt-0.5" />
            <div>
              <div className="font-semibold">Not found in the registry</div>
              <div className="text-[13.5px]">{lookup.error}</div>
            </div>
          </div>
        )}
        {mode === 'lookup' && lookup?.record && (
          <section className={cx('mt-6 overflow-hidden rounded-lg border bg-card', lookup.record.is_valid ? 'border-ok/40' : 'border-warn/50')} aria-live="polite">
            <div className={cx('flex flex-wrap items-start gap-4 px-6 py-5', lookup.record.is_valid ? 'bg-ok-bg/50' : 'bg-warn-bg/50')}>
              <span className={cx('flex size-12 items-center justify-center rounded-md text-white', lookup.record.is_valid ? 'bg-ok' : 'bg-warn')}>
                <Icon name={lookup.record.is_valid ? 'shieldCheck' : 'alert'} size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={cx('text-2xl font-bold', lookup.record.is_valid ? 'text-ok' : 'text-warn')}>
                  {lookup.record.is_valid ? 'Registered and verified' : 'Registered, but under review'}
                </h2>
                <p className="mt-1 text-[14px] text-ink">
                  {lookup.record.is_valid ? 'This APAAR ID is enrolled at an AICTE-approved institution and passed every check.' : lookup.record.validation_remarks}
                </p>
              </div>
              {!lookup.record.is_valid && <StatusTag status={lookup.record.verification_status} long />}
            </div>
            <div className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={lookup.record.student_name} size={52} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold">{lookup.record.student_name}</h3>
                  <div className="text-[13.5px] text-muted">
                    {lookup.record.department} · {lookup.record.level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12.5px] text-muted">APAAR ID</div>
                  <div className="font-mono font-semibold tnum">{fmtApaar(lookup.record.apaar_id)}</div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Detail label="Institution" value={`${lookup.record.college_name} (${lookup.record.aicte_id})`} />
                <Detail label="Enrolment number" value={lookup.record.enrollment_no} mono />
                <Detail label="Academic year" value={lookup.record.admission_year} mono />
              </div>
              {lookup.record.digital_signature_hash && (
                <p className="mt-4 text-[12.5px] text-muted">
                  Registry fingerprint <span className="font-mono text-ink">{lookup.record.digital_signature_hash.slice(0, 24)}…</span>
                  {lookup.record.verified_at && <> · recorded {lookup.record.verified_at}</>}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line-soft px-6 py-4">
              <Button icon="file" onClick={() => setCert(lookup.record)}>
                Certificate specimen
              </Button>
            </div>
          </section>
        )}

        <div ref={resultRef} className={cx('scroll-mt-6', mode === 'lookup' && 'hidden')}>
          {result?.status === 'malformed' && (
            <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-err/30 bg-err-bg/40 px-5 py-4 text-err">
              <Icon name="xCircle" className="mt-0.5" />
              <div>
                <div className="font-semibold">Couldn’t read this code</div>
                <div className="text-[13.5px]">{result.reason} Ask the student to share their credential again.</div>
              </div>
            </div>
          )}

          {result?.status === 'tampered' && (
            <section className="mt-6 overflow-hidden rounded-lg border border-err/40 bg-card" aria-live="polite">
              <div className="flex flex-wrap items-start gap-4 bg-err-bg/60 px-6 py-5">
                <span className="flex size-12 items-center justify-center rounded-md bg-err text-white">
                  <Icon name="shieldX" size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-err">Record has been altered</h2>
                  <p className="mt-1 max-w-xl text-[14px] text-ink">
                    The details in this code don’t match AICTE’s signature. Someone changed the record after it was
                    issued. Don’t rely on it.
                  </p>
                </div>
              </div>
              <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
                <div>
                  <h3 className="text-[15px] font-semibold">What the altered code claims</h3>
                  <dl className="mt-2 space-y-1.5 text-[13.5px]">
                    <div className="flex gap-2"><dt className="w-24 text-muted">Name</dt><dd>{result.payload.n}</dd></div>
                    <div className="flex gap-2"><dt className="w-24 text-muted">Programme</dt><dd className="text-err line-through decoration-err/60">{result.payload.p}</dd></div>
                    <div className="flex gap-2"><dt className="w-24 text-muted">Status</dt><dd className="text-err line-through decoration-err/60">{result.payload.s}</dd></div>
                  </dl>
                  <p className="mt-3 font-mono text-[12px] text-muted">Fingerprint {shortCode(result.digest)} · checked {dateTime(result.checkedAt)}</p>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold">What to do</h3>
                  <ul className="mt-2 space-y-2 text-[13.5px]">
                    <li className="flex gap-2"><Icon name="ban" size={16} className="mt-0.5 text-err" /> Don’t use this record for hiring or admission decisions.</li>
                    <li className="flex gap-2"><Icon name="refresh" size={16} className="mt-0.5 text-primary-3" /> Ask the student to share a fresh code from their APAAR Setu profile.</li>
                    <li className="flex gap-2"><Icon name="alert" size={16} className="mt-0.5 text-warn" /> This attempt has been logged and the student has been notified.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {result?.status === 'expired' && (
            <div role="alert" className="mt-6 flex gap-3 rounded-lg border border-warn/30 bg-warn-bg/60 px-5 py-4 text-warn">
              <Icon name="clock" className="mt-0.5" />
              <div>
                <div className="font-semibold">This credential has expired</div>
                <div className="text-[13.5px] text-ink">
                  It was genuine, but expired on {dateOnly(result.payload.exp)}. Ask the student for a current code.
                </div>
              </div>
            </div>
          )}

          {result?.status === 'verified' && (
            <section className={cx('mt-6 overflow-hidden rounded-lg border bg-card', showDetails ? 'border-ok/40' : 'border-warn/40')} aria-live="polite">
              <div className={cx('flex flex-wrap items-start gap-4 px-6 py-5', showDetails ? 'bg-ok-bg/50' : 'bg-warn-bg/50')}>
                <span className={cx('flex size-12 items-center justify-center rounded-md text-white', showDetails ? 'bg-ok' : 'bg-warn')}>
                  <Icon name={showDetails ? 'shieldCheck' : 'lock'} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className={cx('text-2xl font-bold', showDetails ? 'text-ok' : 'text-warn')}>
                    {showDetails ? 'Verified' : 'Genuine, but not shared with you'}
                  </h2>
                  <p className="mt-1 text-[14px] text-ink">
                    {showDetails
                      ? 'Signed by AICTE and unchanged since it was issued.'
                      : result.consent.state === 'revoked'
                        ? `${result.payload.n} revoked ${result.org}’s access on ${dateOnly(result.consent.grant.revokedOn)}. Details are hidden.`
                        : `The signature is valid, but ${result.payload.n} hasn’t given ${result.org} access to their details.`}
                  </p>
                </div>
                <div className="rounded-md bg-card/80 px-4 py-2.5 text-[12.5px]">
                  <div className="text-muted">Signing key</div>
                  <div className="font-mono font-semibold">{result.keyId}</div>
                  <div className="mt-1 text-muted">Fingerprint <span className="font-mono text-ink">{shortCode(result.digest)}</span></div>
                </div>
              </div>

              {showDetails ? (
                <>
                  <RecordCard p={result.payload} />
                  <div className="mx-6 mb-5 flex flex-wrap items-center gap-2 rounded-md bg-primary-tint/50 px-4 py-3 text-[13px] text-primary-3">
                    <Icon name="key" size={16} />
                    Shared with {result.org} by the student for “{result.consent.grant.purpose}” until {dateOnly(result.consent.grant.expires)}.
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-6 py-4">
                    <Button variant="primary" icon="download" onClick={report}>
                      Download verification report
                    </Button>
                    <span className="ml-auto text-[12.5px] text-muted">Checked {dateTime(result.checkedAt)}</span>
                  </div>
                </>
              ) : (
                <div className="px-6 py-5 text-[13.5px] text-muted">
                  Ask the student to open <span className="font-medium text-ink">My record &amp; consent</span> in APAAR Setu and grant access to {result.org}. Then verify again.
                </div>
              )}
            </section>
          )}
        </div>

        <section className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft md:grid-cols-3">
          {[
            ['shieldCheck', 'Works offline', 'Checking the signature needs only AICTE’s public key, so it works even without a connection to the registry.'],
            ['eye', 'Privacy by default', 'The code never contains the full APAAR ID or Aadhaar details. Only the last 4 digits are shown.'],
            ['key', 'Student-controlled', 'Under the DPDP Act 2023, details are shown only to organisations the student has approved.'],
          ].map(([icon, t, d]) => (
            <div key={t} className="bg-card p-5">
              <Icon name={icon} className="text-primary-3" />
              <div className="mt-2 font-semibold">{t}</div>
              <p className="mt-1 text-[13px] leading-5 text-muted">{d}</p>
            </div>
          ))}
        </section>
      </main>
      <GovFooter />
      <Certificate s={cert} onClose={() => setCert(null)} />
    </div>
  )
}
