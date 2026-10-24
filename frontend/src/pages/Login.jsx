import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { LogoMark } from '../components/Shell.jsx'
import { GovFooter, GovStrip } from '../components/GovChrome.jsx'
import { Button, Field, Segmented, inputClass } from '../components/ui.jsx'
import { getInstitution, regulatorSignIn, searchInstitutions, verifyApaar, verifyInstitutionOtp, verifyInstitutionPassword } from '../api/index.js'
import { Link, navigate } from '../lib/router.jsx'
import { cx } from '../lib/format.js'
import { HOME, accountFromToken, useSession } from '../state/Session.jsx'

function ErrorLine({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-3 flex gap-2 rounded-md bg-err-bg/60 px-3 py-2 text-[13.5px] text-err">
      <Icon name="alert" size={16} className="mt-0.5" /> {children}
    </p>
  )
}

function StepDots({ step }) {
  const steps = ['Find your institution', 'Password', 'One-time code']
  return (
    <ol className="mb-5 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
      {steps.map((s, i) => (
        <li key={s} className={cx('flex items-center gap-2', i === step ? 'font-semibold text-ink' : i < step ? 'text-ok' : 'text-subtle')}>
          <span className={cx('flex size-5 items-center justify-center rounded-full text-[11px] font-bold', i === step ? 'bg-primary-2 text-white' : i < step ? 'bg-ok text-white' : 'bg-surface-mid text-muted')}>
            {i < step ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
          </span>
          {s}
        </li>
      ))}
    </ol>
  )
}

function InstitutionSignIn({ preselect, onDone }) {
  const [step, setStep] = useState(0)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [college, setCollege] = useState(null)
  const [password, setPassword] = useState('')
  const [otpInfo, setOtpInfo] = useState(null)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(0)

  useEffect(() => {
    if (!preselect) return
    getInstitution(preselect)
      .then((c) => {
        setCollege({ aicte_id: c.aicte_id, name: c.name, district: c.district, state: c.state })
        setStep(1)
      })
      .catch(() => {})
  }, [preselect])

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    timer.current = setTimeout(() => {
      searchInstitutions(q.trim())
        .then(setResults)
        .catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(timer.current)
  }, [q])

  const submitPassword = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await verifyInstitutionPassword(college.aicte_id, password)
      setOtpInfo(r)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submitOtp = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await verifyInstitutionOtp(college.aicte_id, otp.trim(), otpInfo.session_token)
      onDone(accountFromToken(r))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div>
      <StepDots step={step} />
      {step === 0 && (
        <div>
          <Field label="Institution name or AICTE ID" hint="Start typing, for example “government” or “college”.">
            <div className="relative">
              <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
              <input autoFocus className={cx(inputClass, 'pl-9')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the AICTE registry" />
            </div>
          </Field>
          {results.length > 0 && (
            <ul className="mt-3 max-h-80 divide-y divide-line-soft overflow-auto rounded-md border border-line-soft">
              {results.map((r) => (
                <li key={r.aicte_id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCollege(r)
                      setStep(1)
                      setError('')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-low"
                  >
                    <Icon name="building" size={18} className="text-primary-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{r.name}</span>
                      <span className="block text-[12.5px] text-muted">
                        {r.aicte_id} · {r.district}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} className="text-subtle" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {q.trim().length >= 2 && results.length === 0 && <p className="mt-3 text-[13.5px] text-muted">No institutions match “{q}”.</p>}
        </div>
      )}

      {step >= 1 && college && (
        <div className="mb-4 flex items-start gap-3 rounded-md bg-surface-low px-4 py-3">
          <Icon name="building" size={18} className="mt-0.5 text-primary-3" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{college.name}</div>
            <div className="text-[12.5px] text-muted">
              AICTE ID {college.aicte_id} · {college.district}
            </div>
          </div>
          <button type="button" className="text-[13px] font-medium text-primary-2 underline underline-offset-4" onClick={() => { setStep(0); setOtpInfo(null); setOtp(''); setError('') }}>
            Change
          </button>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={submitPassword}>
          <Field label="Institution password" hint="Demo password for every institution: aicte@123">
            <input autoFocus type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <ErrorLine>{error}</ErrorLine>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" type="submit" iconRight="arrowRight" disabled={!password || busy}>
              {busy ? 'Checking…' : 'Continue'}
            </Button>
          </div>
        </form>
      )}

      {step === 2 && otpInfo && (
        <form onSubmit={submitOtp}>
          <p className="mb-4 text-[13.5px] text-ink">{otpInfo.message}.</p>
          <Field label="6-digit code">
            <input autoFocus inputMode="numeric" maxLength={6} className={cx(inputClass, 'font-mono text-lg tracking-[0.3em]')} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-saffron-2/50 bg-saffron-bg/40 px-3 py-2 text-[13px]">
            <Icon name="info" size={15} className="text-saffron" />
            <span className="flex-1">Demo: the server returned the code it “sent”.</span>
            <Button size="sm" onClick={() => setOtp(otpInfo.simulated_otp)}>
              Fill code {otpInfo.simulated_otp}
            </Button>
          </div>
          <ErrorLine>{error}</ErrorLine>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" type="submit" icon="lock" disabled={otp.length !== 6 || busy}>
              {busy ? 'Verifying…' : 'Verify and sign in'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function AicteSignIn({ onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const go = async () => {
    setBusy(true)
    setError('')
    try {
      onDone(accountFromToken(await regulatorSignIn()))
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }
  return (
    <div>
      <div className="flex items-start gap-3 rounded-md bg-surface-low px-4 py-4">
        <span className="flex size-10 items-center justify-center rounded-md bg-primary-tint text-primary-3">
          <Icon name="shieldCheck" />
        </span>
        <div>
          <div className="font-semibold text-ink">AICTE Central Regulatory & Vigilance Bureau</div>
          <p className="mt-0.5 text-[13.5px] text-muted">
            Sees every institution’s data, flagged records and the audit trail, and can approve records after review.
          </p>
        </div>
      </div>
      <p className="mt-4 text-[13px] text-muted">Demo: officials sign in with one click. Production would use AICTE single sign-on.</p>
      <ErrorLine>{error}</ErrorLine>
      <div className="mt-5 flex justify-end">
        <Button variant="primary" iconRight="arrowRight" onClick={go} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in as AICTE official'}
        </Button>
      </div>
    </div>
  )
}

function StudentSignIn({ onDone }) {
  const [apaar, setApaar] = useState('')
  const [record, setRecord] = useState(null)
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const lookup = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      setRecord(await verifyApaar(apaar))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const finish = (e) => {
    e.preventDefault()
    if (otp !== '123456') {
      setError('That code doesn’t match. Demo code: 123456')
      return
    }
    onDone({ role: 'student', name: record.student_name, title: 'Student', org: record.college_name, apaarId: record.apaar_id })
  }

  if (!record) {
    return (
      <form onSubmit={lookup}>
        <Field label="Your 12-digit APAAR ID" hint="Demo student: 7788 9900 1122">
          <input autoFocus inputMode="numeric" className={cx(inputClass, 'font-mono tracking-wider')} value={apaar} onChange={(e) => setApaar(e.target.value)} placeholder="XXXX XXXX XXXX" />
        </Field>
        <ErrorLine>{error}</ErrorLine>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" type="submit" iconRight="arrowRight" disabled={apaar.replace(/\D/g, '').length !== 12 || busy}>
            {busy ? 'Looking up…' : 'Continue'}
          </Button>
        </div>
      </form>
    )
  }
  return (
    <form onSubmit={finish}>
      <p className="mb-4 text-[13.5px] text-ink">
        We sent a code to the mobile number linked to APAAR ID ending <span className="font-mono">{record.apaar_id.slice(-4)}</span>.
      </p>
      <Field label="6-digit code" hint="Demo code: 123456">
        <input autoFocus inputMode="numeric" maxLength={6} className={cx(inputClass, 'font-mono text-lg tracking-[0.3em]')} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <ErrorLine>{error}</ErrorLine>
      <div className="mt-5 flex justify-between">
        <Button variant="ghost" onClick={() => { setRecord(null); setOtp('') }}>
          Use a different ID
        </Button>
        <Button variant="primary" type="submit" icon="lock" disabled={otp.length !== 6}>
          Verify and sign in
        </Button>
      </div>
    </form>
  )
}

export default function Login({ params }) {
  const { signIn } = useSession()
  const [tab, setTab] = useState(['institution', 'aicte', 'student'].includes(params.get('as')) ? params.get('as') : 'institution')
  const next = params.get('next')

  const done = (account) => {
    signIn(account)
    const home = HOME[account.role]
    navigate(next && next.startsWith(home) ? next : home)
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <GovStrip />
      <header className="border-b border-line-soft bg-card">
        <div className="mx-auto flex max-w-350 items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="APAAR Setu home">
            <LogoMark size={44} />
            <div className="leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[20px] font-bold text-primary">APAAR Setu</span>
                <span lang="hi" className="text-[15px] font-semibold text-primary-3">
                  अपार सेतु
                </span>
              </div>
              <div className="text-[13px] text-muted">Student data and verification platform</div>
            </div>
          </Link>
        </div>
      </header>
      <div className="h-1.5 bg-primary-2" />

      <main id="main" tabIndex={-1} className="mx-auto grid w-full max-w-350 flex-1 gap-10 px-4 py-10 outline-none sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="max-w-xl lg:col-span-5">
          <h1 className="text-[30px] leading-10 font-bold text-primary">Sign in</h1>
          <p className="mt-3 text-[15.5px] leading-6 text-ink">
            Institution nodal officers manage their own students. AICTE officials see every institution. Students see
            their own record and decide who can verify it.
          </p>
          <ul className="mt-6 space-y-2.5 text-[14px]">
            {[
              'Institutions sign in with a password and a one-time code sent to the nodal officer.',
              'A college only ever sees its own students.',
              'Every sign-in and change is written to the audit trail.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Icon name="checkCircle" size={17} className="mt-0.5 text-ok" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-line-soft pt-5 text-[14px]">
            <div className="font-semibold">Employer or verifier?</div>
            <p className="mt-1 text-muted">Checking a student’s record doesn’t need an account.</p>
            <Link to="/verify" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary-2 underline underline-offset-4">
              Verify a student <Icon name="chevronRight" size={15} />
            </Link>
          </div>
        </section>

        <section className="self-start rounded-lg border border-line-soft bg-card lg:col-span-7">
          <div className="border-b border-line-soft px-5 py-3">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'institution', label: 'Institution' },
                { value: 'aicte', label: 'AICTE official' },
                { value: 'student', label: 'Student' },
              ]}
            />
          </div>
          <div className="p-5 sm:p-6">
            {tab === 'institution' && <InstitutionSignIn preselect={params.get('college')} onDone={done} />}
            {tab === 'aicte' && <AicteSignIn onDone={done} />}
            {tab === 'student' && <StudentSignIn onDone={done} />}
          </div>
        </section>
      </main>
      <GovFooter />
    </div>
  )
}
