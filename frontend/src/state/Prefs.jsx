import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { HI } from '../lib/i18n.js'

// Display preferences required by the Guidelines for Indian Government Websites
// (GIGW): language, text size and contrast. Persisted per browser.

const KEY = 'apaar-setu-prefs-v1'
const SCALES = [0.9, 1, 1.1, 1.2]
const Ctx = createContext(null)

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

export function PrefsProvider({ children }) {
  const saved = load()
  const [lang, setLang] = useState(saved.lang ?? 'en')
  const [scale, setScale] = useState(saved.scale ?? 1)
  const [contrast, setContrast] = useState(saved.contrast ?? 'normal')

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang === 'hi' ? 'hi' : 'en'
    el.dataset.contrast = contrast
    el.style.zoom = String(scale)
    try {
      localStorage.setItem(KEY, JSON.stringify({ lang, scale, contrast }))
    } catch {
      /* storage unavailable */
    }
  }, [lang, scale, contrast])

  const bump = useCallback((dir) => {
    setScale((s) => {
      if (dir === 0) return 1
      const i = SCALES.indexOf(s)
      return SCALES[Math.min(SCALES.length - 1, Math.max(0, (i < 0 ? 1 : i) + dir))]
    })
  }, [])

  // Translate a UI label. Untranslated strings fall back to English.
  const t = useCallback((s) => (lang === 'hi' ? (HI[s] ?? s) : s), [lang])

  const value = useMemo(
    () => ({ lang, setLang, scale, bump, contrast, setContrast, t }),
    [lang, scale, bump, contrast, t],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePrefs() {
  return useContext(Ctx)
}
