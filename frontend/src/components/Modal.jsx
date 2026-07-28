import React from 'react';

export default function Modal({ open, title, children, onClose, variant = '' }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`modal-window ${variant ? `modal-${variant}` : ''}`}>
        <header className={`modal-header ${variant ? `modal-${variant}` : ''}`}>
          <h2>{title}</h2>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
