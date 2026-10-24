import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'
import { statusInfo } from '../data/consent.js'
import { cx, inr } from '../lib/format.js'

// Load data from the API, with loading / error / reload
export function useApi(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  const load = useCallback(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: null }))
    run()
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((error) => live && setState((s) => ({ data: s.data, error, loading: false })))
    return () => {
      live = false
    }
  }, [run])
  useEffect(() => load(), [load])
  return { ...state, reload: load }
}

export function Loading({ children = 'Loading…' }) {
  return <div className="py-16 text-center text-muted">{children}</div>
}

export function ErrorState({ error, onRetry }) {
  if (!error) return null
  return (
    <div role="alert" className="my-6 flex flex-wrap items-center gap-3 rounded-md border border-err/30 bg-err-bg/40 px-4 py-3 text-[14px] text-err">
      <Icon name="alert" size={18} />
      <span className="flex-1">{error.message}</span>
      {onRetry && (
        <Button size="sm" onClick={onRetry} icon="refresh">
          Try again
        </Button>
      )}
    </div>
  )
}

const TONE_DOT = { ok: 'bg-ok', err: 'bg-err', warn: 'bg-warn', neutral: 'bg-subtle' }

export function StatusTag({ status, long }) {
  const s = statusInfo(status)
  return (
    <span className={cx('inline-flex items-center gap-2 whitespace-nowrap', s.tone === 'err' && 'text-err', s.tone === 'warn' && 'text-warn', s.tone === 'ok' && 'text-ok')}>
      <span className={cx('inline-block size-2', TONE_DOT[s.tone])} />
      {long ? s.label : s.short}
    </span>
  )
}

export function Pager({ page, totalPages, total, pageSize, onPage }) {
  if (!total) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-[13px] text-muted">
      <span>
        {inr(from)}–{inr(to)} of {inr(total)}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" icon="chevronLeft" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" />
        <span className="px-2 tnum">
          {page} / {Math.max(1, totalPages)}
        </span>
        <Button size="sm" variant="ghost" icon="chevronRight" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" />
      </div>
    </div>
  )
}

// Horizontal labelled bars for one series (a distribution). Values sit next to
// every bar, so the chart doubles as its own table.
export function BarList({ title, items, unit = 'students' }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  const total = items.reduce((n, i) => n + i.value, 0)
  return (
    <figure>
      <figcaption className="mb-3 text-[13.5px] font-semibold text-ink">{title}</figcaption>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.label} className="grid items-center gap-3 text-[13px]" style={{ gridTemplateColumns: 'minmax(0, 9rem) 1fr auto' }} title={`${i.label}: ${inr(i.value)} ${unit} (${total ? Math.round((i.value / total) * 100) : 0}%)`}>
            <span className="truncate text-muted">{i.label}</span>
            <span className="h-2.5 rounded-r-sm bg-surface-mid">
              <span className="block h-full rounded-r-sm bg-primary-2" style={{ width: `${(i.value / max) * 100}%`, minWidth: i.value ? 3 : 0 }} />
            </span>
            <span className="w-12 text-right font-medium text-ink tnum">{inr(i.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

export function Figures({ items }) {
  return (
    <dl className="grid border-t border-b border-t-ink border-b-line sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value, sub, bad], i) => (
        <div key={label} className={cx('py-3.5 pr-4', i > 0 && 'xl:border-l xl:border-line xl:pl-5', i % 2 === 1 && 'sm:border-l sm:border-line sm:pl-5')}>
          <dt className="text-[12.5px] text-muted">{label}</dt>
          <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className={cx('text-[24px] leading-8 font-semibold', bad ? 'text-err' : 'text-ink')}>{value}</span>
            {sub && <span className="text-[13px] text-muted">{sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
