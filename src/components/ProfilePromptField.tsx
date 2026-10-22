import { forwardRef } from "react";
import SelectDropdown from "./SelectDropdown";
import type { ProfilePrompt } from "../api";

// Above this many options a prompt renders as a searchable dropdown instead of
// pills (e.g. a long list of supervisors).
const MAX_PILL_OPTIONS = 5;

type ProfilePromptFieldProps = {
  prompt: ProfilePrompt;
  // Selected option id, "" when unanswered.
  value: string;
  onChange: (optionId: string) => void;
  error?: string;
  idPrefix: string;
};

// One respondent-group question ("Department", "Shift", …): single-choice pills
// for short lists, a searchable select for long ones. The label is the field
// title, marked required the same way as the other prompts. The forwarded ref
// sits on the field's wrapper so the form can scroll to it and focus its first
// control on a validation error.
const ProfilePromptField = forwardRef<HTMLDivElement, ProfilePromptFieldProps>(
  ({ prompt, value, onChange, error, idPrefix }, ref) => {
    const required = prompt.mode === "required";
    const labelId = `${idPrefix}-profile-${prompt.field_id}-label`;
    const errorId = `${idPrefix}-profile-${prompt.field_id}-error`;
    const usePills = prompt.options.length <= MAX_PILL_OPTIONS;

    return (
      <div ref={ref} className="mb-5">
        <span
          id={labelId}
          className={`field-label block break-words ${required ? "required" : ""}`}
        >
          {prompt.label}
        </span>

        {usePills ? (
          <div
            role="radiogroup"
            aria-labelledby={labelId}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="mt-2 flex flex-wrap gap-2"
          >
            {prompt.options.map((opt) => {
              const checked = value === opt.id;
              return (
                <label key={opt.id} className="relative max-w-full">
                  {/* Native radio (visually hidden) gives Tab-to-group and
                      arrow-key selection; the span below is the pill. */}
                  <input
                    type="radio"
                    name={`${idPrefix}-profile-${prompt.field_id}`}
                    value={opt.id}
                    checked={checked}
                    onChange={() => onChange(opt.id)}
                    // A click on the already-selected pill doesn't fire
                    // onChange — use it to clear optional prompts.
                    onClick={() => {
                      if (checked && !required) onChange("");
                    }}
                    className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
                  />
                  <span
                    className={`flex min-h-[40px] items-center rounded-full border px-4 py-2 text-sm font-medium break-words cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 ${
                      checked
                        ? "bg-brand border-brand text-white"
                        : `bg-white text-option-text hover:border-brand hover:text-brand ${
                            error ? "border-red-500" : "border-border-soft"
                          }`
                    }`}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <SelectDropdown
            id={`${idPrefix}-profile-${prompt.field_id}`}
            value={value}
            onChange={onChange}
            options={prompt.options.map((o) => ({
              label: o.label,
              value: o.id,
            }))}
            placeholder="Select"
            searchable
            allowDeselect={!required}
            ariaLabelledBy={labelId}
            ariaRequired={required}
            error={!!error}
          />
        )}

        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

ProfilePromptField.displayName = "ProfilePromptField";

export default ProfilePromptField;
