import { toAbsoluteUrl } from "../utils/Assets";
import SmartImage from "./SmartImage";

const reactionMap: Record<string, { gif: string; bg: string; size: number }> = {
  like: { gif: "media/reactions/like.gif", bg: "bg-react-like", size: 24 },
  love: { gif: "media/reactions/love.gif", bg: "bg-react-love", size: 28 },
  fire: { gif: "media/reactions/fire.gif", bg: "bg-react-fire", size: 30 },
  sad: { gif: "media/reactions/sad.gif", bg: "bg-react-sad", size: 30 },
  haha: { gif: "media/reactions/haha.gif", bg: "bg-react-haha", size: 32 },
  wow: { gif: "media/reactions/wow.gif", bg: "bg-react-wow", size: 32 },
  angry: { gif: "media/reactions/angry.gif", bg: "bg-react-angry", size: 32 },
};

type SurveySummaryProps = {
  reaction: string;
  rating: number;
  categories: string[];
  textAnswer: string;
  email: string;
  description?: string;
};

const SectionDivider = () => <div className="h-[1px] bg-[#D8F4E8] my-5" />;

const SurveySummary = ({
  reaction,
  rating,
  categories,
  textAnswer,
  email,
  description,
}: SurveySummaryProps) => {
  const r = reactionMap[reaction];

  return (
    <div className="border border-success bg-success-tint rounded-[30px] p-5 mb-5 animate-scale-in">
      <h1 className="text-[20px] font-bold mb-5">Thanks! Here's Your Response</h1>

      <div className="mb-1">
        <p className="font-semibold text-[14px] mb-1.5">Question 1</p>
        <p className="text-placeholder text-[14px] mb-3">
          How would you rate your overall experience?
        </p>
        <span
          className={`inline-flex w-10 h-10 rounded-full items-center justify-center overflow-hidden border-2 border-white ${r.bg}`}
        >
          <SmartImage
            style={{ width: r.size, height: r.size }}
            className="object-contain"
            wrapperClassName="rounded-full"
            src={toAbsoluteUrl(r.gif)}
            alt={reaction}
          />
        </span>
      </div>

      <SectionDivider />

      <div>
        <p className="font-semibold text-[14px] mb-1.5">Question 2</p>
        <p className="text-placeholder text-[14px] mb-3">What would you like to ask?</p>
        <span className="inline-flex w-10 h-10 rounded-full items-center justify-center bg-brand text-white text-[16px] font-semibold border-2 border-white">
          {rating}
        </span>
      </div>

      <SectionDivider />

      <div>
        <p className="font-semibold text-[14px] mb-1.5">Question 3</p>
        <p className="text-placeholder text-[14px] mb-3">
          How would you rate your overall experience?
        </p>
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c}
              className="rounded-full bg-white border border-option-border text-brand text-[14px] font-medium px-4 py-2.5"
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div>
        <p className="font-semibold text-[14px] mb-1.5">Question 4</p>
        <p className="text-placeholder text-[14px] mb-3">
          How would you rate your overall experience?
        </p>
        <div className="rounded-2xl bg-white border border-option-border text-option-text text-[13px] px-4 py-3 leading-normal">
          {textAnswer}
        </div>
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
