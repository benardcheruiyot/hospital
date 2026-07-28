import React from 'react';

export default function LoadingState({ title = 'Loading workspace', message = 'Preparing your care dashboard.' }) {
  return (
    <div className="status-card" role="status" aria-live="polite">
      <div className="status-spinner" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}