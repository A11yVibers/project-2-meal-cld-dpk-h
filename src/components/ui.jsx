import React from 'react'

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={'modal' + (wide ? ' modal-wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          {title && <h2 className="modal-title">{title}</h2>}
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Switch({ checked, onChange, label, id }) {
  const inputId = id || (label && label.replace(/\s+/g, '-').toLowerCase())
  return (
    <label className="switch" htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {label && <span className="switch-label">{label}</span>}
    </label>
  )
}

export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        {icon || '🍽️'}
      </div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  )
}