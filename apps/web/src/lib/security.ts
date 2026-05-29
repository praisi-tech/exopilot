/**
 * security.ts — Exopilot OWASP Top 10 security utilities
 * Covers: XSS mitigation, input validation, CSRF token helpers,
 * client-side rate limiting, and SQL/NoSQL injection prevention.
 */

// ──────────────────────────────────────────────────────────────────────────────
// XSS PREVENTION — sanitize any string before rendering or storing
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Strips HTML tags and encodes dangerous characters.
 * Use before storing user input to Firestore or displaying untrusted content.
 */
export function sanitizeInput(value: string): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    // Strip any remaining HTML tags
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 1000); // max length cap
}

/**
 * Decode sanitized HTML entities back to plain text (for display comparison).
 */
export function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

/**
 * Sanitize a search query — removes regex metacharacters and excessive whitespace.
 * Prevents NoSQL injection via malformed query strings.
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") return "";
  return query
    .replace(/[<>"'&;\\{}()\[\]]/g, "") // strip injection-prone chars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100); // reasonable search length
}

// ──────────────────────────────────────────────────────────────────────────────
// INPUT VALIDATION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Validate email format (RFC 5322 simplified) + max length.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== "string") return { valid: false, error: "Email is required." };
  if (email.length > 254) return { valid: false, error: "Email is too long." };
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return { valid: false, error: "Please enter a valid email address." };
  return { valid: true };
}

export interface PasswordStrength {
  score: number; // 0-4
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  errors: string[];
}

/**
 * Validate and score password strength.
 * Returns score 0-4, label, color class, and list of unmet requirements.
 */
export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) errors.push("At least 8 characters");
  else score++;

  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  else score++;

  if (!/[0-9]/.test(password)) errors.push("One number");
  else score++;

  if (!/[^a-zA-Z0-9]/.test(password)) errors.push("One special character");
  else score++;

  const labels: PasswordStrength["label"][] = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-rose-500", "bg-amber-400", "bg-yellow-400", "bg-emerald-500"];

  return {
    score,
    label: labels[Math.max(0, score - 1)] ?? "Weak",
    color: colors[Math.max(0, score - 1)] ?? "bg-rose-500",
    errors,
  };
}

/**
 * Sanitize a text field for plain storage — strips null bytes and control chars.
 */
export function sanitizeTextField(value: string, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .trim()
    .slice(0, maxLength);
}

// ──────────────────────────────────────────────────────────────────────────────
// CSRF TOKEN (client-side, stored in sessionStorage)
// ──────────────────────────────────────────────────────────────────────────────

const CSRF_KEY = "exo_csrf_token";

/**
 * Generate and store a CSRF token for the session.
 * Call once on auth form mount.
 */
export function generateCSRFToken(): string {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  sessionStorage.setItem(CSRF_KEY, token);
  return token;
}

/**
 * Retrieve the stored CSRF token.
 */
export function getCSRFToken(): string {
  return sessionStorage.getItem(CSRF_KEY) ?? "";
}

/**
 * Validate that the provided token matches the stored one.
 */
export function validateCSRFToken(token: string): boolean {
  const stored = sessionStorage.getItem(CSRF_KEY);
  return !!stored && stored === token && stored.length === 64;
}

// ──────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE RATE LIMITER (login brute-force protection)
// 
// IMPORTANT: This client-side limiter is complemented by BACKEND RATE LIMITING.
// The Go API backend enforces strict rate limiting (10 requests per 60 seconds with
// 15-minute lockout) which CANNOT be bypassed by disabling localStorage.
// Always ensure both client and backend protections are active.
// ──────────────────────────────────────────────────────────────────────────────

const RATE_KEY = "exo_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface RateData {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export function recordLoginAttempt(): void {
  const raw = localStorage.getItem(RATE_KEY);
  const now = Date.now();
  let data: RateData = raw ? JSON.parse(raw) : { attempts: 0, firstAttemptAt: now };

  // Reset if lockout expired
  if (data.lockedUntil && now > data.lockedUntil) {
    data = { attempts: 0, firstAttemptAt: now };
  }

  data.attempts++;
  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_MS;
  }
  localStorage.setItem(RATE_KEY, JSON.stringify(data));
}

export function clearLoginAttempts(): void {
  localStorage.removeItem(RATE_KEY);
}

export interface RateLimitStatus {
  isLocked: boolean;
  attemptsLeft: number;
  lockedUntilMs?: number;
  /** Human-readable time remaining, e.g. "12 min 30 sec" */
  timeRemaining?: string;
}

export function checkRateLimit(): RateLimitStatus {
  const raw = localStorage.getItem(RATE_KEY);
  if (!raw) return { isLocked: false, attemptsLeft: MAX_ATTEMPTS };

  const data: RateData = JSON.parse(raw);
  const now = Date.now();

  if (data.lockedUntil && now < data.lockedUntil) {
    const remainMs = data.lockedUntil - now;
    const mins = Math.floor(remainMs / 60000);
    const secs = Math.floor((remainMs % 60000) / 1000);
    return {
      isLocked: true,
      attemptsLeft: 0,
      lockedUntilMs: data.lockedUntil,
      timeRemaining: `${mins}m ${secs}s`,
    };
  }

  // Reset stale data
  if (data.lockedUntil && now >= data.lockedUntil) {
    localStorage.removeItem(RATE_KEY);
    return { isLocked: false, attemptsLeft: MAX_ATTEMPTS };
  }

  return {
    isLocked: false,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - data.attempts),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// CONTENT SECURITY — prevent script injection in dynamic content
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Safely truncates and plain-text encodes a string for use inside HTML attributes.
 */
export function safeAttr(value: string, maxLen = 200): string {
  return sanitizeInput(value).slice(0, maxLen);
}

/**
 * Returns true if a URL is safe (http/https/mailto only, no javascript:).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ["http:", "https:", "mailto:"].includes(u.protocol);
  } catch {
    return false;
  }
}
