import { useEffect, useState } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

type Mode = "offline" | "slow" | "back-online" | null;

const BACK_ONLINE_MS = 2200;

const WifiOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
    <path
      d="M3 3l18 18M9.5 16.5a3.5 3.5 0 015 0M5.5 12.5a9 9 0 0110.5-1.6M2 8.5a14 14 0 014.5-2.7M22 8.5a14 14 0 00-9-3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
);

const SlowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
    <path
      d="M2 12.5a14 14 0 0120 0M5.5 16a9 9 0 0113 0M9 19.5a4.5 4.5 0 016 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConnectionBanner = () => {
  const { online, slow } = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleOnline = () => {
      setShowBackOnline(true);
      timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
    };
    const handleOffline = () => {
      setShowBackOnline(false);
      if (timer) clearTimeout(timer);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const mode: Mode = !online
    ? "offline"
    : showBackOnline
      ? "back-online"
      : slow
        ? "slow"
        : null;

  if (!mode) return null;

  const config = {
    offline: {
      bg: "bg-black/90",
      text: "text-white",
      ring: "ring-white/10",
      label: "No internet connection",
      sub: "We'll save your draft until you're back",
      Icon: WifiOffIcon,
      pulse: true,
    },
    slow: {
      bg: "bg-sky-600/95",
      text: "text-white",
      ring: "ring-sky-200/30",
      label: "Slow connection",
      sub: "Loading may take a moment",
      Icon: SlowIcon,
      pulse: true,
    },
    "back-online": {
      bg: "bg-success/95",
      text: "text-white",
      ring: "ring-success-soft/30",
      label: "Back online",
      sub: "You're reconnected",
      Icon: CheckIcon,
      pulse: false,
    },
  }[mode];

  const { Icon } = config;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-90 pointer-events-none"
    >
      <div
        className={`pointer-events-auto ${config.bg} ${config.text} backdrop-blur-md ring-1 ${config.ring} rounded-full pl-4 pr-5 py-3 shadow-lg shadow-black/20 flex items-center gap-3 animate-fade-in-up`}
      >
        <span
          className={`relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 ${
            config.pulse ? "before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:animate-ping" : ""
          }`}
        >
          <Icon />
        </span>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[13px] font-semibold truncate">{config.label}</p>
          <p className="text-[11px] opacity-75 truncate">{config.sub}</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionBanner;
