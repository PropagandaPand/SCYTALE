/**
 * Runtime environment checks used to give a friendly first impression instead of a
 * scary "CRYPT ERROR" when SKYTALE is opened inside an app's embedded preview browser
 * (Instagram/Facebook/… in-app WebViews), which often lack a usable WebCrypto. Those
 * users get a "open in a real browser" screen; a genuine self-test failure in an
 * actual browser still surfaces the hard error (a real tamper/broken-crypto signal).
 */
export function hasWebCrypto(): boolean {
  try {
    return typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.subtle.generateKey === 'function';
  } catch {
    return false;
  }
}

// Known in-app/embedded browsers. Not exhaustive, and only used to TAILOR the
// message — the decisive signal is a failed self-test / missing WebCrypto.
const IN_APP_UA = /(Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|Snapchat|TikTok|musical_ly|Pinterest|LinkedInApp|; wv\))/i;

export function isInAppBrowser(): boolean {
  try {
    return IN_APP_UA.test(navigator.userAgent || '');
  } catch {
    return false;
  }
}

export function isInstagram(): boolean {
  try {
    return /Instagram/i.test(navigator.userAgent || '');
  } catch {
    return false;
  }
}
