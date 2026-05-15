import { toAbsoluteUrl } from "../utils/Assets";
import SmartImage from "./SmartImage";

const reactionMap: Record<string, { gif: string; bg: string; size: number }> = {
  like: { gif: "media/reactions/like.gif", bg: "bg-react-like", size: 25 },
  love: { gif: "media/reactions/love.gif", bg: "bg-react-love", size: 30 },
  fire: { gif: "media/reactions/fire.gif", bg: "bg-react-fire", size: 32 },
  sad: { gif: "media/reactions/sad.gif", bg: "bg-react-sad", size: 32 },
  haha: { gif: "media/reactions/haha.gif", bg: "bg-react-haha", size: 34 },
  wow: { gif: "media/reactions/wow.gif", bg: "bg-react-wow", size: 34 },
  angry: { gif: "media/reactions/angry.gif", bg: "bg-react-angry", size: 34 },
};

type FeedbackSummaryProps = {
  reaction: string;
  rating: number;
  email: string;
  description?: string;
};

const FeedbackSummary = ({
  reaction,
  rating,
  email,
  description,
}: FeedbackSummaryProps) => {
  const r = reactionMap[reaction];

  return (
    <div className="border border-success bg-success-tint rounded-[30px] p-5 mb-5 animate-scale-in">
      <div className="inline-flex items-center border border-success rounded-full px-2 py-1.5 mb-5 animate-pop [animation-delay:200ms]">
        <span
          className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-white ${r.bg}`}
        >
          <SmartImage
            style={{ width: r.size, height: r.size }}
            className="object-contain"
            wrapperClassName="rounded-full"
            src={toAbsoluteUrl(r.gif)}
            alt={reaction}
          />
        </span>
        <span className="-ml-2 w-12 h-12 rounded-full flex items-center justify-center bg-chip text-black border-2 border-white text-[18px] font-semibold">
          {rating}
        </span>
      </div>

      <div className="mb-5">
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

export default FeedbackSummary;
