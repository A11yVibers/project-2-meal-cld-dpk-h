import { useRef, useState } from 'react'

// Searchable ingredient selection. Typing filters the supplied options; a
// value that matches nothing is kept as a free-text (custom) ingredient.
export default function Combobox({ value, options, placeholder, onChangeText, onSelect }) {
  const [open, setOpen] = useState(false)
  const blurTimer = useRef(null)
  const query = (value || '').trim().toLowerCase()

  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query)).slice(0, 8)
    : options.slice(0, 8)

  function pick(option) {
    onChangeText(option.name)
    if (onSelect) onSelect(option)
    setOpen(false)
  }

  return (
    <div className="combobox">
      <input
        type="text"
        value={value}
        placeholder={placeholder || 'Search or type an ingredient'}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120)
        }}
        onChange={(e) => {
          onChangeText(e.target.value)
          setOpen(true)
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="combobox-list">
          {filtered.map((o) => (
            <li
              key={o.id}
              onMouseDown={(e) => {
                e.preventDefault()
                clearTimeout(blurTimer.current)
                pick(o)
              }}
            >
              <span className="combobox-name">{o.name}</span>
              {o.category ? <span className="combobox-category">{o.category}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}