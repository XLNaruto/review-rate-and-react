import type { Ref } from "react";
import ProfilePromptField from "./ProfilePromptField";
import type { AboutOption } from "../api";
import type { VisitBudgetMode } from "../utils/visitBudget";

type VisitBudgetFieldsProps = {
  idPrefix: string;
  visitTypeMode: VisitBudgetMode;
  budgetMode: VisitBudgetMode;
  visitTypeOptions: AboutOption[];
  budgetOptions: AboutOption[];
  visitType: string;
  budgetBand: string;
  onVisitTypeChange: (value: string) => void;
  onBudgetBandChange: (value: string) => void;
  visitTypeError?: string;
  budgetError?: string;
  // Wrapper refs, so the form can scroll to / focus a question on an error.
  visitTypeRef?: Ref<HTMLDivElement>;
  budgetRef?: Ref<HTMLDivElement>;
};

const toPrompt = (
  fieldId: string,
  label: string,
  mode: "optional" | "required",
  options: AboutOption[],
) => ({
  field_id: fieldId,
  label,
  mode,
  options: options.map((o) => ({ id: o.value, label: o.label })),
});

// "How often do you visit?" and "Household income": one row of single-choice
// chips each, with labels and order straight from the API. Optional questions
// can be cleared by tapping the selected chip again; required ones get a "*"
// and can't be cleared ("Prefer not to say" is an answer). The "always
// skippable" note only shows when neither question is required.
const VisitBudgetFields = ({
  idPrefix,
  visitTypeMode,
  budgetMode,
  visitTypeOptions,
  budgetOptions,
  visitType,
  budgetBand,
  onVisitTypeChange,
  onBudgetBandChange,
  visitTypeError,
  budgetError,
  visitTypeRef,
  budgetRef,
}: VisitBudgetFieldsProps) => {
  if (visitTypeMode === "off" && budgetMode === "off") return null;
  const anyRequired =
    visitTypeMode === "required" || budgetMode === "required";
  return (
    <div className="mb-5">
      {visitTypeMode !== "off" && (
        <ProfilePromptField
          ref={visitTypeRef}
          idPrefix={idPrefix}
          alwaysPills
          prompt={toPrompt(
            "visit_type",
            "How often do you visit?",
            visitTypeMode,
            visitTypeOptions,
          )}
          value={visitType}
          onChange={onVisitTypeChange}
          error={visitTypeError}
        />
      )}
      {budgetMode !== "off" && (
        <ProfilePromptField
          ref={budgetRef}
          idPrefix={idPrefix}
          alwaysPills
          prompt={toPrompt(
            "budget_band",
            "Household income",
            budgetMode,
            budgetOptions,
          )}
          value={budgetBand}
          onChange={onBudgetBandChange}
          error={budgetError}
        />
      )}
      {!anyRequired && (
        <p className="-mt-2 text-[12px] text-placeholder">
          Optional and anonymous. Always skippable.
        </p>
      )}
    </div>
  );
};

export default VisitBudgetFields;
