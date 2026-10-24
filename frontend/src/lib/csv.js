// Minimal RFC 4180 CSV parser and writer (quoted fields, escaped quotes, CRLF).

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const s = text.replace(/^﻿/, '')

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }

  const nonEmpty = rows.filter((r) => r.some((v) => v.trim() !== ''))
  if (!nonEmpty.length) return { headers: [], records: [] }
  const headers = nonEmpty[0].map((h) => h.trim())
  const records = nonEmpty.slice(1).map((r, idx) => {
    const obj = { __row: idx + 2 } // spreadsheet row number (header is row 1)
    headers.forEach((h, j) => {
      obj[h] = (r[j] ?? '').trim()
    })
    return obj
  })
  return { headers, records }
}

export function toCsv(headers, rows) {
  const esc = (v) => {
    const str = v == null ? '' : String(v)
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  return [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}

export function downloadText(filename, text, type = 'text/csv') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
