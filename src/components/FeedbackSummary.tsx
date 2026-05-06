import { toAbsoluteUrl } from "../utils/Assets";

const reactionMap: Record<string, { gif: string; bg: string; size: number }> = {
  like: { gif: "media/reactions/like.gif", bg: "bg-react-like", size: 24 },
  love: { gif: "media/reactions/love.gif", bg: "bg-react-love", size: 28 },
  fire: { gif: "media/reactions/fire.gif", bg: "bg-react-fire", size: 30 },
  wow: { gif: "media/reactions/wow.gif", bg: "bg-react-wow", size: 32 },
  haha: { gif: "media/reactions/haha.gif", bg: "bg-react-haha", size: 32 },
  angry: { gif: "media/reactions/angry.gif", bg: "bg-react-angry", size: 32 },
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
    <div className="border border-success rounded-[30px] p-5 mb-5">
      <div className="inline-flex items-center gap-2 border border-success rounded-full p-1 pr-4 mb-5">
        <span
          className={`w-[40px] h-[40px] rounded-full flex items-center justify-center overflow-hidden ${r.bg}`}
        >
          <img
            style={{ width: r.size, height: r.size }}
            className="object-contain"
            src={toAbsoluteUrl(r.gif)}
            alt={reaction}
          />
        </span>
        <span className="text-[18px] font-semibold">{rating}</span>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <img
            className="w-[18px] h-[18px]"
            src={toAbsoluteUrl("media/icons/mail-at-sign.svg")}
            alt="email"
          />
          Email:
        </div>
        <p className="text-[14px] text-muted-dark">{email}</p>
      </div>

      {description && (
        <div>
          <div className="flex items-center gap-2 font-semibold mb-1">
            <img
              className="w-[18px] h-[18px]"
              src={toAbsoluteUrl("media/icons/quill-write.svg")}
              alt="description"
            />
            Description:
          </div>
          <p className="text-[14px] text-muted-dark">{description}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackSummary;
