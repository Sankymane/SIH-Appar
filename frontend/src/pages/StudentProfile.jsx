import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Shell from '../components/Shell.jsx'
import Icon from '../components/Icon.jsx'
import { Avatar, Badge, Button, Field, Modal, Panel, Toast, inputClass } from '../components/ui.jsx'
import { VERIFIER_ORGS, statusInfo } from '../data/consent.js'
import { issueCredential, verifyApaar } from '../api/index.js'
import { ErrorState, Loading, StatusTag, useApi } from '../components/Data.jsx'
import Certificate from '../components/Certificate.jsx'
import { navFor } from '../components/nav.js'
import { shortCode } from '../lib/credential.js'
import { downloadText } from '../lib/csv.js'
import { apaar, cx, dateOnly, dateTime } from '../lib/format.js'
import { Link } from '../lib/router.jsx'
import { studentKey, useAppState } from '../state/AppState.jsx'


const SCOPES = ['Enrolment status', 'Programme & batch', 'Academic credits']

const ACTIVITY_ICON = {
  verified: { icon: 'shieldCheck', tone: 'text-ok bg-ok-bg' },
  shared: { icon: 'link', tone: 'text-primary-3 bg-primary-tint' },
  statutory: { icon: 'building', tone: 'text-primary-3 bg-primary-tint' },
  blocked: { icon: 'ban', tone: 'text-err bg-err-bg' },
  revoked: { icon: 'x', tone: 'text-muted bg-surface-mid' },
  issued: { icon: 'refresh', tone: 'text-saffron bg-saffron-bg' },
}

function daysLeft(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000)
}

export default function StudentProfile({ account, path }) {
  const { data: record, error, reload } = useApi(() => verifyApaar(account.apaarId), [account.apaarId])
  const shell = {
    subtitle: 'Student portal',
    context: 'Your academic record, linked to your APAAR ID',
    nav: navFor('student', path),
    user: { name: account.name, role: 'Student' },
    crumbs: ['Student portal', 'My record & consent'],
  }
  if (!record) {
    return (
      <Shell {...shell}>
        <ErrorState error={error} onRetry={reload} />
        {!error && <Loading>Loading your record…</Loading>}
      </Shell>
    )
  }
  return <StudentView shell={shell} record={record} />
}

