import { useEffect, useState } from "react";

// A single global signal for "the API told us 429 (Too Many Requests)".
// ApiHelper emits it from any method; the App-level <RateLimitGate /> listens
// and shows a friendly full-page message until the user retries.

const EVENT = "api:rate-limited";

// Fallback wait (seconds) when the server doesn't tell us when to retry.
const DEFAULT_RETRY_AFTER = 60;

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
  window.dispatchEvent(
    new CustomEvent<RateLimitState>(EVENT, {
      detail: { active: true, retryAfter: parseRetryAfter(resetHeader) },
    })
  );
};

// React hook: returns the current rate-limit state for the App-level gate.
export const useRateLimited = (): RateLimitState => {
  const [state, setState] = useState<RateLimitState>({
    active: false,
    retryAfter: DEFAULT_RETRY_AFTER,
  });

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
