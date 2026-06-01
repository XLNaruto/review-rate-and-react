import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { toAbsoluteUrl } from "../utils/Assets";
import FeedbackSummary from "./FeedbackSummary";
import SmartImage from "./SmartImage";
import SelectDropdown from "./SelectDropdown";
import { submitReview } from "../api";
import { saveSubmission } from "../utils/SubmissionStore";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

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

type FieldMode = "off" | "optional" | "required";

type UserInfoModes = {
  email_mode?: FieldMode | string;
  age_mode?: FieldMode | string;
  gender_mode?: FieldMode | string;
};

type FeedbackSubmission = {
  reaction: string | null;
  rating: number | null;
  email: string;
  age: string;
  gender: string;
  description: string;
};

type FeedbackFormProps = {
  onSubmitted?: () => void;
  kind: "business_qr" | "product_qr";
  qrCodeId: string;
  slug: string;
  initialSubmission?: FeedbackSubmission | null;
  userInfoModes?: UserInfoModes;
};

const FeedbackForm = ({
  onSubmitted,
  kind,
  qrCodeId,
  slug,
  initialSubmission,
  userInfoModes,
}: FeedbackFormProps) => {
  const emailMode = (userInfoModes?.email_mode as FieldMode) ?? "required";
  const ageMode = (userInfoModes?.age_mode as FieldMode) ?? "off";
  const genderMode = (userInfoModes?.gender_mode as FieldMode) ?? "off";

  const [selectedReaction, setSelectedReaction] = useState<string | null>(
    initialSubmission?.reaction ?? null
  );
  const [selectedRating, setSelectedRating] = useState<number | null>(
    initialSubmission?.rating ?? null
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
  const emailRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLButtonElement>(null);
  const consentRef = useRef<HTMLDivElement>(null);
  const reactionRowRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
    clearError("rating");
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedReaction) e.reaction = "Please select a reaction.";
    if (!selectedRating) e.rating = "Please select a rating.";

    if (emailMode !== "off") {
      const v = email.trim();
      if (!v && emailMode === "required") e.email = "Email is required.";
      else if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        e.email = "Enter a valid email address.";
    }

    if (ageMode !== "off") {
      const v = age.trim();
      if (!v && ageMode === "required") e.age = "Age is required.";
      else if (v) {
        const n = Number(v);
        if (!/^\d+$/.test(v) || !Number.isInteger(n) || n < 1 || n > 120)
          e.age = "Enter a valid age.";
      }
    }

    if (genderMode !== "off") {
      const v = gender.trim();
      if (!v && genderMode === "required") e.gender = "Gender is required.";
    }

    if (!consent) e.consent = "Please acknowledge and consent to continue.";

    return e;
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const order: Array<keyof typeof refMap> = [
      "reaction",
      "rating",
      "email",
      "age",
      "gender",
      "consent",
    ];
    const refMap = {
      reaction: reactionRowRef,
      rating: ratingRowRef,
      email: emailRef,
      age: ageRef,
      gender: genderRef,
      consent: consentRef,
    } as const;
    const first = order.find((k) => errs[k]);
    if (!first) return;
    const el = refMap[first]?.current as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      if (typeof (el as HTMLInputElement).focus === "function") {
        (el as HTMLInputElement).focus({ preventScroll: true });
      }
    }, 320);
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError(errs);
      return;
    }
    if (submitting) return;

    setSubmitting(true);

    const trimmedDescription = description.trim();
    const response: any = await submitReview({
      kind,
      qr_code_id: qrCodeId,
      rating: selectedRating as number,
      reaction: selectedReaction as string,
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

    await saveSubmission(slug, kind, {
      reaction: selectedReaction,
      rating: selectedRating,
      email,
      age,
      gender,
      description,
    });

    setSubmitted(true);
    onSubmitted?.();
  };

  if (submitted && selectedReaction && selectedRating) {
    return (
      <FeedbackSummary
        reaction={selectedReaction}
        rating={selectedRating}
        email={emailMode !== "off" ? email : ""}
        age={ageMode !== "off" ? age : ""}
        gender={genderMode !== "off" ? gender : ""}
        description={description}
      />
    );
  }

  return (
    <div className="animate-fade-in-up [animation-delay:320ms]">
      {!selectedReaction && (
        <div className="animate-fade-in mb-5">
          <h1 className="text-[15px] font-medium required mb-3">
            How would you rate your business experience?
          </h1>
          <div
            ref={reactionRowRef}
            className={`border rounded-[10rem] p-5 flex justify-between items-center gap-1.5 sm:gap-2.5 ${
              errors.reaction ? "border-red-500" : "border-border-mute"
            }`}
          >
            {reactions.map((r) => (
              <button
                key={r.alt}
                type="button"
                onClick={() => {
                  clearError("reaction");
                  setSelectedReaction(r.alt);
                }}
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
          {errors.reaction && (
            <p className="mt-1.5 text-xs text-red-500">{errors.reaction}</p>
          )}
        </div>
      )}

      {selectedReaction && (
        <div className="animate-fade-in mb-5">
          <h1 className="text-[15px] font-medium required mb-3">
            How would you rate your business experience?
          </h1>
          <div
            ref={ratingRowRef}
            className={`relative border rounded-[10rem] p-5 flex justify-around items-center ${
              errors.rating ? "border-red-500" : "border-border-mute"
            }`}
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
          {errors.rating && (
            <p className="mt-1.5 text-xs text-red-500">{errors.rating}</p>
          )}
        </div>
      )}

      {emailMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${emailMode === "required" ? "required" : ""}`}
            htmlFor="email"
          >
            Enter Your Email
          </label>
          <input
            ref={emailRef}
            id="email"
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
            htmlFor="age"
          >
            Enter Your Age
          </label>
          <input
            ref={ageRef}
            id="age"
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

      {genderMode !== "off" && (
        <div className="mb-5">
          <label
            className={`field-label ${genderMode === "required" ? "required" : ""}`}
            htmlFor="gender"
          >
            Enter Your Gender
          </label>
          <SelectDropdown
            ref={genderRef}
            id="gender"
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
            id="consent"
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
          <label htmlFor="consent" className="text-[13px] leading-snug text-placeholder cursor-pointer">
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

export default FeedbackForm;
