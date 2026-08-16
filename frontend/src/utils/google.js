// Singleton helper to initialize Google Identity Services once and register callbacks.
const callbacks = [];
let initialized = false;

export function registerGoogleCallback(cb) {
  if (typeof cb === 'function') callbacks.push(cb);
}

export function initGoogle(clientId) {
  if (initialized) return true;
  if (!window.google?.accounts?.id) return false;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp) => {
      for (const cb of callbacks) {
        try {
          cb(resp);
        } catch (e) {
          // swallow handler errors to avoid breaking other handlers
        }
      }
    },
    ux_mode: 'popup',
  });
  initialized = true;
  // expose for debugging/testing
  window.__google_initialized = true;
  return true;
}

export function promptGoogle() {
  if (!window.google?.accounts?.id) return false;
  try {
    window.google.accounts.id.prompt();
    return true;
  } catch (e) {
    return false;
  }
}

export function isGoogleReady() {
  return Boolean(window.google?.accounts?.id);
}

export default { registerGoogleCallback, initGoogle, promptGoogle, isGoogleReady };
