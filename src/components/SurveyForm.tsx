import { useRef, useState } from "react";
import { toast } from "sonner";
import SurveyReactionRow, { type SurveyRateReactValue } from "./SurveyReactionRow";
import SurveySummary from "./SurveySummary";
import SelectDropdown from "./SelectDropdown";
import EthnicityRaceFields from "./EthnicityRaceFields";
import ProfilePromptField from "./ProfilePromptField";
import {
  submitReview,
  buildProfilePayload,
  buildProfileSummary,
  REVIEW_PROFILE_OPTION_INVALID,
  REVIEW_PROFILE_REQUIRED,
  type ProfilePrompt,
  type SurveyAnswer,
  type ScanQrReaction,
} from "../api";
import { saveSubmission } from "../utils/SubmissionStore";
import { useDemographicsData } from "../hooks/useDemographicsData";
import {
  buildRaceAndEthnicityPayload,
  emptyDemographics,
  validateRequiredDemographics,
  type DemographicsValue,
  type RaceAndEthnicityPayload,
} from "../data/demographics";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
  { label: "Other", value: "other" },
];

type FieldMode = "off" | "optional" | "required";

type UserInfoModes = {
  email_mode?: FieldMode | string;
  age_mode?: FieldMode | string;
  gender_mode?: FieldMode | string;
  postal_code_mode?: FieldMode | string;
  race_mode?: FieldMode | string;
  description_mode?: FieldMode | string;
};

export type SurveyQuestion = {
  id: string;
  position?: number;
  text: string;
  type: "reaction" | "rating_1_5" | "multiple_choice" | string;
  options?: string[] | null;
};

type SurveySubmission = {
  answers: Record<string, any>;
  rrAnswers: Record<string, SurveyRateReactValue>;
  email: string;
  age: string;
  gender: string;
  postalCode: string;
  description: string;
  demographics?: DemographicsValue;
  // Resolved names captured at submit time so the restored summary renders
  // straight from local data — no id→list lookup that could go stale.
  raceAndEthnicity?: RaceAndEthnicityPayload;
  // Respondent-group answers (field_id → option_id) and their resolved labels.
  profile?: Record<string, string>;
  profileAnswers?: { label: string; value: string }[];
};

// Error key for a respondent-group prompt in the shared `errors` map.
const profileKey = (fieldId: string) => `profile:${fieldId}`;

type SurveyFormProps = {
  onSubmitted?: () => void;
  surveyId: string;
  slug: string;
  title?: string;
  initialSubmission?: SurveySubmission | null;
  questions: SurveyQuestion[];
  userInfoModes?: UserInfoModes;
  reactions?: ScanQrReaction[];
  /** Respondent-group questions, in display order. */
  profilePrompts?: ProfilePrompt[];
  /** Re-fetches the scan response (fresh profile prompts). */
  onRefreshPrompts?: () => Promise<void>;
};

const emptyRR: SurveyRateReactValue = { reaction: null, rating: null };

const msSince = (start: number) => Date.now() - start;

