import RateLimited from "./RateLimited";
import { useRateLimited } from "../utils/RateLimit";

// Listens for the global 429 signal (emitted by ApiHelper) and, once tripped,
// replaces the whole page with a friendly "too many requests" message.
const RateLimitGate = () => {
  const { active, retryAfter } = useRateLimited();
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      <RateLimited key={retryAfter} retryAfter={retryAfter} />
    </div>
  );
};

export default RateLimitGate;
