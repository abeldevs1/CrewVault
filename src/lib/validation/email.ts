/**
 * Standard RFC 5322 compliant email validator
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;

  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // Strict email format regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) return false;

  // Disallow double dots in local part or domain
  if (trimmed.includes("..")) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;

  const domain = parts[1];
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];

  // TLD must be at least 2 alpha characters
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

  return true;
}

/**
 * Masks an email for safe display (e.g. j***e@airline.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "******";

  const [localPart, domain] = email.split("@");
  if (localPart.length <= 2) {
    return `${localPart.charAt(0)}***@${domain}`;
  }

  const firstTwo = localPart.substring(0, 2);
  return `${firstTwo}***@${domain}`;
}
