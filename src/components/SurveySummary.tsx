import { toAbsoluteUrl } from "../utils/Assets";
import SmartImage from "./SmartImage";
import type { SurveyRateReactValue } from "./SurveyReactionRow";

const reactionMap: Record<string, { gif: string; bg: string; size: number }> = {
  like: { gif: "media/reactions/like.gif", bg: "bg-react-like", size: 25 },
  love: { gif: "media/reactions/love.gif", bg: "bg-react-love", size: 30 },
  fire: { gif: "media/reactions/fire.gif", bg: "bg-react-fire", size: 32 },
  sad: { gif: "media/reactions/sad.gif", bg: "bg-react-sad", size: 32 },
  haha: { gif: "media/reactions/haha.gif", bg: "bg-react-haha", size: 34 },
  wow: { gif: "media/reactions/wow.gif", bg: "bg-react-wow", size: 34 },
  angry: { gif: "media/reactions/angry.gif", bg: "bg-react-angry", size: 34 },
};

type SurveySummaryProps = {
  questionRR: Record<number, SurveyRateReactValue>;
  categories: string[];
  textAnswer: string;
  email: string;
  description?: string;
};

const SectionDivider = () => <div className="h-[1px] bg-[#D8F4E8] my-5" />;

const RateReactPill = ({ value }: { value: SurveyRateReactValue }) => {
  if (!value.reaction) return null;
  const r = reactionMap[value.reaction];
  if (!r) return null;
  return (
    <div className="inline-flex items-center border border-success rounded-full px-2 py-1.5">
      <span
        className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-white ${r.bg}`}
      >
        <SmartImage
          style={{ width: r.size, height: r.size }}
          className="object-contain"
          wrapperClassName="rounded-full"
          src={toAbsoluteUrl(r.gif)}
          alt={value.reaction}
        />
      </span>
      {value.rating != null && (
        <span className="-ml-2 w-10 h-10 rounded-full flex items-center justify-center bg-chip text-black border-2 border-white text-[16px] font-semibold">
          {value.rating}
        </span>
      )}
    </div>
  );
};

const SurveySummary = ({
  questionRR,
  categories,
  textAnswer,
  email,
  description,
}: SurveySummaryProps) => {
  return (
    <div className="border border-success bg-success-tint rounded-[30px] p-5 animate-scale-in">
      <h1 className="text-[20px] font-bold mb-5">Thanks! Here's Your Response</h1>

      <div className="mb-1">
        <p className="font-semibold text-[14px] mb-1.5">Question 1</p>
        <p className="text-placeholder text-[14px] mb-3">
          How would you rate your overall experience?
        </p>
        <RateReactPill value={questionRR[1] ?? { reaction: null, rating: null }} />
      </div>

      <SectionDivider />

      <div>
        <p className="font-semibold text-[14px] mb-1.5">Question 2</p>
        <p className="text-placeholder text-[14px] mb-3">
          How would you rate your overall experience?
        </p>
        {categories.length > 0 && (
          <div className="space-y-2 mb-3">
            {categories.map((c) => (
              <div
                key={c}
                className="rounded-full bg-white border border-option-border text-brand text-[14px] font-medium px-4 py-2.5"
              >
                {c}
              </div>
            ))}
          </div>
        )}
        <RateReactPill value={questionRR[2] ?? { reaction: null, rating: null }} />
      </div>

      <SectionDivider />

      <div>
        <p className="font-semibold text-[14px] mb-1.5">Question 3</p>
        <p className="text-placeholder text-[14px] mb-3">
          How would you rate your overall experience?
        </p>
        {textAnswer && (
          <div className="rounded-2xl bg-white border border-option-border text-option-text text-[13px] px-4 py-3 leading-normal mb-3">
            {textAnswer}
          </div>
        )}
        <RateReactPill value={questionRR[3] ?? { reaction: null, rating: null }} />
      </div>

      <SectionDivider />

      <div className="mb-4">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <SmartImage
            wrapperClassName="block w-[18px] h-[18px] shrink-0"
            className="w-full h-full"
            src={toAbsoluteUrl("media/icons/mail-at-sign.svg")}
            alt="email"
          />
          Email:
        </div>
        <p className="text-[14px] text-muted">{email}</p>
      </div>

      {description && (
        <div>
          <div className="flex items-center gap-2 font-semibold mb-1">
            <SmartImage
              wrapperClassName="block w-[18px] h-[18px] shrink-0"
              className="w-full h-full"
              src={toAbsoluteUrl("media/icons/quill-write.svg")}
              alt="description"
            />
            Description:
          </div>
          <p className="text-[14px] text-muted">{description}</p>
        </div>
      )}
    </div>
  );
};

export default SurveySummary;
