import { useRef, useState } from "react";
import SurveyReactionRow, { type SurveyRateReactValue } from "./SurveyReactionRow";
import SurveySummary from "./SurveySummary";
import SelectDropdown from "./SelectDropdown";
import EthnicityRaceFields from "./EthnicityRaceFields";
import ProfilePromptField from "./ProfilePromptField";
import AboutYouSection from "./AboutYouSection";
import {
  submitReview,
  buildProfilePayload,
  buildProfileSummary,
  ethnicityFromPicker,
  PII_FIELD_ERROR_KEYS,
  REVIEW_ANSWER_REACTION_REQUIRED,
  REVIEW_DESCRIPTION_REQUIRED,
  REVIEW_PII_REQUIRED,
  REVIEW_PROFILE_OPTION_INVALID,
  REVIEW_PROFILE_REQUIRED,
  type AboutYou,
  type BlockedState,
  type EthnicityOption,
  type GenderOption,
  type ProfilePrompt,
  type SurveyAnswer,
  type ScanQrReaction,
} from "../api";
import { saveSubmission } from "../utils/SubmissionStore";
import { handleSubmitError } from "../utils/submitErrors";
import { useDemographicsData } from "../hooks/useDemographicsData";
import {
  buildRaceAndEthnicityPayload,
  emptyDemographics,
  validateRequiredDemographics,
  type DemographicsValue,
  type RaceAndEthnicityPayload,
} from "../data/demographics";

// Server limits (spec §3.4 / §4.1).
const TEXT_MAX = 2000;
const EMAIL_MAX = 254;
// completion_ms is accepted in 0 – 86,400,000 (one day).
const COMPLETION_MS_MAX = 86_400_000;

type FieldMode = "off" | "optional" | "required";

type UserInfoModes = {
  email_mode?: FieldMode | string;
  age_mode?: FieldMode | string;
  gender_mode?: FieldMode | string;
  postal_code_mode?: FieldMode | string;
  ethnicity_mode?: FieldMode | string;
  race_mode?: FieldMode | string;
  description_mode?: FieldMode | string;
};

export type SurveyQuestion = {
  id: string;
  position?: number;
  text: string;
  type: "reaction" | "rating_1_5" | "multiple_choice" | "open_text" | string;
  options?: string[] | null;
  // "trivia" questions are styled as trivia (not scored); anything else is a
  // survey question.
  pool?: "survey" | "trivia" | string | null;
};

type SurveySubmission = {
  answers: Record<string, any>;
  rrAnswers: Record<string, SurveyRateReactValue>;
  email: string;
  age: string;
  agePreferNotToSay?: boolean;
  gender: string;
  postalCode: string;
  // Ethnicity question answer (value) and its label at submit time.
  ethnicity?: string;
  ethnicityLabel?: string;
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
  initialSubmission?: SurveySubmission | null;
  questions: SurveyQuestion[];
  /** Older surveys: every question carries an emoji + 1–5 points. */
  reactionOnAllQuestions?: boolean;
  /** Cadence (kiosk) survey: `questions` holds only today's question. */
  isCadence?: boolean;
  /** `about_you` settings (wording, anonymity notice, fixed note). */
  aboutYou: AboutYou;
  /** Gender answers (`about_you.options.gender`). */
  genderOptions: GenderOption[];
  /** Switch the page to a state screen after a submit says so. */
  onBlocked?: (state: BlockedState) => void;
  userInfoModes?: UserInfoModes;
  /** Answers for the separate Ethnicity question (`about_you.options.ethnicity`). */
  ethnicityOptions?: EthnicityOption[];
  reactions?: ScanQrReaction[];
  /** Respondent-group questions, in display order. */
  profilePrompts?: ProfilePrompt[];
  /** Re-fetches the scan response (fresh profile prompts). */
  onRefreshPrompts?: () => Promise<void>;
};

const emptyRR: SurveyRateReactValue = { reaction: null, rating: null };

const msSince = (start: number) =>
  Math.min(COMPLETION_MS_MAX, Math.max(0, Date.now() - start));

