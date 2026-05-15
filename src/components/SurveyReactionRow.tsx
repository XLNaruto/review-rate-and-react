import { useLayoutEffect, useRef, useState } from "react";
import { toAbsoluteUrl } from "../utils/Assets";
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

export type SurveyRateReactValue = {
  reaction: string | null;
  rating: number | null;
};

type Props = {
  value: SurveyRateReactValue;
  onChange: (next: SurveyRateReactValue) => void;
};

const SurveyReactionRow = ({ value, onChange }: Props) => {
  const { reaction: selectedReaction, rating: selectedRating } = value;

  const rowRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [reactionLeft, setReactionLeft] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const [ratingBursts, setRatingBursts] = useState<Record<number, number>>({});
  const burstIdRef = useRef(0);

  const getBtnCenter = (idx: number) => {
    const btn = btnRefs.current[idx];
    const row = rowRef.current;
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
    const row = rowRef.current;
    if (!row) return;

    const recompute = () => {
      if (selectedRating == null) {
        setReactionLeft(row.getBoundingClientRect().width + 8);
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

  const setRating = (n: number) => {
    onChange({ reaction: selectedReaction, rating: n });
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

  if (!selectedReaction) {
    return (
      <div className="flex justify-between items-center gap-2">
        {reactions.map((r) => (
          <button
            key={r.alt}
            type="button"
            onClick={() => onChange({ reaction: r.alt, rating: null })}
            className={`relative w-[40px] h-[40px] rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-2 border-white transition-all duration-200 ease-out hover:scale-125 active:scale-110 ${r.bg}`}
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
    );
  }

  const r = reactions.find((x) => x.alt === selectedReaction)!;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const row = rowRef.current;
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
    if (n !== selectedRating) setRating(n);
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
    transform: `translate(-30%, -60%)`,
    transition: isDragging
      ? "none"
      : "left 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    touchAction: "none",
  };

  return (
    <div
      ref={rowRef}
      className="relative flex justify-between items-center mt-2"
    >
      <button
        type="button"
        aria-label="Drag to set rating, or tap to change reaction"
        onClick={() => {
          if (didDragRef.current) {
            didDragRef.current = false;
            return;
          }
          onChange({ reaction: null, rating: null });
          setRatingBursts({});
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={style}
        className={`absolute z-20 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white shadow-md ${r.bg} ${
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
      {ratings.map((n, i) => {
        const active = selectedRating === n;
        const burst = ratingBursts[n];
        return (
          <button
            key={n}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            onClick={() => setRating(n)}
            className={`relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] font-semibold cursor-pointer transition-colors ${
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
  );
};

export default SurveyReactionRow;
