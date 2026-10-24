import { QRCodeSVG } from 'qrcode.react'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'
import { apaar as fmtApaar } from '../lib/format.js'

// Problem statement requirement 10: degree-awarding bodies print the APAAR ID
// next to the student ID on certificates. This shows that layout as a specimen.

function degreeName(department = '', level = 'UG') {
  if (/MBA|Business Administration/i.test(department)) return 'Master of Business Administration'
  if (/MCA|Computer Applications/i.test(department)) return 'Master of Computer Applications'
  if (/diploma/i.test(level)) return `Diploma in ${department}`
  return level === 'PG' ? `Master of Technology in ${department}` : `Bachelor of Technology in ${department}`
}

// `s` accepts a backend Student, or a /verify response (student_name, admission_year)
export default function Certificate({ s, onClose }) {
  if (!s) return null
  const name = s.full_name ?? s.student_name
  const year = s.academic_year ?? s.admission_year
  const raw = String(s.apaar_id ?? '').replace(/[\s-]/g, '')
  const id = /^\d{12}$/.test(raw) ? raw : ''
  const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?apaar=${id}`
  const hash = s.verification_hash ?? s.digital_signature_hash

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-primary/50 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className="mx-auto max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-card px-4 py-3 print:hidden">
          <div className="text-[14px]">
            <span className="font-semibold">Certificate specimen</span>
            <span className="text-muted"> · how degree certificates carry the APAAR ID (requirement 10)</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" icon="download" onClick={() => window.print()}>
              Print or save as PDF
            </Button>
            <Button size="sm" variant="ghost" icon="x" onClick={onClose} aria-label="Close" />
          </div>
        </div>

        <article className="cert-print relative overflow-hidden rounded-md bg-white p-3 text-[#161c27] shadow-2xl print:shadow-none">
          <div className="relative border-[3px] border-[#1e2a5a] p-1.5">
            <div className="relative border border-[#ffa44b] px-6 py-8 sm:px-12">
              <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="-rotate-[24deg] text-[88px] font-bold tracking-[0.2em] text-[#1e2a5a]/[0.05] select-none">SPECIMEN</span>
              </div>

              <header className="relative text-center">
                <div className="text-[12px] tracking-[0.18em] text-[#45464f]">AICTE-APPROVED INSTITUTION</div>
                <div className="mt-1 font-display text-[22px] leading-7 font-bold text-[#1e2a5a]">{s.college_name}</div>
                <div className="text-[12.5px] text-[#45464f]">AICTE ID {s.aicte_id}</div>
              </header>

              <div className="relative mt-8 text-center">
                <p className="text-[14px] text-[#45464f] italic">This is to certify that</p>
                <p className="mt-2 font-display text-[30px] leading-9 font-bold text-[#061445]">{name}</p>
                <p className="mt-3 text-[14px] text-[#45464f]">has been admitted to the programme</p>
                <p className="mt-1.5 text-[19px] font-semibold text-[#1e2a5a]">{degreeName(s.department, s.level)}</p>
                <p className="mt-1 text-[13px] text-[#45464f]">Academic year {year}</p>
              </div>

              <div className="relative mx-auto mt-8 grid max-w-xl grid-cols-2 border border-[#c6c5d0] text-left">
                <div className="border-r border-[#c6c5d0] px-4 py-3">
                  <div className="text-[11.5px] font-semibold text-[#45464f]">APAAR ID</div>
                  <div className="mt-0.5 font-mono text-[19px] font-semibold tracking-wider text-[#061445]">{id ? fmtApaar(id) : s.apaar_id || 'Not linked'}</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[11.5px] font-semibold text-[#45464f]">Enrolment number</div>
                  <div className="mt-0.5 font-mono text-[17px] font-semibold text-[#8e4e00]">{s.enrollment_no}</div>
                </div>
              </div>

              <footer className="relative mt-10 flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-xs text-[11.5px] text-[#45464f]">
                  <div className="font-semibold text-[#1e2a5a]">Registry fingerprint</div>
                  <div className="mt-0.5 font-mono break-all">{hash ? `${hash.slice(0, 32)}…` : 'Pending verification'}</div>
                  <div className="mt-2">Scan the code to check this record against the AICTE APAAR registry.</div>
                </div>
                <QRCodeSVG value={verifyUrl} size={96} level="M" fgColor="#061445" />
                <div className="text-center text-[12px] text-[#45464f]">
                  <div className="mb-1 h-8 w-40 border-b border-[#161c27]" />
                  Registrar
                </div>
              </footer>
            </div>
          </div>
        </article>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-white print:hidden">
          <Icon name="info" size={14} /> Specimen layout only. Degree certificates are issued by the degree-awarding body.
        </p>
      </div>
    </div>
  )
}
