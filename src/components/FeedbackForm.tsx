import { useRef, useState } from "react";
import { toAbsoluteUrl } from "../utils/Assets";
import FeedbackSummary from "./FeedbackSummary";
import SmartImage from "./SmartImage";

const reactions = [
  { gif: "media/reactions/like.gif", alt: "like", bg: "bg-react-like", size: 24 },
  { gif: "media/reactions/love.gif", alt: "love", bg: "bg-react-love", size: 28 },
  { gif: "media/reactions/fire.gif", alt: "fire", bg: "bg-react-fire", size: 30 },
  { gif: "media/reactions/wow.gif", alt: "wow", bg: "bg-react-wow", size: 32 },
  { gif: "media/reactions/haha.gif", alt: "haha", bg: "bg-react-haha", size: 32 },
  { gif: "media/reactions/angry.gif", alt: "angry", bg: "bg-react-angry", size: 32 },
];

const ratings = [1, 2, 3, 4, 5];

type FeedbackFormProps = {
  onSubmitted?: () => void;
};

const FeedbackForm = ({ onSubmitted }: FeedbackFormProps) => {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ratingBursts, setRatingBursts] = useState<Record<number, number>>({});
  const burstIdRef = useRef(0);

  const handleRatingClick = (n: number) => {
    setSelectedRating(n);
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

  const canSubmit = !!selectedReaction && !!selectedRating && email.trim() !== "";

  if (submitted && selectedReaction && selectedRating) {
    return (
      <FeedbackSummary
        reaction={selectedReaction}
        rating={selectedRating}
        email={email}
        description={description}
      />
    );
  }

  return (
    <div className="animate-fade-in-up [animation-delay:320ms]">
      {!selectedReaction && (
        <div className="animate-fade-in">
          <h1 className="text-[15px] font-medium required mb-3">
            How did this experience feel?
          </h1>
          <div className="border border-border-mute rounded-[10rem] p-5 flex justify-center items-center gap-[10px] mb-5">
            {reactions.map((r) => (
              <button
                key={r.alt}
                type="button"
                onClick={() => setSelectedReaction(r.alt)}
                className={`group relative w-[40px] h-[40px] rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-transform duration-200 ease-out hover:scale-125 active:scale-110 ${r.bg}`}
              >
                <SmartImage
                  style={{ width: r.size, height: r.size }}
                  className="object-contain"
                  wrapperClassName="rounded-full"
                  src={toAbsoluteUrl(r.gif)}
                  alt={r.alt}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedReaction && (
        <div className="animate-fade-in">
          <h1 className="text-[15px] font-medium required mb-3">
            How many points would you give it?
          </h1>
          <div className="relative border border-border-mute rounded-[10rem] p-5 flex justify-around items-center mb-5">
            {(() => {
              const r = reactions.find((x) => x.alt === selectedReaction);
              if (!r) return null;
              return (
                <button
                  type="button"
                  aria-label="Change reaction"
                  onClick={() => {
                    setSelectedReaction(null);
                    setSelectedRating(null);
                    setRatingBursts({});
                  }}
                  className={`absolute -top-3 -right-3 w-11 h-11 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-2 border-white shadow-md transition-transform duration-200 ease-out hover:scale-110 active:scale-95 ${r.bg}`}
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
            })()}
            {ratings.map((n) => {
              const active = selectedRating === n;
              const burst = ratingBursts[n];
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleRatingClick(n)}
                  className={`relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-[19px] font-semibold cursor-pointer transition-colors p-[5px] ${
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
        </div>
      )}

      <div className="mb-5">
        <label className="field-label required" htmlFor="email">
          Enter Your Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
        />
      </div>
      <div className="mb-5">
        <label className="field-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
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
        className="w-full rounded-full bg-black py-5 text-sm font-medium text-white opacity-20 enabled:hover:opacity-100 enabled:opacity-100  enabled:active:scale-[0.98] transition-all duration-300 disabled:cursor-not-allowed"
      >
        Submit feedback
      </button>
    </div>
  );
};

export default FeedbackForm;
