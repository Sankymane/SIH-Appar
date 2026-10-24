// Signed, offline-verifiable student credentials (ECDSA P-256 via Web Crypto).
//
// Token format:  AS1.<base64url(payload JSON)>.<base64url(64-byte signature)>
//
// DEMO ONLY: the issuer's private key is embedded here so every teammate's laptop
// produces and verifies the same tokens. In production the private key lives in
// AICTE's HSM on the backend and only the public key ships to verifiers.

const ISSUER = 'AICTE · APAAR Setu'
const KEY_ID = 'AICTE-PKI-2026-01'

const PUBLIC_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'p8KixvBtSZnmcJdiy04Zl1bO9_Xp2EUMYcEcfEUwXsw',
  y: '7-vUNqq_D5UXJlJ55LLg07IcIx442RsYbIRwMY12wkU',
}
const PRIVATE_JWK = { ...PUBLIC_JWK, d: 'Vk3sDWQ-WJ6gt9v6fUxeX1_Yu1_-OZNGsSU-kxDu28Y' }

const ALG = { name: 'ECDSA', namedCurve: 'P-256' }
const SIGN = { name: 'ECDSA', hash: 'SHA-256' }

let keysPromise
function keys() {
  if (!keysPromise) {
    keysPromise = Promise.all([
      crypto.subtle.importKey('jwk', PRIVATE_JWK, ALG, false, ['sign']),
      crypto.subtle.importKey('jwk', PUBLIC_JWK, ALG, false, ['verify']),
    ]).then(([priv, pub]) => ({ priv, pub }))
  }
  return keysPromise
}

function b64urlEncode(bytes) {
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

const enc = new TextEncoder()
const dec = new TextDecoder()

export async function digestHex(text) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// `record` is the backend's /verify/:apaar_id response for this student
export async function issueCredential(record, { validDays = 30 } = {}) {
  const now = Date.now()
  const id = String(record.apaar_id ?? '').replace(/\D/g, '')
  const payload = {
    v: 1,
    iss: ISSUER,
    kid: KEY_ID,
    cid: `CRD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    // The QR never carries the full APAAR ID, only the last 4 digits.
    a: `XXXX XXXX ${id.slice(-4)}`,
    n: record.student_name,
    i: record.college_name,
    pid: record.aicte_id,
    p: `${record.department} (${record.level})`,
    b: record.enrollment_no,
    y: record.admission_year,
    s: record.is_valid ? 'Active' : 'Under review',
    h: record.digital_signature_hash ? record.digital_signature_hash.slice(0, 16) : null,
    iat: now,
    exp: now + validDays * 24 * 60 * 60 * 1000,
  }
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)))
  const { priv } = await keys()
  const sig = new Uint8Array(await crypto.subtle.sign(SIGN, priv, enc.encode(body)))
  const token = `AS1.${body}.${b64urlEncode(sig)}`
  return { token, payload, digest: await digestHex(token) }
}

// Result statuses: verified | tampered | expired | malformed
export async function verifyCredential(raw) {
  const token = (raw || '').trim()
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'AS1') {
    return { status: 'malformed', reason: 'This isn’t an APAAR Setu credential code.' }
  }
  let payload
  try {
    payload = JSON.parse(dec.decode(b64urlDecode(parts[1])))
  } catch {
    return { status: 'malformed', reason: 'The code is damaged or incomplete.' }
  }
  let ok = false
  try {
    const { pub } = await keys()
    ok = await crypto.subtle.verify(SIGN, pub, b64urlDecode(parts[2]), enc.encode(parts[1]))
  } catch {
    ok = false
  }
  const digest = await digestHex(token)
  const checkedAt = new Date()
  if (!ok) return { status: 'tampered', payload, digest, checkedAt, keyId: KEY_ID }
  if (payload.exp < Date.now()) return { status: 'expired', payload, digest, checkedAt, keyId: KEY_ID }
  return { status: 'verified', payload, digest, checkedAt, keyId: KEY_ID }
}

// Demo helper: edits the signed data but keeps the old signature.
export function tamperToken(token) {
  const [h, body, sig] = token.split('.')
  const payload = JSON.parse(dec.decode(b64urlDecode(body)))
  payload.p = 'M.Tech Artificial Intelligence (PG)'
  payload.s = 'Graduated'
  return `${h}.${b64urlEncode(enc.encode(JSON.stringify(payload)))}.${sig}`
}

export function shortCode(digest = '') {
  return `${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`.toUpperCase()
}

export { KEY_ID, ISSUER }
