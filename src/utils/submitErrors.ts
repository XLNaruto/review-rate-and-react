import { toast } from "sonner";
import { classifySubmitError, type BlockedState } from "../api";

type Handlers = {
  // Switch the page to a state screen (QR gone / survey closed / not accepting).
  onBlocked?: (state: BlockedState) => void;
  // Re-fetch the scan response (fresh questions / reactions / prompts).
  onRefresh?: () => Promise<void>;
  // The picked reaction was turned off: clear it so the person picks again.
  onReactionUnavailable?: () => void;
};

// Shared handling for a failed POST /public/reviews that isn't an inline field
// error. Never clears the form: the answers stay so the person can retry.
export const handleSubmitError = async (response: any, h: Handlers) => {
  const action = classifySubmitError(response);
  switch (action.type) {
    case "blocked":
      h.onBlocked?.(action.state);
      return;
    case "reload":
      toast.error(action.message, {
        duration: Infinity,
        action: { label: "Reload", onClick: () => window.location.reload() },
      });
      return;
    case "refresh":
      await h.onRefresh?.();
      toast.info(action.message);
      return;
    case "reaction_unavailable":
      h.onReactionUnavailable?.();
      await h.onRefresh?.();
      toast.error(action.message);
      return;
    default:
      toast.error(action.message);
  }
};
