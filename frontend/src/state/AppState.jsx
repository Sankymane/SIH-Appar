import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { INITIAL_ACTIVITY, INITIAL_GRANTS } from '../data/consent.js'

// Consent grants and access logs per student, keyed by `${aicte_id}:${enrollment_no}`
// (the same two values carried in the signed QR credential, so a verifier can
// find the right student's consent). Browser-only for now: the backend has no
// consent endpoints yet.

const KEY = 'apaar-setu-consent-v2'
const Ctx = createContext(null)

export const studentKey = (aicteId, enrollmentNo) => `${aicteId}:${enrollmentNo}`

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

const fresh = () => ({ grants: INITIAL_GRANTS, activity: INITIAL_ACTIVITY })

export function AppStateProvider({ children }) {
  const [all, setAll] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(all))
    } catch {
      /* storage unavailable */
    }
  }, [all])

  const get = useCallback((key) => all[key] ?? fresh(), [all])

  const update = useCallback((key, fn) => {
    setAll((a) => ({ ...a, [key]: fn(a[key] ?? fresh()) }))
  }, [])

  const log = useCallback(
    (key, entry) =>
      update(key, (s) => ({
        ...s,
        activity: [{ id: `a${Date.now()}${Math.random()}`, at: new Date().toISOString(), ...entry }, ...s.activity].slice(0, 30),
      })),
    [update],
  )

  const revokeGrant = useCallback(
    (key, id) => {
      let org
      update(key, (s) => ({
        ...s,
        grants: s.grants.map((g) => {
          if (g.id !== id) return g
          org = g.org
          return { ...g, status: 'revoked', revokedOn: new Date().toISOString().slice(0, 10) }
        }),
      }))
      setTimeout(() => org && log(key, { kind: 'revoked', who: 'You', what: `Revoked access for ${org}`, result: 'Takes effect immediately' }))
    },
    [update, log],
  )

  const addGrant = useCallback(
    (key, { orgId, org, purpose, scope, days }) => {
      const expires = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
      update(key, (s) => ({
        ...s,
        grants: [{ id: `g-${orgId}-${Date.now()}`, orgId, org, purpose, scope, expires, status: 'active' }, ...s.grants.filter((g) => !(g.orgId === orgId && g.status === 'active'))],
      }))
      log(key, { kind: 'shared', who: 'You', what: `Granted access to ${org}`, result: `${scope.join(', ')} · ${days} days` })
    },
    [update, log],
  )

  const consentFor = useCallback(
    (key, orgId) => {
      const list = get(key).grants.filter((g) => g.orgId === orgId)
      const active = list.find((g) => g.status === 'active' && (!g.expires || new Date(g.expires) >= new Date()))
      if (active) return { state: 'active', grant: active }
      const revoked = list.find((g) => g.status === 'revoked')
      if (revoked) return { state: 'revoked', grant: revoked }
      return { state: 'none' }
    },
    [get],
  )

  const value = useMemo(() => ({ get, log, revokeGrant, addGrant, consentFor }), [get, log, revokeGrant, addGrant, consentFor])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState() {
  return useContext(Ctx)
}
