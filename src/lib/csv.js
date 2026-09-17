// Minimal, dependency-free CSV parser that correctly handles quoted fields,
// embedded commas, escaped quotes (""), and CRLF line endings.

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
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
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // ignore standalone carriage returns
    } else {
      field += c
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

// Convert raw CSV text into an array of objects keyed by the header row.
export function parseTable(text) {
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const header = rows[0].map((h) => h.trim())
  return rows
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => {
      const obj = {}
      header.forEach((h, i) => {
        obj[h] = (r[i] ?? '').trim()
      })
      return obj
    })
}
