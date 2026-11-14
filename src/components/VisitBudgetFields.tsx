import ProfilePromptField from "./ProfilePromptField";
import type { AboutOption } from "../api";

type VisitBudgetFieldsProps = {
  idPrefix: string;
  // Each question shows only when its mode is "optional" and the API sent
  // answers for it. These two are never required.
  showVisitType: boolean;
  showBudget: boolean;
  visitTypeOptions: AboutOption[];
  budgetOptions: AboutOption[];
  visitType: string;
  budgetBand: string;
  onVisitTypeChange: (value: string) => void;
  onBudgetBandChange: (value: string) => void;
};

const toPrompt = (fieldId: string, label: string, options: AboutOption[]) => ({
  field_id: fieldId,
  label,
  mode: "optional" as const,
  options: options.map((o) => ({ id: o.value, label: o.label })),
});

// "How often do you visit?" and "Household income": one row of single-choice
// chips each (tap the selected chip again to clear it), with labels and order
// straight from the API, followed by the "always skippable" note.
const VisitBudgetFields = ({
  idPrefix,
  showVisitType,
  showBudget,
  visitTypeOptions,
  budgetOptions,
  visitType,
  budgetBand,
  onVisitTypeChange,
  onBudgetBandChange,
}: VisitBudgetFieldsProps) => {
  if (!showVisitType && !showBudget) return null;
  return (
    <div className="mb-5">
      {showVisitType && (
        <ProfilePromptField
          idPrefix={idPrefix}
          alwaysPills
          prompt={toPrompt(
            "visit_type",
            "How often do you visit?",
            visitTypeOptions,
          )}
          value={visitType}
          onChange={onVisitTypeChange}
        />
      )}
      {showBudget && (
        <ProfilePromptField
          idPrefix={idPrefix}
          alwaysPills
          prompt={toPrompt("budget_band", "Household income", budgetOptions)}
          value={budgetBand}
          onChange={onBudgetBandChange}
        />
      )}
      <p className="-mt-2 text-[12px] text-placeholder">
        Optional and anonymous. Always skippable.
      </p>
    </div>
  );
};

export default VisitBudgetFields;
