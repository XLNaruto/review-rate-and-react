import { useRef, useState } from "react";
import { toAbsoluteUrl } from "../utils/Assets";
import SmartImage from "./SmartImage";
import SurveySummary from "./SurveySummary";

const reactions = [
  { gif: "media/reactions/like.gif", alt: "like", bg: "bg-react-like", size: 24 },
  { gif: "media/reactions/love.gif", alt: "love", bg: "bg-react-love", size: 28 },
  { gif: "media/reactions/fire.gif", alt: "fire", bg: "bg-react-fire", size: 30 },
  { gif: "media/reactions/sad.gif", alt: "sad", bg: "bg-react-sad", size: 30 },
  { gif: "media/reactions/haha.gif", alt: "haha", bg: "bg-react-haha", size: 32 },
  { gif: "media/reactions/wow.gif", alt: "wow", bg: "bg-react-wow", size: 32 },
  { gif: "media/reactions/angry.gif", alt: "angry", bg: "bg-react-angry", size: 32 },
];

const ratings = [1, 2, 3, 4, 5];

const categoryOptions = ["UI/Design", "Performance", "Features", "Customer Support"];

type SurveyFormProps = {
  onSubmitted?: () => void;
};

const QuestionCard = ({
  index,
  subtitle,
  children,
}: {
  index: number;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="question-card mb-4">
    <p className="font-bold text-[14px] mb-2">Question {index}</p>
    <p className="text-placeholder text-[14px] mb-4">{subtitle}</p>
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
  const [reaction, setReaction] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ratingBursts, setRatingBursts] = useState<Record<number, number>>({});
  const burstIdRef = useRef(0);

  const handleRatingClick = (n: number) => {
    setRating(n);
    burstIdRef.current += 1;
    const id = burstIdRef.current;
    setRatingBursts((prev) => ({ ...prev, [n]: id }));
    window.setTimeout(() => {
      setRatingBursts((prev) => {
        if (prev[n] !== id) return prev;
        const next = { ...prev };
        delete next[n];
        return next;
      });
    }, 3000);
  };

  const canSubmit =
    !!reaction && !!rating && categories.length > 0 && email.trim() !== "";

  const toggleCategory = (c: string) => {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  if (submitted && reaction && rating) {
    return (
      <SurveySummary
        reaction={reaction}
        rating={rating}
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
      >
        <div className="flex justify-between items-center gap-2">
          {reactions.map((r) => {
            const active = reaction === r.alt;
            return (
              <button
                key={r.alt}
                type="button"
                onClick={() => setReaction(r.alt)}
                className={`relative w-[40px] h-[40px] rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-2 border-white transition-all duration-200 ease-out hover:scale-125 active:scale-110 ${r.bg} ${
                  active ? "ring-2 ring-brand ring-offset-2" : ""
                }`}
              >
                <SmartImage
                  style={{ width: r.size, height: r.size }}
                  className="object-contain"
                  wrapperClassName="rounded-full"
                  src={toAbsoluteUrl(r.gif)}
                  alt={r.alt}
                />
              </button>
            );
          })}
        </div>
      </QuestionCard>

      <QuestionCard index={2} subtitle="What would you like to ask?">
        <div className="flex justify-between items-center">
          {ratings.map((n) => {
            const active = rating === n;
            const burst = ratingBursts[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleRatingClick(n)}
                className={`relative w-[44px] h-[44px] rounded-full flex items-center justify-center text-[18px] font-semibold cursor-pointer border-2 border-white transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "bg-surface-soft text-black hover:bg-brand hover:text-white"
                }`}
              >
                {n}
                {burst && (
                  <span
                    key={burst}
                    className="pointer-events-none absolute left-1/2 -top-2 text-brand text-[20px] font-bold animate-float-up"
                  >
                    +{n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </QuestionCard>

      <QuestionCard
        index={3}
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
                  checked
                    ? "text-brand"
                    : "text-option-text"
                } border border-option-border `}
              >
                <span className="text-[14px] font-medium">{c}</span>
                <Checkbox checked={checked} />
              </button>
            );
          })}
        </div>
      </QuestionCard>

      <QuestionCard
        index={4}
        subtitle="How would you rate your overall experience?"
      >
        <textarea
          placeholder="Write…"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          className="w-full rounded-2xl bg-white border border-option-border px-4 py-3 text-sm placeholder:text-option-text outline-none resize-none h-24 transition focus:border-black focus:ring-2 focus:ring-black/10"
        />
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
