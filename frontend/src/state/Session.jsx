import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { setAuthToken } from '../api/index.js'

// Who is signed in, plus the backend's JWT. Stored per browser tab, so two tabs
// can be signed in as two different colleges side by side during a demo.
//
// account = {
//   role: 'institution' | 'aicte' | 'student',
//   token,                 // JWT from the backend (institution and AICTE)
//   name, title, org,      // what the masthead shows
//   aicteId,               // institution accounts
//   apaarId,               // student accounts
// }

const KEY = 'apaar-setu-session-v2'
const Ctx = createContext(null)

function load() {
  try {
    const a = JSON.parse(sessionStorage.getItem(KEY))
    if (a?.token) setAuthToken(a.token)
    return a
  } catch {
    return null
  }
}

export const HOME = { institution: '/institution', aicte: '/aicte', student: '/student' }

// Backend roles → frontend roles
export function accountFromToken(res) {
  if (res.role === 'AICTE_VERIFIER') {
    return {
      role: 'aicte',
      token: res.access_token,
      name: 'Dr. Alok Singh',
      title: 'Joint Secretary, Approval Bureau',
      org: res.college_name,
      aicteId: res.aicte_id,
    }
  }
  return {
    role: 'institution',
    token: res.access_token,
    name: res.college_name,
    title: `Nodal officer · AICTE ID ${res.aicte_id}`,
    org: res.college_name,
    aicteId: res.aicte_id,
  }
}

export function SessionProvider({ children }) {
  const [account, setAccount] = useState(load)

  const signIn = useCallback((a) => {
    setAuthToken(a.token ?? null)
    setAccount(a)
    try {
      sessionStorage.setItem(KEY, JSON.stringify(a))
    } catch {
      /* storage unavailable */
    }
    return a
  }, [])

  const signOut = useCallback(() => {
    setAuthToken(null)
    setAccount(null)
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const value = useMemo(() => ({ account, signIn, signOut }), [account, signIn, signOut])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession() {
  return useContext(Ctx)
}
