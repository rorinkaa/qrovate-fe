let clipboardSupportCache = null;

function getClipboardSupport() {
  if (clipboardSupportCache !== null) return clipboardSupportCache;
  const hasNavigatorClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
  const secure = typeof window !== 'undefined' ? !!window.isSecureContext : false;
  clipboardSupportCache = hasNavigatorClipboard && secure;
  return clipboardSupportCache;
}

function legacyCopyFallback(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!result) throw new Error('execCommand returned false');
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function copyTextToClipboard(rawValue) {
  const text = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
  if (!text.length) {
    return { ok: false, error: new Error('Cannot copy empty value') };
  }

  let lastError = null;
  if (getClipboardSupport()) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch (error) {
      lastError = error;
    }
  }

  const fallback = legacyCopyFallback(text);
  if (fallback.ok) return fallback;
  return { ok: false, error: fallback.error || lastError || new Error('Copy failed') };
}

export function isClipboardSupported() {
  return getClipboardSupport();
}
