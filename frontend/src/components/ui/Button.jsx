import React from 'react';

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'btn';
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : variant === 'success' ? 'btn-success' : variant === 'google' ? 'google-btn' : '';
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  return (
    <button className={`${base} ${variantClass} ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
