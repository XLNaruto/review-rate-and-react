import { useEffect, useState } from "react";

type RateLimitedProps = {
  // Seconds to wait before retrying (x-ratelimit-reset, default 60).
  retryAfter?: number;
};

const RateLimited = ({ retryAfter = 60 }: RateLimitedProps) => {
  const [seconds, setSeconds] = useState<number>(retryAfter);

  // Count the wait down to zero, then enable the retry button.
  useEffect(() => {
    setSeconds(retryAfter);
    if (retryAfter <= 0) return;

    const id = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  const waiting = seconds > 0;

  return (
    <div className="min-h-[85vh] w-full p-4 flex items-center justify-center">
      <div className="sm:w-[370px] mx-auto text-center">
        <div className="relative overflow-hidden rounded-[35px] p-8 mb-6 bg-gradient-to-br from-black via-[#1a1a1a] to-black text-white animate-fade-in-up">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-amber-500/20 blur-3xl"
          />

          <div className="relative">
            <div className="mx-auto mb-6 w-[112px] h-[112px] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center animate-pop">
              <div className="relative w-9 h-9 rounded-full bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.6)] flex items-center justify-center scale-[1.6]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-black"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
              </div>
            </div>

            <h1 className="text-[22px] font-bold mb-2 tracking-tight">
              Whoa, slow down a moment
            </h1>
            <p className="text-white/70 text-[14px] leading-relaxed max-w-[280px] mx-auto">
              You've made a lot of requests in a short time. Please wait a few
              seconds and try again.
            </p>

            {waiting && (
              <p className="mt-5 text-[13px] text-white/80">
                You can retry in{" "}
                <span className="font-bold text-amber-300">{seconds}s</span>
              </p>
            )}
          </div>
        </div>

        {!waiting && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="group w-full rounded-full bg-black py-5 text-sm font-medium text-white transition-all duration-300 hover:bg-brand active:scale-[0.98] animate-fade-in-up [animation-delay:120ms]"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 transition-transform duration-500 group-hover:rotate-[360deg]"
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              Try again
            </span>
          </button>
        )}

        <p className="text-muted text-[12px] mt-5 animate-fade-in [animation-delay:240ms]">
          This limit protects the service for everyone. Thanks for your patience.
        </p>
      </div>
    </div>
  );
};

export default RateLimited;
