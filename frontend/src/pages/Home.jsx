import Icon from '../components/Icon.jsx'
import { Brand } from '../components/Shell.jsx'
import { GovFooter, GovStrip } from '../components/GovChrome.jsx'
import { useApi } from '../components/Data.jsx'
import { getAnalytics, listInstitutions } from '../api/index.js'
import { Link } from '../lib/router.jsx'
import { inr } from '../lib/format.js'
import { HOME, useSession } from '../state/Session.jsx'

const PORTALS = [
  {
    to: '/login?as=institution',
    icon: 'upload',
    who: 'Institution nodal officers',
    title: 'Submit student data',
    does: 'Sign in with your institution’s password and a one-time code, check your admissions file, and upload it.',
  },
  {
    to: '/login?as=aicte',
    icon: 'dashboard',
    who: 'AICTE officials',
    title: 'National oversight',
    does: 'Flagged records across every institution, intake by course, the audit trail, and regulatory reports.',
  },
  {
    to: '/login?as=student',
    icon: 'user',
    who: 'Students',
    title: 'My record & consent',
    does: 'See your registry record, get a signed QR credential, and choose who can verify it.',
  },
  {
    to: '/verify',
    icon: 'qr',
    who: 'Employers and verifiers',
    title: 'Verify a student',
    does: 'Look up an APAAR ID in the live registry, or check a student’s signed QR code. No account needed.',
  },
]

export default function Home() {
  const { account } = useSession()
  const stats = useApi(() => Promise.all([getAnalytics(), listInstitutions({ page_size: 1 })]), [])
  const [a, inst] = stats.data ?? []

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-primary text-white">
      {/* Campus photo behind the hero, tinted navy so the text stays readable */}
      <div aria-hidden="true" className="home-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(100vh,900px)] overflow-hidden">
        <img src="campus.webp" alt="" className="size-full object-cover object-[70%_30%]" />
      </div>
      <GovStrip />
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8 outline-none sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Brand subtitle="SIH26263 · Team Code Geass" />
          {account ? (
            <Link to={HOME[account.role]} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-saffron-2 px-3.5 text-[13.5px] font-semibold text-primary hover:brightness-105">
              Continue as {account.name.length > 28 ? `${account.name.slice(0, 26)}…` : account.name} <Icon name="arrowRight" size={15} />
            </Link>
          ) : (
            <Link to="/login" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-saffron-2 px-3.5 text-[13.5px] font-semibold text-primary hover:brightness-105">
              Sign in <Icon name="arrowRight" size={15} />
            </Link>
          )}
        </header>

        <section className="pt-14 pb-10 sm:pt-20">
          <h1 className="max-w-3xl font-display text-4xl leading-[1.1] font-bold sm:text-[56px]">One APAAR ID. One verified student record.</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-7 text-primary-soft">
            AICTE-approved institutions submit student data once. The validation engine catches duplicate, dual and
            excess admissions automatically, and anyone the student allows can verify their record in seconds.
          </p>
          {a && inst && (
            <p className="mt-6 text-[14px] text-primary-soft">
              Live registry: <span className="font-semibold text-white">{inr(inst.total)}</span> approved institutions ·{' '}
              <span className="font-semibold text-white">{inr(a.total_enrolled_students)}</span> students submitted ·{' '}
              <span className="font-semibold text-white">{inr(a.total_flagged_violations)}</span> flagged for review
            </p>
          )}
          {stats.error && <p className="mt-6 text-[14px] text-saffron-2">The registry server isn’t reachable. Start the backend on port 8000.</p>}
        </section>

        <section aria-label="Portals" className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">
          {PORTALS.map((p) => (
            <Link key={p.to} to={p.to} className="group flex gap-4 bg-primary-2 p-6 transition-colors hover:bg-primary-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-white/10 text-saffron-2">
                <Icon name={p.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-primary-soft">{p.who}</span>
                <span className="mt-0.5 flex items-center gap-2 font-display text-xl font-semibold">
                  {p.title}
                  <Icon name="arrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-2 block text-[14px] leading-5 text-white/75">{p.does}</span>
              </span>
            </Link>
          ))}
        </section>

        <div className="mt-6 text-[14px]">
          <Link to="/institutions" className="inline-flex items-center gap-1.5 font-semibold text-white underline underline-offset-4">
            Browse approved institutions <Icon name="chevronRight" size={15} />
          </Link>
        </div>
      </main>
      <GovFooter dark />
    </div>
  )
}
