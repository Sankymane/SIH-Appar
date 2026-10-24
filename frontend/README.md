# APAAR Setu: frontend

Frontend for **SIH26263: APAAR ID-based Student Data Management and Verification Platform** (AICTE), team **Code Geass**.

React 19, Vite 7 and Tailwind CSS v4, talking to the FastAPI backend in `../backend` (`/api/v1`).

## Run it

Start the backend first (from the repo root, see the main README), then:

```bash
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173. In development Vite forwards `/api` to the backend on `http://127.0.0.1:8000` (see `vite.config.js`), so there is no CORS setup. The camera scanner needs `localhost` or HTTPS.

## Pages

| Route | Who | What it does |
|---|---|---|
| `#/` | Everyone | Live registry figures and the four portals |
| `#/login` | Everyone | Institution: search, password `aicte@123`, then OTP (shown on screen, or `123456`). AICTE: one click. Student: APAAR ID, then OTP `123456` |
| `#/institutions` | Public | Browse AICTE-approved institutions with filters and course intake |
| `#/institution` | Nodal officer | Course intake register (sanctioned vs. enrolled), admissions profile, Excel/CSV reports |
| `#/institution/students` | Nodal officer | Own roster only: filters, masked APAAR IDs, add a student, certificate, remove |
| `#/institution/upload` | Nodal officer | CSV/Excel upload. Checks the file in the browser first (13 rules, incl. intake), then uploads and shows the server's verdict per row with a SHA-256 fingerprint |
| `#/aicte` | AICTE | National analytics, validation findings, recently flagged records, reports |
| `#/aicte/institutions` | AICTE | All institutions, with links to each one's flagged records and compliance report |
| `#/aicte/flagged` | AICTE | Every flagged record; review, approve after review, or remove |
| `#/aicte/audit` | AICTE | Audit trail with role filter |
| `#/student` | Student | Own registry record, signed QR credential, consent per organisation, access log |
| `#/verify` | Anyone | Look up an APAAR ID in the registry, or check a signed QR (paste, camera, image) |

Sign-in is stored per browser tab, so two colleges and AICTE can be open side by side.

## Privacy

A college never sees another college's name. When the backend flags a student as *enrolled at another institution*, the institution's screens show only that fact; AICTE sees the full remark.

## Code layout

- `src/api/index.js`: every backend call, one function per endpoint. Adds the JWT, turns errors into readable messages.
- `src/state/Session.jsx`: signed-in account (sessionStorage). `src/state/AppState.jsx`: student consent and access log (localStorage for now).
- `src/lib/validation.js`: pre-upload checks mirroring `backend/app/validation_engine.py`, plus the ones bulk upload skips (date of birth, FN in reserved category).
- `src/lib/credential.js`: ECDSA P-256 signed credentials (Web Crypto), verified offline from the QR.
- `src/lib/samples.js`: demo admissions files built from a college's real approved courses.
- `src/components/`: shell (GIGW strip, masthead, top menu, footer), data helpers, certificate, register widgets.

## Government website conventions

Following india.gov.in, mha.gov.in and uidai.gov.in (GIGW): Noto Sans and Noto Sans Devanagari, a top strip with skip link, text size, high contrast and हिन्दी toggle, and a footer with policies and a "last updated" date. No national emblem; the app uses its own mark.
