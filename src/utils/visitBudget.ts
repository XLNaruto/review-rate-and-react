import type { AboutOption } from "../api";

// "off" hides the question; the parent passes "off" when the API sent no
// answers to pick from.
export type VisitBudgetMode = "off" | "optional" | "required";

// Normalises `user_info_modes.visit_type_mode` / `budget_mode` (already final
// from the API) — anything unknown or missing counts as "off". A question with
// no answers to offer is hidden too.
export const visitBudgetMode = (
  mode: unknown,
  options: AboutOption[],
): VisitBudgetMode =>
  options.length > 0 && (mode === "optional" || mode === "required")
    ? mode
    : "off";

export const CHOOSE_OPTION_ERROR = "Please choose an option";