const Checkbox = ({ checked }: { checked: boolean }) => (
  <span
    className={`flex items-center justify-center w-6 h-6 rounded-md border-2 bg-white transition-colors ${
      checked ? "border-brand" : "border-option-text"
    }`}
  >
    {checked && (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-brand">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </span>
);

const SurveyForm = ({
  onSubmitted,
  surveyId,
  slug,
  title,
  initialSubmission,
  questions,
  userInfoModes,
  reactions = [],
  profilePrompts = [],
  onRefreshPrompts,
}: SurveyFormProps) => {
  const emailMode = (userInfoModes?.email_mode as FieldMode) ?? "off";
  const ageMode = (userInfoModes?.age_mode as FieldMode) ?? "off";
  const genderMode = (userInfoModes?.gender_mode as FieldMode) ?? "off";
  // Postal code and ethnicity/race were always shown before these modes
  // existed, so default to "optional" (visible, not enforced) when absent.
  const postalMode = (userInfoModes?.postal_code_mode as FieldMode) ?? "optional";
  const raceMode = (userInfoModes?.race_mode as FieldMode) ?? "optional";
  const descriptionMode =
    (userInfoModes?.description_mode as FieldMode) ?? "off";
  // Ethnicity/race reference data — used to resolve ids→names for the payload.
  const { ethnicities, races } = useDemographicsData();

  const sorted = [...(questions ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const [answers, setAnswers] = useState<Record<string, any>>(
    initialSubmission?.answers ?? {}
  );
  const [rrAnswers, setRrAnswers] = useState<Record<string, SurveyRateReactValue>>(
    initialSubmission?.rrAnswers ?? {}
  );
  const [email, setEmail] = useState(initialSubmission?.email ?? "");
  const [age, setAge] = useState(initialSubmission?.age ?? "");
  const [gender, setGender] = useState(initialSubmission?.gender ?? "");
  const [postalCode, setPostalCode] = useState(
    initialSubmission?.postalCode ?? ""
  );
  const [description, setDescription] = useState(
    initialSubmission?.description ?? ""
  );
  const [demographics, setDemographics] = useState<DemographicsValue>(
    initialSubmission?.demographics ?? emptyDemographics
  );
  const [profile, setProfile] = useState<Record<string, string>>(
    initialSubmission?.profile ?? {}
  );
  const [consent, setConsent] = useState(!!initialSubmission);
  const [submitted, setSubmitted] = useState(!!initialSubmission);
  const [submitting, setSubmitting] = useState(false);

  // Start of the fill-in, for `completion_ms` on submit.
  const [startedAt] = useState(() => Date.now());
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLButtonElement>(null);
  const postalCodeRef = useRef<HTMLInputElement>(null);
  const raceRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const consentRef = useRef<HTMLDivElement>(null);
  const profileRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setAnswer = (id: string, v: any) => {
    clearError(id);
    setAnswers((prev) => ({ ...prev, [id]: v }));
  };

  const setRr = (id: string, v: SurveyRateReactValue) => {
    // Only clear once the rate is actually complete (both reaction AND rating);
    // a reaction-only selection is still pending, so keep the error.
    if (v.reaction && v.rating != null) clearError(id);
    setRrAnswers((prev) => ({ ...prev, [id]: v }));
  };

  const toggleChoice = (id: string, opt: string) => {
    clearError(id);
    setAnswers((prev) => {
      const cur: string[] = Array.isArray(prev[id]) ? prev[id] : [];
      return {
        ...prev,
        [id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt],
      };
    });
  };

  const setProfileAnswer = (fieldId: string, optionId: string) => {
    clearError(profileKey(fieldId));
    setProfile((prev) => {
      const next = { ...prev };
      if (optionId) next[fieldId] = optionId;
      else delete next[fieldId];
      return next;
    });
  };

  const focusEl = (el: HTMLElement | null) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      if (typeof (el as HTMLInputElement).focus === "function") {
        (el as HTMLInputElement).focus({ preventScroll: true });
      }
    }, 320);
  };

  const buildAnswer = (q: SurveyQuestion): SurveyAnswer["answer"] => {
    if (q.type === "open_text") {
      const a = answers[q.id];
      return { type: "open_text", text: typeof a === "string" ? a.trim() : "" };
    }
    if (q.type === "multiple_choice") {
      const a = answers[q.id];
      return { type: "multiple_choice", selected: Array.isArray(a) ? a : [] };
    }
    if (q.type === "rating_1_5") {
      return { type: "rating_1_5", value: rrAnswers[q.id]?.rating ?? null };
    }
    // reaction (and any unknown rate-react type)
    return { type: "reaction", value: rrAnswers[q.id]?.reaction ?? null };
  };

  const validate = () => {
    const e: Record<string, string> = {};

    for (const q of sorted) {
      const rr = rrAnswers[q.id];
      const rateOk = !!(rr && rr.reaction && rr.rating != null);
      if (q.type === "multiple_choice") {
        const a = answers[q.id];
        if (!(Array.isArray(a) && a.length > 0))
          e[q.id] = "Please complete this question.";
      } else if (q.type === "open_text") {
        const a = answers[q.id];
        if (!(typeof a === "string" && a.trim() !== ""))
          e[q.id] = "Please complete this question.";
      } else {
        // reaction / rating_1_5 — the rate row is the answer
        if (!rateOk) e[q.id] = "Please rate your experience.";
      }
    }

    for (const p of profilePrompts) {
      if (p.mode === "required" && !profile[p.field_id])
        e[profileKey(p.field_id)] = `${p.label} is required.`;
    }

    if (emailMode === "required" && email.trim() === "")
      e.email = "Email is required.";
    else if (
      emailMode !== "off" &&
      email.trim() !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      e.email = "Enter a valid email address.";

    if (ageMode === "required" && age.trim() === "")
      e.age = "Age is required.";
    else if (ageMode !== "off" && age.trim() !== "") {
      const n = Number(age);
      if (!/^\d+$/.test(age) || !Number.isInteger(n) || n < 1 || n > 120)
        e.age = "Enter a valid age.";
    }

    if (genderMode === "required" && gender.trim() === "")
      e.gender = "Gender is required.";

    // Postal code: required when the mode says so; otherwise, when filled, it
    // must be 3–12 characters of letters, digits, dashes or spaces (postal-code
    // formats across countries, e.g. UK "SW1A 1AA" / Canada "K1A-0B1").
    if (postalMode === "required" && postalCode.trim() === "")
      e.postalCode = "Postal code is required.";
    else if (
      postalMode !== "off" &&
      postalCode.trim() &&
      !/^[A-Za-z0-9\- ]{3,12}$/.test(postalCode.trim())
    )
      e.postalCode = "Enter a valid postal code (3–12 characters).";

    // Ethnicity/race: when required, every level that has options must be
    // filled — ethnicity (+ its sub-ethnicities), race(s) (+ their sub-races).
    if (raceMode === "required") {
      const raceErr = validateRequiredDemographics(
        demographics,
        ethnicities,
        races
      );
      if (raceErr) e.race = raceErr.message;
    }

    if (descriptionMode === "required" && !description.trim())
      e.description = "Description is required.";

    if (!consent) e.consent = "Please acknowledge and consent to continue.";

    return e;
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const refFor = (key: string): HTMLElement | null => {
      if (key === "email") return emailRef.current;
      if (key === "age") return ageRef.current;
      if (key === "gender") return genderRef.current;
      if (key === "postalCode") return postalCodeRef.current;
      if (key === "race") return raceRef.current;
      if (key === "description") return descriptionRef.current;
      if (key === "consent") return consentRef.current;
      // A respondent-group prompt's ref is its wrapper — focus the selected
      // pill, else its first pill / the dropdown button.
      if (key.startsWith("profile:")) {
        const wrap = profileRefs.current[key.slice("profile:".length)];
        return (
          wrap?.querySelector<HTMLElement>("input:checked, input, button") ??
          wrap ??
          null
        );
      }
      return questionRefs.current[key] ?? null;
    };
    const order = [
      ...sorted.map((q) => q.id),
      ...profilePrompts.map((p) => profileKey(p.field_id)),
      "email",
      "age",
      "gender",
      "postalCode",
      "race",
      "description",
      "consent",
    ];
    const first = order.find((k) => errs[k]);
    if (first) focusEl(refFor(first));
  };

  // Server-side safety net for the respondent-group prompts. Returns true when
  // the response was one of the profile errors and has been handled inline.
  const handleProfileError = async (response: any) => {
    const code = response?.data?.error;
    const fieldId: string | undefined = response?.data?.details?.field_id;
    if (
      !fieldId ||
      (code !== REVIEW_PROFILE_REQUIRED &&
        code !== REVIEW_PROFILE_OPTION_INVALID)
    )
      return false;

    const label = profilePrompts.find((p) => p.field_id === fieldId)?.label;
    let message: string =
      response?.data?.message ??
      (label ? `${label} is required.` : "This field is required.");
    if (code === REVIEW_PROFILE_OPTION_INVALID) {
      // The option was removed by the business: reload the prompts, reset this
      // one and ask again.
      setProfileAnswer(fieldId, "");
      await onRefreshPrompts?.();
      message = "That option is no longer available. Please choose again.";
    }
    const errs = { [profileKey(fieldId)]: message };
    setErrors(errs);
    focusFirstError(errs);
    return true;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError(errs);
      return;
    }

    if (submitting) return;

    // Only reaction-style questions carry top-level rating/reaction.
    const builtAnswers: SurveyAnswer[] = sorted.map((q) =>
      q.type === "open_text" || q.type === "multiple_choice"
        ? { survey_question_id: q.id, answer: buildAnswer(q) }
        : {
            survey_question_id: q.id,
            rating: rrAnswers[q.id]?.rating ?? null,
            reaction: rrAnswers[q.id]?.reaction ?? null,
            answer: buildAnswer(q),
          }
    );

    const trimmedDescription = description.trim();
    const profilePayload = buildProfilePayload(profilePrompts, profile);

    setSubmitting(true);
    const response: any = await submitReview({
      kind: "survey",
      survey_id: surveyId,
      completion_ms: msSince(startedAt),
      answers: builtAnswers,
      ...(descriptionMode !== "off" && trimmedDescription
        ? { description: trimmedDescription }
        : {}),
      ...(emailMode !== "off" && email.trim() ? { email: email.trim() } : {}),
      ...(genderMode !== "off" && gender.trim() ? { gender: gender.trim() } : {}),
      ...(ageMode !== "off" && age.trim() ? { age: Number(age) } : {}),
      ...(postalMode !== "off" && postalCode.trim()
        ? { postal_code: postalCode.trim() }
        : {}),
      ...(raceMode !== "off" &&
      buildRaceAndEthnicityPayload(demographics, ethnicities, races)
        ? {
            race_and_ethnicity: buildRaceAndEthnicityPayload(
              demographics,
              ethnicities,
              races
            ),
          }
        : {}),
      ...(profilePayload.length ? { profile: profilePayload } : {}),
    });
    setSubmitting(false);

    if (await handleProfileError(response)) return;

    if (!["200", "201"].includes(String(response?.status))) {
      toast.error(
        response?.data?.message ?? "Something went wrong. Please try again."
      );
      return;
    }

    await saveSubmission(slug, "survey", {
      answers,
      rrAnswers,
      email,
      age,
      gender,
      postalCode,
      description,
      demographics,
      // Persist resolved names too, so the restored summary needs no lookup.
      raceAndEthnicity: buildRaceAndEthnicityPayload(
        demographics,
        ethnicities,
        races
      ),
      profile,
      profileAnswers: buildProfileSummary(profilePrompts, profile),
    });

    setSubmitted(true);
    onSubmitted?.();
  };

  if (submitted) {
    return (
      <SurveySummary
        questions={sorted}
        answers={answers}
        rrAnswers={rrAnswers}
        reactions={reactions}
        email={emailMode !== "off" ? email : ""}
        age={ageMode !== "off" ? age : ""}
        gender={genderMode !== "off" ? gender : ""}
        postalCode={postalMode !== "off" ? postalCode : ""}
        description={descriptionMode !== "off" ? description : ""}
        profileAnswers={
          initialSubmission?.profileAnswers ??
          buildProfileSummary(profilePrompts, profile)
        }
        raceAndEthnicity={
          raceMode !== "off"
            ? (initialSubmission?.raceAndEthnicity ??
              buildRaceAndEthnicityPayload(demographics, ethnicities, races))
            : undefined
        }
      />
    );
  }

  return (
    <div className="animate-fade-in-up [animation-delay:320ms]">
      <h1 className="text-[20px] font-bold mb-4">
        {title?.trim() || "Help us personalize your experience"}
      </h1>

      {sorted.map((q, idx) => (
        <div
          key={q.id}
          ref={(el) => {
            questionRefs.current[q.id] = el;
          }}
          className={`question-card mb-4 ${
            errors[q.id] ? "border border-red-500" : ""
          }`}
        >
          <p className="font-bold text-[14px] mb-2">Question {idx + 1}</p>
          <p className="text-placeholder text-[14px] mb-4">
            {q.text}
            <span className="text-red-500 ml-0.5">*</span>
          </p>
          {errors[q.id] &&
            q.type !== "reaction" &&
            q.type !== "rating_1_5" && (
              <p className="-mt-2 mb-4 text-xs text-red-500">{errors[q.id]}</p>
            )}

          {(q.type === "reaction" || q.type === "rating_1_5") && (
            <>
              <SurveyReactionRow
                value={rrAnswers[q.id] ?? emptyRR}
                onChange={(v) => setRr(q.id, v)}
                reactions={reactions}
              />
              {errors[q.id] && (
                <p className="mt-3 text-xs text-red-500">{errors[q.id]}</p>
              )}
            </>
          )}

          {q.type === "multiple_choice" && (
            <div className="space-y-2.5">
              {(q.options ?? []).map((opt) => {
                const cur: string[] = Array.isArray(answers[q.id])
                  ? answers[q.id]
                  : [];
                const checked = cur.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleChoice(q.id, opt)}
                    className={`w-full flex items-center justify-between rounded-full bg-white px-4 py-3 cursor-pointer transition-colors ${
                      checked ? "text-brand" : "text-option-text"
                    } border border-option-border`}
                  >
                    <span className="text-[14px] font-medium">{opt}</span>
                    <Checkbox checked={checked} />
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "open_text" && (
            <textarea
              placeholder="Write…"
              value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              className="nice-scrollbar w-full rounded-2xl bg-white border border-option-border px-4 py-3 text-sm placeholder:text-option-text outline-none resize-none h-24 transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          )}
        </div>
      ))}

      {profilePrompts.length > 0 && (
        <div className="mt-6">
          {profilePrompts.map((p) => (
            <ProfilePromptField
              key={p.field_id}
              ref={(el) => {
                profileRefs.current[p.field_id] = el;
              }}
              idPrefix="survey"
              prompt={p}
              value={profile[p.field_id] ?? ""}
              onChange={(v) => setProfileAnswer(p.field_id, v)}
              error={errors[profileKey(p.field_id)]}
            />
          ))}
        </div>
      )}

      {genderMode !== "off" && (
        <div className={`mb-5 ${profilePrompts.length > 0 ? "" : "mt-6"}`}>
          <label
            className={`field-label ${genderMode === "required" ? "required" : ""}`}
          >
            Enter Your Gender
          </label>
          <SelectDropdown
            ref={genderRef}
            id="survey-gender"
            value={gender}
            onChange={(v) => {
              clearError("gender");
              setGender(v);
            }}
            options={GENDER_OPTIONS}
            placeholder="Select your gender"
            error={!!errors.gender}
          />
          {errors.gender && (
            <p className="mt-1.5 text-xs text-red-500">{errors.gender}</p>
          )}
        </div>
      )}

      {postalMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${postalMode === "required" ? "required" : ""}`}
            htmlFor="survey-postal-code"
          >
            Postal Code
          </label>
          <input
            ref={postalCodeRef}
            id="survey-postal-code"
            type="text"
            maxLength={12}
            placeholder="e.g. 380015 or SW1A 1AA"
            value={postalCode}
            onChange={(e) => {
              clearError("postalCode");
              setPostalCode(
                e.target.value.replace(/[^A-Za-z0-9\- ]/g, "").slice(0, 12)
              );
            }}
            className={`field-input ${errors.postalCode ? "border-red-500" : ""}`}
          />
          {errors.postalCode && (
            <p className="mt-1.5 text-xs text-red-500">{errors.postalCode}</p>
          )}
        </div>
      )}

      {raceMode !== "off" && (
        <div ref={raceRef}>
          <EthnicityRaceFields
            idPrefix="survey"
            required={raceMode === "required"}
            error={errors.race}
            value={demographics}
            onChange={(v) => {
              clearError("race");
              setDemographics(v);
            }}
          />
        </div>
      )}

      {emailMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${emailMode === "required" ? "required" : ""}`}
            htmlFor="survey-email"
          >
            Enter Your Email
          </label>
          <input
            ref={emailRef}
            id="survey-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              clearError("email");
              setEmail(e.target.value);
            }}
            className={`field-input ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
          )}
        </div>
      )}

      {ageMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${ageMode === "required" ? "required" : ""}`}
            htmlFor="survey-age"
          >
            Enter Your Age
          </label>
          <input
            ref={ageRef}
            id="survey-age"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            placeholder="e.g. 28"
            value={age}
            onChange={(e) => {
              clearError("age");
              setAge(e.target.value.replace(/\D/g, "").slice(0, 3));
            }}
            className={`field-input ${errors.age ? "border-red-500" : ""}`}
          />
          {errors.age && (
            <p className="mt-1.5 text-xs text-red-500">{errors.age}</p>
          )}
        </div>
      )}

      {descriptionMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${descriptionMode === "required" ? "required" : ""}`}
            htmlFor="survey-desc"
          >
            Description
          </label>
          <textarea
            ref={descriptionRef}
            id="survey-desc"
            placeholder="enter description"
            value={description}
            onChange={(e) => {
              clearError("description");
              setDescription(e.target.value);
            }}
            className={`field-textarea nice-scrollbar ${errors.description ? "border-red-500" : ""}`}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>
          )}
        </div>
      )}

      <div className="mb-5">
        <div
          ref={consentRef}
          onClick={() => {
            clearError("consent");
            setConsent((v) => !v);
          }}
          className="flex items-start gap-3 cursor-pointer rounded-2xl p-1"
        >
          <input
            id="survey-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              clearError("consent");
              setConsent(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`mt-0.5 h-5 w-5 shrink-0 accent-black cursor-pointer rounded ${
              errors.consent ? "border border-red-500" : ""
            }`}
          />
          <label htmlFor="survey-consent" className="text-[13px] leading-snug text-placeholder cursor-pointer">
            I acknowledge the sharing of my personal information and consent to its
            collection, use, and processing for the intended purposes.
            <span className="text-red-500 ml-0.5">*</span>
          </label>
        </div>
        {errors.consent && (
          <p className="mt-1.5 text-xs text-red-500">{errors.consent}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-full bg-black py-5 text-sm font-medium text-white hover:opacity-90 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </div>
  );
};

export default SurveyForm;
