import { useState } from "react";
import SurveyReactionRow, { type SurveyRateReactValue } from "./SurveyReactionRow";
import SurveySummary from "./SurveySummary";

const emptyRR: SurveyRateReactValue = { reaction: null, rating: null };

const categoryOptions = ["UI/Design", "Performance", "Features", "Customer Support"];

type SurveyFormProps = {
  onSubmitted?: () => void;
};

const QuestionCard = ({
  index,
  subtitle,
  required,
  children,
}: {
  index: number;
  subtitle: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="question-card mb-4">
    <p className="font-bold text-[14px] mb-2">Question {index}</p>
    <p className="text-placeholder text-[14px] mb-4">
      {subtitle}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
    {children}
  </div>
);

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

const SurveyForm = ({ onSubmitted }: SurveyFormProps) => {
  const [questionRR, setQuestionRR] = useState<Record<number, SurveyRateReactValue>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const setQ = (i: number, v: SurveyRateReactValue) =>
    setQuestionRR((prev) => ({ ...prev, [i]: v }));

  const q1 = questionRR[1] ?? emptyRR;
  const canSubmit = !!q1.reaction && email.trim() !== "";

  const toggleCategory = (c: string) => {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  if (submitted && q1.reaction) {
    return (
      <SurveySummary
        questionRR={questionRR}
        categories={categories}
        textAnswer={textAnswer}
        email={email}
        description={description}
      />
    );
  }

  return (
    <div className="animate-fade-in-up [animation-delay:320ms]">
      <h1 className="text-[20px] font-bold mb-4">
        Help us personalize your experience
      </h1>

      <QuestionCard
        index={1}
        subtitle="How would you rate your overall experience?"
        required
      >
        <SurveyReactionRow value={q1} onChange={(v) => setQ(1, v)} />
      </QuestionCard>

      <QuestionCard
        index={2}
        subtitle="How would you rate your overall experience?"
      >
        <div className="space-y-2.5">
          {categoryOptions.map((c) => {
            const checked = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={`w-full flex items-center justify-between rounded-full bg-white px-4 py-3 cursor-pointer transition-colors ${
                  checked ? "text-brand" : "text-option-text"
                } border border-option-border `}
              >
                <span className="text-[14px] font-medium">{c}</span>
                <Checkbox checked={checked} />
              </button>
            );
          })}
        </div>
        <div className="mt-4 -mx-5 -mb-5 rounded-b-[30px] bg-survey-rate-bg p-5">
          <p className="text-[14px] font-bold mb-5 required">
            How would you rate your experience?
          </p>
          <SurveyReactionRow
            value={questionRR[2] ?? emptyRR}
            onChange={(v) => setQ(2, v)}
          />
        </div>
      </QuestionCard>

      <QuestionCard
        index={3}
        subtitle="How would you rate your overall experience?"
      >
        <textarea
          placeholder="Write…"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          className="w-full rounded-2xl bg-white border border-option-border px-4 py-3 text-sm placeholder:text-option-text outline-none resize-none h-24 transition focus:border-black focus:ring-2 focus:ring-black/10"
        />
        <div className="mt-4 -mx-5 -mb-5 rounded-b-[30px] bg-survey-rate-bg p-5">
          <p className="text-[14px] font-bold mb-5 required">
            How would you rate your experience?
          </p>
          <SurveyReactionRow
            value={questionRR[3] ?? emptyRR}
            onChange={(v) => setQ(3, v)}
          />
        </div>
      </QuestionCard>

      <div className="mb-5 mt-6">
        <label className="field-label required" htmlFor="survey-email">
          Enter Your Email
        </label>
        <input
          id="survey-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
        />
      </div>
      <div className="mb-5">
        <label className="field-label" htmlFor="survey-desc">
          Description
        </label>
        <textarea
          id="survey-desc"
          placeholder="enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-textarea"
        />
      </div>
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => {
          setSubmitted(true);
          onSubmitted?.();
        }}
        className="w-full rounded-full bg-black py-5 text-sm font-medium text-white opacity-20 enabled:hover:opacity-100 enabled:opacity-100 enabled:active:scale-[0.98] transition-all duration-300 disabled:cursor-not-allowed"
      >
        Submit feedback
      </button>
    </div>
  );
};

export default SurveyForm;