// 1–5 points on their own, for older `rating_1_5` questions that don't also
// ask for an emoji.
const RatingScale = ({
  name,
  value,
  onChange,
  invalid,
}: {
  name: string;
  value: number | null;
  onChange: (n: number) => void;
  invalid?: boolean;
}) => (
  <div
    role="radiogroup"
    aria-label="Rating from 1 to 5"
    aria-invalid={invalid || undefined}
    className="flex justify-between items-center mt-2"
  >
    {[1, 2, 3, 4, 5].map((n) => {
      const checked = value === n;
      return (
        <label key={n} className="relative">
          <input
            type="radio"
            name={name}
            value={n}
            checked={checked}
            onChange={() => onChange(n)}
            className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
          />
          <span
            className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] font-semibold cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 ${
              checked
                ? "bg-brand text-white"
                : "bg-surface-soft text-black hover:bg-brand hover:text-white"
            }`}
          >
            {n}
          </span>
        </label>
      );
    })}
  </div>
);

const RadioDot = ({ checked }: { checked: boolean }) => (
  <span
    aria-hidden
    className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white transition-colors ${
      checked ? "border-brand" : "border-option-text"
    }`}
  >
    {checked && <span className="w-3 h-3 rounded-full bg-brand" />}
  </span>
);

const SurveyForm = ({
  onSubmitted,
  surveyId,
  slug,
  initialSubmission,
  questions,
  reactionOnAllQuestions = false,
  isCadence = false,
  aboutYou,
  genderOptions,
  onBlocked,
  userInfoModes,
  ethnicityOptions = [],
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
  // The Ethnicity question is new, so it stays hidden when the mode is absent —
  // and when there are no answers to offer.
  const ethnicityMode: FieldMode = ethnicityOptions.length
    ? ((userInfoModes?.ethnicity_mode as FieldMode) ?? "off")
    : "off";
  const descriptionMode =
    (userInfoModes?.description_mode as FieldMode) ?? "off";
  // Ethnicity/race reference data — used to resolve ids→names for the payload.
  // Only fetched when the picker is shown (RV-16).
  const { ethnicities, races } = useDemographicsData(raceMode !== "off");

  // Emoji + points are asked on every question of an older survey, and on
  // `reaction` questions otherwise.
  const needsRR = (q: SurveyQuestion) =>
    reactionOnAllQuestions || q.type === "reaction";

  // The "About you" step: shown when any built-in or profile prompt is on.
  const aboutModes = [
    emailMode,
    ageMode,
    genderMode,
    postalMode,
    ethnicityMode,
    raceMode,
  ];
  const aboutShown =
    profilePrompts.length > 0 || aboutModes.some((m) => m !== "off");

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
  const [agePreferNotToSay, setAgePreferNotToSay] = useState(
    initialSubmission?.agePreferNotToSay ?? false
  );
  const [gender, setGender] = useState(initialSubmission?.gender ?? "");
  const [postalCode, setPostalCode] = useState(
    initialSubmission?.postalCode ?? ""
  );
  const [ethnicity, setEthnicity] = useState(
    initialSubmission?.ethnicity ?? ""
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
  const ethnicityRef = useRef<HTMLDivElement>(null);
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
    // A rating-only question (older rating_1_5) is complete with just points.
    const q = sorted.find((x) => x.id === id);
    if (v.rating != null && (v.reaction || (q && !needsRR(q))))
      clearError(id);
    setRrAnswers((prev) => ({ ...prev, [id]: v }));
  };

  // Multiple choice is single-select (RV-01): the answer is a one-item list.
  const selectChoice = (id: string, opt: string) => {
    clearError(id);
    setAnswers((prev) => ({ ...prev, [id]: [opt] }));
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
      // Only values the question still offers, and only one of them.
      const picked = (Array.isArray(a) ? a : []).filter((x: string) =>
        (q.options ?? []).includes(x),
      );
      return { type: "multiple_choice", selected: picked.slice(0, 1) };
    }
    if (q.type === "rating_1_5") {
      return { type: "rating_1_5", value: rrAnswers[q.id]?.rating ?? null };
    }
    // reaction (and any unknown rate-react type)
    return { type: "reaction", value: rrAnswers[q.id]?.reaction ?? null };
  };

  // The Ethnicity answer to send: the question's own answer, else the one the
  // reviewer already gave in the Race & Ethnicity picker (no asking twice).
  const ethnicityOf = (eth: string, demo: DemographicsValue) =>
    ethnicityMode === "off"
      ? ""
      : eth ||
        (raceMode !== "off"
          ? ethnicityFromPicker(demo.ethnicityCategoryId, ethnicityOptions)
          : "");
  const effectiveEthnicity = ethnicityOf(ethnicity, demographics);
  const ethnicityLabel = ethnicityOptions.find(
    (o) => o.value === effectiveEthnicity
  )?.label;

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
      } else if (q.type === "rating_1_5" && !needsRR(q)) {
        if (rr?.rating == null) e[q.id] = "Please pick a rating.";
      }
      // The emoji + points row (reaction questions, or every question of an
      // older survey).
      if (!e[q.id] && needsRR(q) && !rateOk)
        e[q.id] = "Please rate your experience.";
    }

    validateAbout(e);

    if (descriptionMode === "required" && !description.trim())
      e.description = "Description is required.";

    if (!consent) e.consent = "Please acknowledge and consent to continue.";

    return e;
  };

  const validateAbout = (e: Record<string, string>) => {
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

    if (ageMode === "required" && !agePreferNotToSay && age.trim() === "")
      e.age = "Age is required.";
    else if (ageMode !== "off" && !agePreferNotToSay && age.trim() !== "") {
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

    // "Prefer not to say" is one of the options, so it counts as an answer.
    if (ethnicityMode === "required" && !effectiveEthnicity)
      e.ethnicity = "Ethnicity is required.";

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
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const refFor = (key: string): HTMLElement | null => {
      if (key === "email") return emailRef.current;
      if (key === "age") return ageRef.current;
      if (key === "gender") return genderRef.current;
      if (key === "postalCode") return postalCodeRef.current;
      // Ethnicity's ref is its wrapper — focus the selected/first pill.
      if (key === "ethnicity")
        return (
          ethnicityRef.current?.querySelector<HTMLElement>(
            "input:checked, input, button"
          ) ?? ethnicityRef.current
        );
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
      "ethnicity",
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

  // Server-side safety net for the "about you" prompts: show a
  // REVIEW_PII_REQUIRED next to its field. Returns true when handled inline.
  const handlePiiError = (response: any) => {
    const code = response?.data?.error;
    if (code === REVIEW_DESCRIPTION_REQUIRED && descriptionMode !== "off") {
      const errs = { description: "Please add a description." };
      setErrors(errs);
      focusFirstError(errs);
      return true;
    }
    if (code === REVIEW_ANSWER_REACTION_REQUIRED) {
      const d = response?.data?.details ?? {};
      const qid: string | undefined =
        d.survey_question_id ?? d.question_id ?? undefined;
      const target = sorted.find((q) => q.id === qid) ?? sorted[0];
      if (!target) return false;
      const errs = { [target.id]: "Please pick an emoji and points." };
      setErrors(errs);
      focusFirstError(errs);
      return true;
    }
    if (code !== REVIEW_PII_REQUIRED) return false;
    const key = PII_FIELD_ERROR_KEYS[response?.data?.details?.field];
    const shown: Record<string, boolean> = {
      email: emailMode !== "off",
      age: ageMode !== "off",
      gender: genderMode !== "off",
      postalCode: postalMode !== "off",
      ethnicity: ethnicityMode !== "off",
      race: raceMode !== "off",
      description: descriptionMode !== "off",
    };
    if (!key || !shown[key]) return false;
    const errs = {
      [key]: response?.data?.message ?? "This field is required.",
    };
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

    const about = {
      email,
      age,
      agePreferNotToSay,
      gender,
      postalCode,
      ethnicity,
      demographics,
      profile,
    };
    const sendEthnicity = ethnicityOf(about.ethnicity, about.demographics);
    const sendEthnicityLabel = ethnicityOptions.find(
      (o) => o.value === sendEthnicity
    )?.label;
    const raceAndEthnicity =
      raceMode !== "off"
        ? buildRaceAndEthnicityPayload(about.demographics, ethnicities, races)
        : undefined;

    // rating/reaction go on an answer only where the emoji row is asked;
    // otherwise the server drops them.
    const builtAnswers: SurveyAnswer[] = sorted.map((q) => {
      const rr = rrAnswers[q.id];
      if (!needsRR(q))
        return { survey_question_id: q.id, answer: buildAnswer(q) };
      return {
        survey_question_id: q.id,
        rating: rr?.rating ?? null,
        reaction: rr?.reaction ?? null,
        answer: buildAnswer(q),
      };
    });

    const trimmedDescription = description.trim();
    const profilePayload = buildProfilePayload(profilePrompts, about.profile);

    setSubmitting(true);
    const response: any = await submitReview({
      kind: "survey",
      survey_id: surveyId,
      completion_ms: msSince(startedAt),
      answers: builtAnswers,
      ...(descriptionMode !== "off" && trimmedDescription
        ? { description: trimmedDescription }
        : {}),
      ...(emailMode !== "off" && about.email.trim()
        ? { email: about.email.trim() }
        : {}),
      ...(genderMode !== "off" && about.gender.trim()
        ? { gender: about.gender.trim() }
        : {}),
      ...(ageMode !== "off" && about.agePreferNotToSay
        ? { age_prefer_not_to_say: true }
        : ageMode !== "off" && about.age.trim()
          ? { age: Number(about.age) }
          : {}),
      ...(postalMode !== "off" && about.postalCode.trim()
        ? { postal_code: about.postalCode.trim() }
        : {}),
      ...(sendEthnicity ? { ethnicity: sendEthnicity } : {}),
      ...(raceAndEthnicity ? { race_and_ethnicity: raceAndEthnicity } : {}),
      ...(profilePayload.length ? { profile: profilePayload } : {}),
    });
    setSubmitting(false);

    if (!["200", "201"].includes(String(response?.status))) {
      if (await handleProfileError(response)) return;
      if (handlePiiError(response)) return;
      await handleSubmitError(response, {
        onBlocked,
        onRefresh: onRefreshPrompts,
      });
      return;
    }

    await saveSubmission(slug, "survey", {
      answers,
      rrAnswers,
      email: about.email,
      age: about.age,
      agePreferNotToSay: about.agePreferNotToSay,
      gender: about.gender,
      postalCode: about.postalCode,
      ethnicity: sendEthnicity,
      ethnicityLabel: sendEthnicityLabel,
      description,
      demographics: about.demographics,
      // Persist resolved names too, so the restored summary needs no lookup.
      raceAndEthnicity,
      profile: about.profile,
      profileAnswers: buildProfileSummary(profilePrompts, about.profile),
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
        age={
          ageMode === "off" ? "" : agePreferNotToSay ? "Prefer not to say" : age
        }
        gender={genderMode !== "off" ? gender : ""}
        postalCode={postalMode !== "off" ? postalCode : ""}
        description={descriptionMode !== "off" ? description : ""}
        profileAnswers={[
          ...(initialSubmission?.profileAnswers ??
            buildProfileSummary(profilePrompts, profile)),
          ...((initialSubmission?.ethnicityLabel ?? ethnicityLabel)
            ? [
                {
                  label: "Ethnicity",
                  value: (initialSubmission?.ethnicityLabel ??
                    ethnicityLabel) as string,
                },
              ]
            : []),
        ]}
        raceAndEthnicity={
          raceMode !== "off"
            ? (initialSubmission?.raceAndEthnicity ??
              buildRaceAndEthnicityPayload(demographics, ethnicities, races))
            : undefined
        }
      />
    );
  }

  // Cadence (kiosk) survey with nothing asked today.
  if (isCadence && sorted.length === 0) {
    return (
      <div className="survey-card text-center animate-fade-in-up [animation-delay:320ms]">
        <h2 className="text-[18px] font-bold mb-2">No question today</h2>
        <p className="text-[14px] text-placeholder">
          There's nothing to answer today. Please check back tomorrow.
        </p>
      </div>
    );
  }

  const errorText = (key: string, className = "mt-1.5") =>
    errors[key] ? (
      <p role="alert" className={`${className} text-xs text-red-500`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="animate-fade-in-up [animation-delay:320ms]">
      {sorted.map((q, idx) => {
        const trivia = q.pool === "trivia";
        const promptId = `survey-q-${q.id}`;
        return (
          <div
            key={q.id}
            ref={(el) => {
              questionRefs.current[q.id] = el;
            }}
            className={`question-card mb-4 ${
              errors[q.id] ? "border border-red-500" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-bold text-[14px]">Question {idx + 1}</p>
              {trivia && (
                <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[12px] font-semibold">
                  Trivia · just for fun
                </span>
              )}
            </div>
            <p id={promptId} className="text-placeholder text-[14px] mb-4">
              {q.text}
              <span className="text-red-500 ml-0.5">*</span>
            </p>

            {q.type === "multiple_choice" && (
              <div
                role="radiogroup"
                aria-labelledby={promptId}
                aria-required
                aria-invalid={errors[q.id] ? true : undefined}
                className="space-y-2.5"
              >
                {(q.options ?? []).map((opt) => {
                  const cur: string[] = Array.isArray(answers[q.id])
                    ? answers[q.id]
                    : [];
                  const checked = cur[0] === opt;
                  return (
                    <label key={opt} className="relative block">
                      <input
                        type="radio"
                        name={`survey-mc-${q.id}`}
                        value={opt}
                        checked={checked}
                        onChange={() => selectChoice(q.id, opt)}
                        className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
                      />
                      <span
                        className={`w-full flex items-center justify-between rounded-full bg-white px-4 py-3 cursor-pointer transition-colors border border-option-border peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 ${
                          checked ? "text-brand" : "text-option-text"
                        }`}
                      >
                        <span className="text-[14px] font-medium">{opt}</span>
                        <RadioDot checked={checked} />
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === "open_text" && (
              <textarea
                aria-labelledby={promptId}
                placeholder="Write…"
                maxLength={TEXT_MAX}
                value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
                onChange={(e) =>
                  setAnswer(q.id, e.target.value.slice(0, TEXT_MAX))
                }
                className="nice-scrollbar w-full rounded-2xl bg-white border border-option-border px-4 py-3 text-sm placeholder:text-option-text outline-none resize-none h-24 transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
            )}

            {q.type === "rating_1_5" && !needsRR(q) && (
              <RatingScale
                name={`survey-rating-${q.id}`}
                value={rrAnswers[q.id]?.rating ?? null}
                invalid={!!errors[q.id]}
                onChange={(n) => setRr(q.id, { reaction: null, rating: n })}
              />
            )}

            {needsRR(q) && (
              <div
                className={
                  q.type === "reaction" || q.type === "rating_1_5" ? "" : "mt-4"
                }
              >
                <SurveyReactionRow
                  value={rrAnswers[q.id] ?? emptyRR}
                  onChange={(v) => setRr(q.id, v)}
                  reactions={reactions}
                />
              </div>
            )}

            {errorText(q.id, "mt-3")}
          </div>
        );
      })}

      {aboutShown && (
        <AboutYouSection aboutYou={aboutYou}>
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

          {genderMode !== "off" && (
            <div className="mb-5">
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
                options={genderOptions}
                placeholder="Select your gender"
                error={!!errors.gender}
              />
              {errorText("gender")}
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
              {errorText("postalCode")}
            </div>
          )}

          {ethnicityMode !== "off" && (
            <ProfilePromptField
              ref={ethnicityRef}
              idPrefix="survey"
              prompt={{
                field_id: "ethnicity",
                label: "Ethnicity",
                mode: ethnicityMode,
                options: ethnicityOptions.map((o) => ({
                  id: o.value,
                  label: o.label,
                })),
              }}
              value={effectiveEthnicity}
              onChange={(v) => {
                clearError("ethnicity");
                setEthnicity(v);
              }}
              error={errors.ethnicity}
            />
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
                  // A picker ethnicity fills the Ethnicity question too.
                  if (
                    ethnicityFromPicker(v.ethnicityCategoryId, ethnicityOptions)
                  )
                    clearError("ethnicity");
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
                maxLength={EMAIL_MAX}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  clearError("email");
                  setEmail(e.target.value);
                }}
                className={`field-input ${errors.email ? "border-red-500" : ""}`}
              />
              {errorText("email")}
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
                disabled={agePreferNotToSay}
                onChange={(e) => {
                  clearError("age");
                  setAge(e.target.value.replace(/\D/g, "").slice(0, 3));
                }}
                className={`field-input disabled:opacity-60 ${errors.age ? "border-red-500" : ""}`}
              />
              <label className="mt-2 flex items-center gap-2 text-[13px] text-placeholder cursor-pointer">
                <input
                  type="checkbox"
                  checked={agePreferNotToSay}
                  onChange={(e) => {
                    clearError("age");
                    setAgePreferNotToSay(e.target.checked);
                    if (e.target.checked) setAge("");
                  }}
                  className="h-4 w-4 accent-black cursor-pointer"
                />
                Prefer not to say
              </label>
              {errorText("age")}
            </div>
          )}
        </AboutYouSection>
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
            maxLength={TEXT_MAX}
            value={description}
            onChange={(e) => {
              clearError("description");
              setDescription(e.target.value.slice(0, TEXT_MAX));
            }}
            className={`field-textarea nice-scrollbar ${errors.description ? "border-red-500" : ""}`}
          />
          <p className="mt-1 text-right text-[11px] text-placeholder">
            {description.length}/{TEXT_MAX}
          </p>
          {errorText("description")}
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
        {errorText("consent")}
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
