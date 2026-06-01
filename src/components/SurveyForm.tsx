import { useRef, useState } from "react";
import { toast } from "sonner";
import SurveyReactionRow, { type SurveyRateReactValue } from "./SurveyReactionRow";
import SurveySummary from "./SurveySummary";
import SelectDropdown from "./SelectDropdown";
import { submitReview, type SurveyAnswer } from "../api";
import { saveSubmission } from "../utils/SubmissionStore";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

type FieldMode = "off" | "optional" | "required";

type UserInfoModes = {
  email_mode?: FieldMode | string;
  age_mode?: FieldMode | string;
  gender_mode?: FieldMode | string;
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
  description: string;
};

type SurveyFormProps = {
  onSubmitted?: () => void;
  surveyId: string;
  slug: string;
  initialSubmission?: SurveySubmission | null;
  questions: SurveyQuestion[];
  userInfoModes?: UserInfoModes;
};

const emptyRR: SurveyRateReactValue = { reaction: null, rating: null };

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
  initialSubmission,
  questions,
  userInfoModes,
}: SurveyFormProps) => {
  const emailMode = (userInfoModes?.email_mode as FieldMode) ?? "off";
  const ageMode = (userInfoModes?.age_mode as FieldMode) ?? "off";
  const genderMode = (userInfoModes?.gender_mode as FieldMode) ?? "off";

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
  const [description, setDescription] = useState(
    initialSubmission?.description ?? ""
  );
  const [consent, setConsent] = useState(!!initialSubmission);
  const [submitted, setSubmitted] = useState(!!initialSubmission);
  const [submitting, setSubmitting] = useState(false);

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLButtonElement>(null);
  const consentRef = useRef<HTMLDivElement>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  const triggerBlink = (key: string) => {
    setErrorField(null);
    window.setTimeout(() => setErrorField(key), 10);
    window.setTimeout(() => setErrorField(null), 1000);
  };

  const setAnswer = (id: string, v: any) =>
    setAnswers((prev) => ({ ...prev, [id]: v }));

  const setRr = (id: string, v: SurveyRateReactValue) =>
    setRrAnswers((prev) => ({ ...prev, [id]: v }));

  const toggleChoice = (id: string, opt: string) => {
    setAnswers((prev) => {
      const cur: string[] = Array.isArray(prev[id]) ? prev[id] : [];
      return {
        ...prev,
        [id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt],
      };
    });
  };

  const isAnswered = (q: SurveyQuestion) => {
    const rr = rrAnswers[q.id];
    const rrOk = !!(rr && rr.reaction && rr.rating != null);
    if (q.type === "multiple_choice") {
      const a = answers[q.id];
      return rrOk && Array.isArray(a) && a.length > 0;
    }
    if (q.type === "open_text") {
      const a = answers[q.id];
      return rrOk && typeof a === "string" && a.trim() !== "";
    }
    // reaction, rating_1_5 (and any unknown rate-only type)
    return rrOk;
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

  const handleSubmit = async () => {
    for (const q of sorted) {
      if (!isAnswered(q)) {
        triggerBlink(q.id);
        focusEl(questionRefs.current[q.id]);
        return;
      }
    }
    if (emailMode === "required" && email.trim() === "") {
      triggerBlink("email");
      focusEl(emailRef.current);
      return;
    }
    if (emailMode !== "off" && email.trim() !== "" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      triggerBlink("email");
      focusEl(emailRef.current);
      return;
    }
    if (ageMode === "required" && age.trim() === "") {
      triggerBlink("age");
      focusEl(ageRef.current);
      return;
    }
    if (ageMode !== "off" && age.trim() !== "") {
      const n = Number(age);
      if (!/^\d+$/.test(age) || !Number.isInteger(n) || n < 1 || n > 120) {
        triggerBlink("age");
        focusEl(ageRef.current);
        return;
      }
    }
    if (genderMode === "required" && gender.trim() === "") {
      triggerBlink("gender");
      focusEl(genderRef.current);
      return;
    }
    if (!consent) {
      triggerBlink("consent");
      focusEl(consentRef.current);
      return;
    }

    if (submitting) return;

    const builtAnswers: SurveyAnswer[] = sorted.map((q) => ({
      survey_question_id: q.id,
      rating: rrAnswers[q.id]?.rating ?? null,
      reaction: rrAnswers[q.id]?.reaction ?? null,
      answer: buildAnswer(q),
    }));

    const trimmedDescription = description.trim();

    setSubmitting(true);
    const response: any = await submitReview({
      kind: "survey",
      survey_id: surveyId,
      answers: builtAnswers,
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      ...(emailMode !== "off" && email.trim() ? { email: email.trim() } : {}),
      ...(genderMode !== "off" && gender.trim() ? { gender: gender.trim() } : {}),
      ...(ageMode !== "off" && age.trim() ? { age: Number(age) } : {}),
    });
    setSubmitting(false);

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
      description,
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
        email={emailMode !== "off" ? email : ""}
        age={ageMode !== "off" ? age : ""}
        gender={genderMode !== "off" ? gender : ""}
        description={description}
      />
    );
  }

  return (
    <div className="animate-fade-in-up [animation-delay:320ms]">
      <h1 className="text-[20px] font-bold mb-4">
        Help us personalize your experience
      </h1>

      {sorted.map((q, idx) => (
        <div
          key={q.id}
          ref={(el) => {
            questionRefs.current[q.id] = el;
          }}
          className={`question-card mb-4 ${errorField === q.id ? "animate-blink-error" : ""}`}
        >
          <p className="font-bold text-[14px] mb-2">Question {idx + 1}</p>
          <p className="text-placeholder text-[14px] mb-4">
            {q.text}
            <span className="text-red-500 ml-0.5">*</span>
          </p>

          {(q.type === "reaction" || q.type === "rating_1_5") && (
            <SurveyReactionRow
              value={rrAnswers[q.id] ?? emptyRR}
              onChange={(v) => setRr(q.id, v)}
            />
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

          {(q.type === "multiple_choice" || q.type === "open_text") && (
            <div className="mt-4 -mx-5 -mb-5 rounded-b-[30px] bg-survey-rate-bg p-5">
              <p className="text-[14px] font-bold mb-5 required">
                How would you rate your experience?
              </p>
              <SurveyReactionRow
                value={rrAnswers[q.id] ?? emptyRR}
                onChange={(v) => setRr(q.id, v)}
              />
            </div>
          )}
        </div>
      ))}

      {emailMode !== "off" && (
        <div className="mb-5 mt-6">
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
            onChange={(e) => setEmail(e.target.value)}
            className={`field-input ${errorField === "email" ? "animate-blink-error" : ""}`}
          />
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
            onChange={(e) =>
              setAge(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            className={`field-input ${errorField === "age" ? "animate-blink-error" : ""}`}
          />
        </div>
      )}

      {genderMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${genderMode === "required" ? "required" : ""}`}
            htmlFor="survey-gender"
          >
            Enter Your Gender
          </label>
          <SelectDropdown
            ref={genderRef}
            id="survey-gender"
            value={gender}
            onChange={setGender}
            options={GENDER_OPTIONS}
            placeholder="Select your gender"
            error={errorField === "gender"}
          />
        </div>
      )}

      <div className="mb-5">
        <label className="field-label" htmlFor="survey-desc">
          Description
        </label>
        <textarea
          id="survey-desc"
          placeholder="enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-textarea nice-scrollbar"
        />
      </div>

      <div
        ref={consentRef}
        onClick={() => setConsent((v) => !v)}
        className="mb-5 flex items-start gap-3 cursor-pointer rounded-2xl p-1"
      >
        <input
          id="survey-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className={`mt-0.5 h-5 w-5 shrink-0 accent-black cursor-pointer rounded ${
            errorField === "consent" ? "animate-blink-error" : ""
          }`}
        />
        <label htmlFor="survey-consent" className="text-[13px] leading-snug text-placeholder cursor-pointer">
          I acknowledge the sharing of my personal information and consent to its
          collection, use, and processing for the intended purposes.
          <span className="text-red-500 ml-0.5">*</span>
        </label>
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
