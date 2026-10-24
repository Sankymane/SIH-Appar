import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { Avatar } from './ui.jsx'
import { Link, navigate } from '../lib/router.jsx'
import { useSession } from '../state/Session.jsx'
import { cx } from '../lib/format.js'
import { GovFooter, GovStrip } from './GovChrome.jsx'
import { usePrefs } from '../state/Prefs.jsx'

export function LogoMark({ size = 32, className }) {
  // A bridge ("setu") arching over a baseline of record dots.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#ffa44b" />
      <path d="M5 21c3.5-8 18.5-8 22 0" fill="none" stroke="#061445" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11 16.6v4.4M16 15v6M21 16.6v4.4" stroke="#061445" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 24.5h24" stroke="#061445" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function Brand({ subtitle, dark = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-tight">
        <div className={cx('font-display text-[16px] font-bold', dark ? 'text-white' : 'text-primary')}>APAAR Setu</div>
        {subtitle && <div className={cx('text-[11.5px]', dark ? 'text-primary-soft' : 'text-muted')}>{subtitle}</div>}
      </div>
    </div>
  )
}

// Layout used by government portals (india.gov.in, mha.gov.in, uidai.gov.in):
// utility strip → masthead with identity → horizontal menu bar → content → footer.
export default function Shell({ subtitle, context, nav, user, crumbs, topExtra, children }) {
  const [open, setOpen] = useState(false)
  const { t } = usePrefs()
  const { signOut } = useSession()

  // Close the mobile menu if the window grows past the breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const item = (n, mobile) => (
    <a
      key={n.label}
      href={n.to ? `#${n.to}` : undefined}
      aria-current={n.active ? 'page' : undefined}
      aria-disabled={!n.to || undefined}
      onClick={() => setOpen(false)}
      className={cx(
        'flex items-center gap-2 text-[14px] whitespace-nowrap transition-colors',
        mobile ? 'border-l-3 px-4 py-3' : 'h-12 border-b-3 px-4',
        n.active ? 'border-saffron-2 bg-white/10 font-semibold text-white' : 'border-transparent text-white/80',
        n.to ? 'hover:bg-white/10 hover:text-white' : 'cursor-default opacity-55',
      )}
    >
      {t(n.label)}
      {n.badge && <span className="rounded-sm bg-err px-1.5 py-px text-[11px] font-semibold text-white">{n.badge}</span>}
    </a>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <GovStrip />

      {/* Masthead */}
      <header className="border-b border-line-soft bg-card">
        <div className="mx-auto flex max-w-350 items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="APAAR Setu home">
            <LogoMark size={44} />
            <div className="min-w-0 leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[20px] font-bold text-primary">APAAR Setu</span>
                <span lang="hi" className="text-[15px] font-semibold text-primary-3">
                  अपार सेतु
                </span>
              </div>
              <div className="truncate text-[13px] text-muted">
                {subtitle}
                {context && <span className="hidden sm:inline"> · {context}</span>}
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            {topExtra}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden max-w-80 text-right leading-tight sm:block">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{user.name}</div>
                  <div className="truncate text-[12px] text-muted">{user.role}</div>
                </div>
                <Avatar name={user.name} size={38} />
              </div>
            ) : (
              <Link to="/login" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary-2 px-4 text-[14px] font-semibold text-white hover:bg-primary">
                {t('Sign in')} <Icon name="arrowRight" size={15} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Menu bar */}
      <nav aria-label="Main" className="sticky top-0 z-30 bg-primary-2 text-white shadow-sm">
        <div className="mx-auto flex max-w-350 items-stretch px-0 sm:px-2 lg:px-4">
          <button
            type="button"
            className="flex h-12 items-center gap-2 px-4 text-[14px] font-semibold md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Icon name={open ? 'x' : 'menu'} size={20} />
            Menu
          </button>
          <div className="hidden min-w-0 flex-1 overflow-x-auto md:flex">{nav.map((n) => item(n, false))}</div>
          {user && (
            <button
              type="button"
              onClick={() => {
                signOut()
                navigate('/login')
              }}
              className="ml-auto flex h-12 items-center gap-1.5 px-4 text-[13px] whitespace-nowrap text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Icon name="switch" size={15} />
              {t('Sign out')}
            </button>
          )}
        </div>
        {open && (
          <div id="mobile-menu" className="border-t border-white/10 pb-2 md:hidden">
            {nav.map((n) => item(n, true))}
          </div>
        )}
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-350 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          <Link to="/" className="hover:text-ink hover:underline">
            Home
          </Link>
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              <Icon name="chevronRight" size={13} className="text-subtle" />
              <span className={cx(i === crumbs.length - 1 && 'font-medium text-ink')} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                {t(c)}
              </span>
            </span>
          ))}
        </nav>
        {children}
      </main>
      <GovFooter />
    </div>
  )
}
