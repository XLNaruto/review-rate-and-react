import { useLayoutEffect, useRef, useState } from "react";
import { toAbsoluteUrl } from "../utils/Assets";
import FeedbackSummary from "./FeedbackSummary";
import SmartImage from "./SmartImage";

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
  const ratingRowRef = useRef<HTMLDivElement>(null);
  const ratingBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [reactionLeft, setReactionLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const getBtnCenter = (idx: number) => {
    const btn = ratingBtnRefs.current[idx];
    const row = ratingRowRef.current;
    if (!btn || !row) return null;
    const br = btn.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    return br.left - rr.left + br.width / 2;
  };

  const nearestRatingFromX = (x: number) => {
    let best = ratings[0];
    let bestDist = Infinity;
    ratings.forEach((n, i) => {
      const c = getBtnCenter(i);
      if (c == null) return;
      const d = Math.abs(c - x);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    });
    return best;
  };

  useLayoutEffect(() => {
    if (!selectedReaction) return;
    const row = ratingRowRef.current;
    if (!row) return;

    const recompute = () => {
      if (selectedRating == null) {
        setReactionLeft(row.getBoundingClientRect().width - 12);
      } else {
        const c = getBtnCenter(ratings.indexOf(selectedRating));
        if (c != null) setReactionLeft(c);
      }
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(row);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [selectedRating, selectedReaction]);

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
            How would you rate your business experience?
          </h1>
          <div className="border border-border-mute rounded-[10rem] p-5 flex justify-between items-center gap-1.5 sm:gap-2.5 mb-5">
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
            How would you rate your business experience?
          </h1>
          <div
            ref={ratingRowRef}
            className="relative border border-border-mute rounded-[10rem] p-5 flex justify-around items-center mb-5"
          >
            {(() => {
              const r = reactions.find((x) => x.alt === selectedReaction);
              if (!r) return null;
              const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                setIsDragging(true);
                dragStartXRef.current = e.clientX;
                didDragRef.current = false;
              };
              const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
                if (!isDragging) return;
                const row = ratingRowRef.current;
                if (!row) return;
                if (
                  dragStartXRef.current != null &&
                  Math.abs(e.clientX - dragStartXRef.current) > 4
                ) {
                  didDragRef.current = true;
                }
                const rawX = e.clientX - row.getBoundingClientRect().left;
                const firstC = getBtnCenter(0);
                const lastC = getBtnCenter(ratings.length - 1);
                const minX = firstC ?? 0;
                const maxX = lastC ?? row.getBoundingClientRect().width;
                const x = Math.max(minX, Math.min(maxX, rawX));
                setReactionLeft(x);
                const n = nearestRatingFromX(x);
                if (n !== selectedRating) handleRatingClick(n);
              };
              const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
                if (!isDragging) return;
                setIsDragging(false);
                dragStartXRef.current = null;
                try {
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                } catch {
                  /* noop */
                }
                if (selectedRating != null) {
                  const c = getBtnCenter(ratings.indexOf(selectedRating));
                  if (c != null) setReactionLeft(c);
                }
              };
              const style: React.CSSProperties = {
                left: reactionLeft ?? undefined,
                top: 0,
                transform: "translate(-50%, -50%)",
                transition: isDragging ? "none" : "left 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                touchAction: "none",
              };
              return (
                <button
                  type="button"
                  aria-label="Drag to set rating, or tap to change reaction"
                  onClick={() => {
                    if (didDragRef.current) {
                      didDragRef.current = false;
                      return;
                    }
                    setSelectedReaction(null);
                    setSelectedRating(null);
                    setRatingBursts({});
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={style}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white shadow-md ${r.bg} ${
                    isDragging ? "scale-110" : ""
                  } transition-transform duration-150 ease-out`}
                >
                  <SmartImage
                    style={{ width: r.size, height: r.size }}
                    className="object-contain pointer-events-none"
                    wrapperClassName="rounded-full"
                    src={toAbsoluteUrl(r.gif)}
                    alt={r.alt}
                  />
                </button>
              );
            })()}
            {ratings.map((n, i) => {
              const active = selectedRating === n;
              const burst = ratingBursts[n];
              return (
                <button
                  key={n}
                  ref={(el) => {
                    ratingBtnRefs.current[i] = el;
                  }}
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
