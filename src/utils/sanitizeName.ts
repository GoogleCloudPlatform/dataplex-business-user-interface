export const FALLBACK_GREETING = 'there';
export const MAX_NAME_LENGTH = 60;

export function sanitizeFirstName(name: string | null | undefined): string {
  if (name == null) return FALLBACK_GREETING;

  // Strip zero-width characters (U+200B, U+200C, U+200D, U+FEFF, soft hyphen)
  let sanitized = name.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');

  // Normalize whitespace: convert tabs/newlines to spaces, collapse multiple spaces, trim
  sanitized = sanitized.replace(/[\t\n\r]/g, ' ').replace(/ {2,}/g, ' ').trim();

  if (sanitized.length === 0) return FALLBACK_GREETING;

  // Extract first name
  const firstName = sanitized.split(' ')[0];

  // Escape HTML entities to prevent XSS
  const escaped = firstName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Truncate to max length
  if (escaped.length > MAX_NAME_LENGTH) {
    return escaped.slice(0, MAX_NAME_LENGTH);
  }

  return escaped;
}
