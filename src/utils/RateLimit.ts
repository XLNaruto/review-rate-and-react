import { useEffect, useState } from "react";

// A single global signal for "the API told us 429 (Too Many Requests)".
// ApiHelper emits it from any method; the App-level <RateLimitGate /> listens
// and shows a friendly full-page message until the user retries.

const EVENT = "api:rate-limited";

// Fallback wait (seconds) when the server doesn't tell us when to retry.
const DEFAULT_RETRY_AFTER = 60;

// We persist the absolute moment the limit lifts (epoch ms) in sessionStorage.
// That lets a refresh *inside* the window render the gate on the very first
// paint — without it, the page would flash the cached details for a beat
// before the 429 came back and flipped the gate on.
const DEADLINE_KEY = "rr_rate_limit_until";

// Seconds left on a persisted rate-limit window, or 0 if none/expired.
const remainingSeconds = (): number => {
  try {
    const raw = window.sessionStorage.getItem(DEADLINE_KEY);
    if (!raw) return 0;
    const deadline = Number(raw);
    if (!Number.isFinite(deadline)) return 0;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  } catch {
    return 0;
  }
};

// Synchronous check for callers that want to skip a request that's just going
// to 429 again (e.g. the scan-qr fetch on a refresh during the window).
export const isRateLimited = (): boolean => remainingSeconds() > 0;

export type RateLimitState = {
  active: boolean;
  // Seconds to wait before retrying. Taken from x-ratelimit-reset (seconds
  // until the limit resets); falls back to DEFAULT_RETRY_AFTER.
  retryAfter: number;
};

// Parse the reset header: seconds-until-reset, an epoch timestamp, or an
// HTTP date. Returns the default when the value is missing or unrecognized.
const parseRetryAfter = (value: unknown): number => {
  if (value == null) return DEFAULT_RETRY_AFTER;
  const raw = String(value).trim();
  if (!raw) return DEFAULT_RETRY_AFTER;

  const num = Number(raw);
  if (Number.isFinite(num)) {
    // Large values look like an epoch timestamp (seconds since 1970), so
    // convert them to a relative wait; small values are already a duration.
    const nowSec = Date.now() / 1000;
    const seconds = num > nowSec ? num - nowSec : num;
    return Math.max(0, Math.round(seconds));
  }

  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.round((date - Date.now()) / 1000));
  }
  return DEFAULT_RETRY_AFTER;
};

export const emitRateLimited = (resetHeader?: unknown) => {
  if (typeof window === "undefined") return;
  const retryAfter = parseRetryAfter(resetHeader);
  try {
    window.sessionStorage.setItem(
      DEADLINE_KEY,
      String(Date.now() + retryAfter * 1000)
    );
  } catch {
    /* storage unavailable — the gate still works for this page load */
  }
  window.dispatchEvent(
    new CustomEvent<RateLimitState>(EVENT, {
      detail: { active: true, retryAfter },
    })
  );
};

// Initial gate state, read synchronously so a refresh inside an active window
// shows the rate-limit page immediately instead of flashing the cached page.
const initialState = (): RateLimitState => {
  const remaining = remainingSeconds();
  return remaining > 0
    ? { active: true, retryAfter: remaining }
    : { active: false, retryAfter: DEFAULT_RETRY_AFTER };
};

// React hook: returns the current rate-limit state for the App-level gate.
export const useRateLimited = (): RateLimitState => {
  const [state, setState] = useState<RateLimitState>(initialState);

  useEffect(() => {
    const onLimit = (e: Event) => {
      const detail = (e as CustomEvent<RateLimitState>).detail;
      setState({
        active: true,
        retryAfter: detail?.retryAfter ?? DEFAULT_RETRY_AFTER,
      });
    };
    window.addEventListener(EVENT, onLimit);
    return () => window.removeEventListener(EVENT, onLimit);
  }, []);

  return state;
};
