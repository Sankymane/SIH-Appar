import { HI } from '../lib/i18n.js'
import { cx, pct } from '../lib/format.js'

// Heading with its Hindi equivalent, as on government registers
export function RegisterHeading({ en, children, right }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 border-b border-ink pb-2">
      <h2 className="text-[16px] font-bold text-ink">{en}</h2>
      {HI[en] && (
        <span lang="hi" className="text-[13.5px] text-primary-3">
          {HI[en]}
        </span>
      )}
      {children}
      {right && <div className="ml-auto flex flex-wrap items-center gap-3">{right}</div>}
    </div>
  )
}

// Underlined text tabs instead of pill buttons
export function TextTabs({ label, options, value, onChange }) {
  return (
    <div className="flex items-baseline gap-1 text-[13px] text-muted" role="group" aria-label={label}>
      <span className="mr-1">{label}:</span>
      {options.map((o, i) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <span key={v} className="flex items-baseline gap-1">
            {i > 0 && <span className="text-subtle">·</span>}
            <button
              type="button"
              aria-pressed={v === value}
              onClick={() => onChange(v)}
              className={cx('px-0.5 hover:text-ink', v === value && 'border-b-[1.5px] border-primary-2 font-semibold text-ink')}
            >
              {l}
            </button>
          </span>
        )
      })}
    </div>
  )
}

export function SeatsBar({ sanctioned, enrolled, className }) {
  // Track runs to 110% so overshoots stay visible; the tick marks 100%.
  const cap = 1.1
  const ratio = enrolled / sanctioned
  const within = (Math.min(ratio, 1) / cap) * 100
  const over = ratio > 1 ? ((Math.min(ratio, cap) - 1) / cap) * 100 : 0
  return (
    <div className={cx('relative h-2.5 w-full max-w-60 bg-surface-mid', className)} role="img" aria-label={`${pct(enrolled, sanctioned)}% of sanctioned seats used`}>
      <div className="seat-fill absolute inset-y-0 left-0 bg-primary-2" style={{ width: `${within}%` }} />
      {over > 0 && <div className="absolute inset-y-0 bg-err" style={{ left: `${100 / cap}%`, width: `${over}%` }} />}
      <div className="absolute -inset-y-1 w-[1.5px] bg-ink" style={{ left: `${100 / cap}%` }} />
    </div>
  )
}