function StudentView({ shell, record }) {
  const key = studentKey(record.aicte_id, record.enrollment_no)
  const store = useAppState()
  const { grants, activity } = store.get(key)
  const revokeGrant = (id) => store.revokeGrant(key, id)
  const addGrant = (g) => store.addGrant(key, g)
  const [credential, setCredential] = useState(null)
  const [cert, setCert] = useState(false)
  const verified = record.is_valid

  useEffect(() => {
    if (verified) issueCredential(record).then(setCredential)
  }, [record, verified])

  const regenerate = async () => {
    setCredential(await issueCredential(record))
    store.log(key, { kind: 'issued', who: 'AICTE credential service', what: 'Issued a new signed credential', result: 'Previous QR still verifies until it expires' })
  }
  const [toast, setToast] = useState('')
  const [grantOpen, setGrantOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState({ orgId: 'wipro', purpose: 'Pre-joining background verification', scope: ['Enrolment status'], days: 30 })
  const qrRef = useRef(null)

  const flash = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2400)
  }

  const active = grants.filter((g) => g.status !== 'revoked')
  const revoked = grants.filter((g) => g.status === 'revoked')
  const confirmGrant = grants.find((g) => g.id === confirmId)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(credential.token)
      flash('Credential code copied')
    } catch {
      flash('Copy blocked by the browser. Select the code in the verifier instead.')
    }
  }

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const xml = new XMLSerializer().serializeToString(svg)
    downloadText(`apaar-setu-credential-${shortCode(credential.digest)}.svg`, xml, 'image/svg+xml')
  }

  const submitGrant = (e) => {
    e.preventDefault()
    const org = VERIFIER_ORGS.find((o) => o.id === form.orgId)
    addGrant({ orgId: org.id, org: org.name, purpose: form.purpose.trim() || 'Verification', scope: form.scope, days: Number(form.days) })
    setGrantOpen(false)
    flash(`${org.name} can now verify your record`)
  }

  return (
    <Shell
      {...shell}
      topExtra={
        <Badge tone="ok" className="hidden sm:inline-flex">
          <Icon name="check" size={13} strokeWidth={2.4} /> DigiLocker linked
        </Badge>
      }
    >
      <section className="flex flex-wrap gap-6 rounded-lg border border-line-soft bg-card p-6">
        <Avatar name={record.student_name} size={88} className="rounded-lg" />
        <div className="min-w-65 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[30px] leading-9 font-bold text-primary">{record.student_name}</h1>
            {verified ? (
              <Badge tone="ok" dot>
                Verified record
              </Badge>
            ) : (
              <Badge tone="warn" dot>
                {statusInfo(record.verification_status).label}
              </Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-muted">APAAR ID</span>
            <span className="rounded-md bg-surface-low px-3 py-1 font-mono text-lg font-semibold tracking-wide text-ink tnum">{apaar(record.apaar_id)}</span>
          </div>
          <p className="mt-3 text-[14.5px] text-ink">{record.college_name}</p>
          <p className="text-[14px] text-muted">
            {record.department} ({record.level}) · {record.program} · Academic year {record.admission_year}
          </p>
        </div>
        <dl className="grid min-w-60 grid-cols-2 gap-x-6 gap-y-3 self-start rounded-md bg-surface-low p-4 text-[13px] sm:grid-cols-1">
          <div>
            <dt className="text-muted">Enrolment number</dt>
            <dd className="font-mono font-semibold">{record.enrollment_no}</dd>
          </div>
          <div>
            <dt className="text-muted">Institution AICTE ID</dt>
            <dd className="font-mono font-semibold">{record.aicte_id}</dd>
          </div>
          <div>
            <dt className="text-muted">Certificate</dt>
            <dd>
              <button type="button" onClick={() => setCert(true)} className="font-semibold text-primary-2 underline underline-offset-4">
                View specimen with APAAR ID
              </button>
            </dd>
          </div>
        </dl>
      </section>

      {!verified && (
        <div role="status" className="mt-6 flex gap-3 rounded-lg border border-warn/40 bg-warn-bg/50 px-5 py-4">
          <Icon name="alert" className="mt-0.5 text-warn" />
          <div>
            <div className="font-semibold text-ink">
              Your record is under review: <StatusTag status={record.verification_status} long />
            </div>
            <p className="mt-1 text-[14px] text-ink">
              {record.verification_status === 'CROSS_INSTITUTION_DUPLICATE'
                ? 'Your APAAR ID is also enrolled at another institution. Contact your institution’s admissions office.'
                : record.validation_remarks}{' '}
              A signed credential will be issued once AICTE verifies the record.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-5" icon="qr" title="Your verified credential" subtitle="Signed by AICTE. Show this QR to an employer.">
          {credential ? (
            <>
              <div ref={qrRef} className="mx-auto w-fit rounded-lg border border-line-soft bg-white p-4">
                <QRCodeSVG value={credential.token} size={232} level="M" fgColor="#061445" bgColor="#ffffff" marginSize={0} title="Credential QR code" />
              </div>
              <div className="mt-3 text-center font-mono text-[13px] text-muted">
                Code <span className="font-semibold text-ink">{shortCode(credential.digest)}</span>
              </div>
              <dl className="mt-5 space-y-2 border-t border-line-soft pt-4 text-[13.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Issued</dt>
                  <dd className="font-medium">{dateTime(credential.payload.iat)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Valid until</dt>
                  <dd className="font-medium">{dateOnly(credential.payload.exp)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">APAAR ID in QR</dt>
                  <dd className="font-mono">{credential.payload.a}</dd>
                </div>
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="primary" icon="download" onClick={downloadQr}>
                  Download QR
                </Button>
                <Button icon="copy" onClick={copyCode}>
                  Copy code
                </Button>
                <Link
                  to={`/verify?t=${encodeURIComponent(credential.token)}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-card px-4 text-sm font-medium hover:bg-surface-low"
                >
                  <Icon name="eye" size={17} /> Preview as employer
                </Link>
                <Button icon="refresh" onClick={() => regenerate().then(() => flash('New credential issued'))}>
                  Issue new QR
                </Button>
              </div>
              <p className="mt-4 flex gap-2 rounded-md bg-primary-tint/50 p-3 text-[12.5px] leading-5 text-primary-3">
                <Icon name="info" size={16} className="mt-0.5" />
                The QR never contains your full APAAR ID or Aadhaar number. Employers only see your details if you’ve
                granted them access.
              </p>
            </>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center px-6 text-center text-muted">
              {verified ? (
                'Issuing your credential…'
              ) : (
                <>
                  <Icon name="lock" size={28} className="text-subtle" />
                  <p className="mt-3">No credential while your record is under review.</p>
                </>
              )}
            </div>
          )}
        </Panel>

        <Panel
          className="lg:col-span-7"
          icon="key"
          title="Who can see my record"
          subtitle={`${active.length} organisations have access`}
          actions={
            <Button variant="saffron" icon="plus" onClick={() => setGrantOpen(true)}>
              Grant access
            </Button>
          }
        >
          <ul className="space-y-3">
            {active.map((g) => {
              const left = g.expires ? daysLeft(g.expires) : null
              return (
                <li key={g.id} className="rounded-md border border-line-soft p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-mid text-primary-3">
                      <Icon name="building" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">{g.org}</span>
                        {g.status === 'statutory' ? (
                          <Badge tone="info">Required by law</Badge>
                        ) : (
                          <Badge tone={left <= 7 ? 'warn' : 'ok'} dot>
                            {left > 0 ? `${left} days left` : 'Expires today'}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-[13.5px] text-muted">{g.purpose}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {g.scope.map((s) => (
                          <span key={s} className="rounded-sm bg-surface-low px-2 py-0.5 text-[12px] text-muted">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[12.5px] text-muted">
                        {g.expires ? `Expires ${dateOnly(g.expires)}` : 'No expiry: statutory monitoring of approved institutions'}
                      </div>
                    </div>
                    {g.status === 'statutory' ? (
                      <Icon name="lock" size={17} className="mt-1 text-subtle" title="Can’t be revoked" />
                    ) : (
                      <Button size="sm" variant="dangerGhost" onClick={() => setConfirmId(g.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {revoked.length > 0 && (
            <div className="mt-5 border-t border-line-soft pt-4">
              <div className="text-[13px] font-medium text-muted">Revoked</div>
              <ul className="mt-2 space-y-1.5">
                {revoked.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
                    <span className="text-muted line-through">{g.org}</span>
                    <span className="text-[12.5px] text-err">Revoked {dateOnly(g.revokedOn)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7" icon="clock" title="Access log" subtitle="Every view, verification and change to your consent" bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {activity.map((a) => {
              const ic = ACTIVITY_ICON[a.kind] ?? ACTIVITY_ICON.shared
              return (
                <li key={a.id} className={cx('flex gap-3 px-5 py-3.5', a.kind === 'blocked' && 'bg-err-bg/25')}>
                  <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-md', ic.tone)}>
                    <Icon name={ic.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium text-ink">
                        {a.who} <span className="font-normal text-muted">· {a.what}</span>
                      </span>
                      <span className="text-[12.5px] whitespace-nowrap text-muted">{dateTime(a.at)}</span>
                    </div>
                    <div className={cx('text-[13px]', a.kind === 'blocked' ? 'text-err' : 'text-muted')}>{a.result}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel className="lg:col-span-5" icon="shield" title="How your data is protected">
          <p className="text-[14px] leading-6 text-ink">
            Under India’s Digital Personal Data Protection Act, 2023, organisations need your consent, for a stated
            purpose, before they can see your academic record.
          </p>
          <ul className="mt-4 space-y-3 text-[13.5px]">
            {[
              'You can revoke access at any time. It takes effect immediately.',
              'Every access attempt is logged here, including blocked ones.',
              'AICTE’s access is statutory: it monitors approved intake and can’t be revoked.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Icon name="checkCircle" size={17} className="mt-0.5 text-ok" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Modal
        open={grantOpen}
        title="Grant access to your record"
        onClose={() => setGrantOpen(false)}
        footer={
          <>
            <Button onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="grant-form" disabled={!form.scope.length}>
              Grant access
            </Button>
          </>
        }
      >
        <form id="grant-form" onSubmit={submitGrant} className="space-y-4">
          <Field label="Organisation">
            <select className={inputClass} value={form.orgId} onChange={(e) => setForm({ ...form, orgId: e.target.value })}>
              {VERIFIER_ORGS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purpose" hint="Shown to you in the access log and to the organisation.">
            <input className={inputClass} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium">What they can see</legend>
            <div className="space-y-2">
              {SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-[14px]">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#1e2a5a]"
                    checked={form.scope.includes(s)}
                    onChange={(e) =>
                      setForm({ ...form, scope: e.target.checked ? [...form.scope, s] : form.scope.filter((x) => x !== s) })
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="For how long">
            <select className={inputClass} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!confirmGrant}
        title={confirmGrant ? `Revoke ${confirmGrant.org}’s access?` : ''}
        onClose={() => setConfirmId(null)}
        footer={
          <>
            <Button onClick={() => setConfirmId(null)}>Keep access</Button>
            <Button
              variant="danger"
              onClick={() => {
                revokeGrant(confirmId)
                flash(`${confirmGrant.org} can no longer see your details`)
                setConfirmId(null)
              }}
            >
              Revoke access
            </Button>
          </>
        }
      >
        <p className="text-[14px] text-ink">
          They’ll no longer see your details when they scan your QR. They can still confirm the QR is genuine, but not
          what it says.
        </p>
      </Modal>

      {cert && <Certificate s={record} onClose={() => setCert(false)} />}
      <Toast message={toast} />
    </Shell>
  )
}
