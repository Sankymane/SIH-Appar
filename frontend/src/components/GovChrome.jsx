import { usePrefs } from '../state/Prefs.jsx'
import { cx } from '../lib/format.js'

// Header strip and footer following the Guidelines for Indian Government
// Websites (GIGW), as seen on india.gov.in, mha.gov.in and uidai.gov.in.

const LAST_UPDATED = '23 Oct 2026'

function focusMain() {
  const el = document.getElementById('main')
  if (el) {
    el.focus()
    el.scrollIntoView()
  }
}

export function GovStrip({ className }) {
  const { lang, setLang, scale, bump, contrast, setContrast, t } = usePrefs()
  const btn = 'rounded-sm px-1.5 py-0.5 hover:bg-white/15 aria-pressed:bg-white/20'
  return (
    <div className={cx('bg-[#0b1233] text-[12.5px] text-white/85', className)}>
      <div className="flex h-9 items-center gap-3 px-4 sm:px-6">
        <span className="hidden truncate md:inline">Prototype for AICTE, Ministry of Education · Smart India Hackathon 2026</span>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={focusMain} className={cx(btn, 'hidden sm:inline')}>
            {t('Skip to main content')}
          </button>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <span className="sr-only">{t('Text size')}</span>
          <button type="button" className={btn} onClick={() => bump(-1)} aria-label="Decrease text size">A<sup>−</sup></button>
          <button type="button" className={btn} onClick={() => bump(0)} aria-pressed={scale === 1} aria-label="Reset text size">A</button>
          <button type="button" className={btn} onClick={() => bump(1)} aria-label="Increase text size">A<sup>+</sup></button>
          <span className="h-4 w-px bg-white/20" />
          <button
            type="button"
            className={btn}
            onClick={() => setContrast(contrast === 'high' ? 'normal' : 'high')}
            aria-pressed={contrast === 'high'}
            title={contrast === 'high' ? t('Normal contrast') : t('High contrast')}
          >
            <span aria-hidden className="inline-block size-3 rounded-full border border-white align-[-1px]" style={{ background: 'linear-gradient(90deg, #fff 50%, transparent 50%)' }} />
            <span className="sr-only">{t('High contrast')}</span>
          </button>
          <span className="h-4 w-px bg-white/20" />
          <button type="button" className={cx(btn, 'font-medium text-white')} onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} lang={lang === 'hi' ? 'en' : 'hi'}>
            {lang === 'hi' ? 'English' : 'हिन्दी'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function GovFooter({ dark = false }) {
  const links = ['Website policies', 'Accessibility statement', 'Help', 'Sitemap', 'Contact us']
  return (
    <footer className={cx('mt-12 border-t text-[12.5px]', dark ? 'border-white/10 text-white/70' : 'border-line-soft bg-card text-muted')}>
      <div className="mx-auto flex max-w-350 flex-wrap items-start justify-between gap-x-10 gap-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-1.5">
          <p>
            Prototype built by Team Code Geass for Smart India Hackathon 2026 (problem statement SIH26263). Not an
            official Government of India website. Institutions come from AICTE’s approved list; student records are
            synthetic.
          </p>
          <p>Hindi labels are a prototype translation and haven’t been officially reviewed.</p>
        </div>
        <div className="space-y-1.5 text-right">
          <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1">
            {links.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p>Last reviewed and updated on {LAST_UPDATED}</p>
        </div>
      </div>
    </footer>
  )
}
