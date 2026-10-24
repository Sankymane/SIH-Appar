import Icon from './Icon.jsx'
import { cx, initials } from '../lib/format.js'

const BTN = {
  primary: 'bg-primary-2 text-white hover:bg-primary border-primary-2',
  secondary: 'bg-card text-ink border-line hover:bg-surface-low',
  saffron: 'bg-saffron text-white border-saffron hover:brightness-110',
  danger: 'bg-err text-white border-err hover:brightness-110',
  ghost: 'bg-transparent text-primary-3 border-transparent hover:bg-surface-mid',
  dangerGhost: 'bg-transparent text-err border-transparent hover:bg-err-bg',
}

export function Button({ variant = 'secondary', icon, iconRight, size = 'md', className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors',
        'disabled:opacity-45 disabled:hover:brightness-100',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        BTN[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>
  )
}

const TONE = {
  ok: 'bg-ok-bg text-ok',
  err: 'bg-err-bg text-err',
  warn: 'bg-warn-bg text-warn',
  info: 'bg-primary-tint text-primary-3',
  saffron: 'bg-saffron-bg text-saffron',
  neutral: 'bg-surface-mid text-muted',
}

export function Badge({ tone = 'neutral', dot, className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const SEV = {
  critical: { tone: 'err', label: 'Critical', solid: true },
  high: { tone: 'err', label: 'High' },
  medium: { tone: 'warn', label: 'Medium' },
  error: { tone: 'err', label: 'Error' },
  warning: { tone: 'warn', label: 'Warning' },
}

export function Severity({ level }) {
  const s = SEV[level] ?? SEV.medium
  if (s.solid) {
    return <span className="inline-flex items-center gap-1.5 rounded-sm bg-err px-2 py-0.5 text-xs font-semibold text-white">{s.label}</span>
  }
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  )
}

export function Panel({ title, subtitle, icon, actions, className, bodyClassName, children }) {
  return (
    <section className={cx('rounded-lg border border-line-soft bg-card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <Icon name={icon} size={19} className="mt-0.5 text-primary-3" />}
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold leading-6 text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName ?? 'p-5'}>{children}</div>
    </section>
  )
}

export function Avatar({ name, size = 40, className }) {
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-md bg-primary-tint font-display font-semibold text-primary-3', className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function Meter({ value, max, overflowTone = 'err', className }) {
  const ratio = max ? value / max : 0
  const within = Math.min(ratio, 1) * 100
  const over = ratio > 1
  return (
    <div className={cx('relative h-2 w-full overflow-hidden rounded-full bg-surface-mid', className)}>
      <div
        className={cx('h-full rounded-full', over ? (overflowTone === 'err' ? 'bg-err' : 'bg-warn') : ratio >= 0.98 ? 'bg-ok' : 'bg-primary-2')}
        style={{ width: `${within}%` }}
      />
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputBase =
  'h-10 rounded-md border border-line bg-card px-3 text-sm text-ink placeholder:text-subtle focus:border-primary-3 focus:outline-none'
export const inputClass = `${inputBase} w-full`

export function Segmented({ options, value, onChange, className }) {
  return (
    <div role="tablist" className={cx('inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-surface-low p-0.5', className)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        const active = v === value
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(v)}
            className={cx(
              'h-8 rounded-[5px] px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
              active ? 'bg-primary-2 text-white' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-surface-mid" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line-soft px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-surface-mid" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line-soft px-5 py-3">{footer}</div>}
      </aside>
    </div>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-60 -translate-x-1/2 rounded-md bg-primary px-4 py-2.5 text-sm text-white shadow-lg">
      {message}
    </div>
  )
}
