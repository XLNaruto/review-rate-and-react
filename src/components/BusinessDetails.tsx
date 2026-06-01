import { toAbsoluteUrl } from "../utils/Assets";
import SmartImage from "./SmartImage";

const resolveSrc = (src: string) =>
  /^(https?:)?\/\//i.test(src) || src.startsWith("data:") ? src : toAbsoluteUrl(src);

type SocialKey = "instagram" | "tiktok" | "youtube" | "rueblur";

const SOCIAL_ICON_KEYS: SocialKey[] = ["instagram", "youtube", "tiktok", "rueblur"];

type BusinessVariant = {
  variant: "business";
  logo: string;
  name: string;
  location: string;
  about: string;
  website: string;
  socialLinks?: Partial<Record<string, string>>;
};

type ProductVariant = {
  variant: "product";
  logo: string;
  name: string;
  productImage: string;
  productName: string;
};

type BusinessDetailsProps = BusinessVariant | ProductVariant;

const BusinessDetails = (props: BusinessDetailsProps) => {
  if (props.variant === "product") {
    return (
      <div className="mb-5 animate-fade-in-up [animation-delay:80ms]">
        <h5 className="text-center text-muted-dark text-[14px] mb-2">Business</h5>
        <SmartImage
          wrapperClassName="block mx-auto w-[90px] h-[90px] rounded-full"
          className="w-full h-full object-cover rounded-full"
          src={resolveSrc(props.logo)}
          alt={props.name}
        />
        <h1 className="text-[20px] font-bold text-center mt-2 mb-4">
          {props.name}
        </h1>
        <SmartImage
          wrapperClassName="block w-full aspect-square rounded-2xl"
          className="w-full h-full object-cover"
          src={resolveSrc(props.productImage)}
          alt={props.productName}
        />
        <h1 className="text-[22px] font-bold text-center mt-5">
          {props.productName}
        </h1>
      </div>
    );
  }

  const links = props.socialLinks ?? {};
  const activeSocials = SOCIAL_ICON_KEYS.filter((k) => {
    const url = links[k];
    return typeof url === "string" && url.trim() !== "";
  });
  const hasAbout = !!props.about && props.about.trim() !== "";
  const hasWebsite = !!props.website && props.website.trim() !== "";

  return (
    <>
      <div className="mb-5 animate-fade-in-up [animation-delay:80ms]">
        <h5 className="text-center text-muted-dark text-[14px] mb-2">Business</h5>
        <SmartImage
          wrapperClassName="block mx-auto w-[90px] h-[90px] rounded-full"
          className="w-full h-full object-cover rounded-full"
          src={resolveSrc(props.logo)}
          alt={props.name}
        />
        <h1 className="text-[20px] font-bold text-center mt-2">{props.name}</h1>
        {props.location && (
          <h3 className="text-[16px] italic text-center text-muted mt-2">
            {props.location}
          </h3>
        )}
      </div>

      {hasAbout && (
        <div className="bg-surface rounded-[30px] p-5 mb-5 animate-fade-in-up [animation-delay:160ms]">
          <h1 className="font-bold text-[18px] leading-[1.1] mb-5">
            About Business
          </h1>
          <div className="flex items-start gap-[15px]">
            <SmartImage
              wrapperClassName="block w-[24px] h-[24px] shrink-0"
              className="w-full h-full"
              src={toAbsoluteUrl("media/icons/filter-mail-edit.svg")}
              alt="about"
            />
            <p className="w-full text-[14px]">{props.about}</p>
          </div>
        </div>
      )}

      {hasWebsite && (
        <div className="bg-surface rounded-[30px] p-5 mb-5 animate-fade-in-up [animation-delay:200ms]">
          <div className="flex items-start gap-[15px]">
            <SmartImage
              wrapperClassName="block w-[24px] h-[24px] shrink-0"
              className="w-full h-full"
              src={toAbsoluteUrl("media/icons/link.svg")}
              alt="link"
            />
            <a
              href={/^https?:\/\//i.test(props.website) ? props.website : `https://${props.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-[14px] cursor-pointer hover:text-blue-600 hover:underline transition-colors break-all"
            >
              {props.website}
            </a>
          </div>
        </div>
      )}

      {activeSocials.length > 0 && (
        <div className="flex justify-center items-center gap-[20px] mb-7 animate-fade-in-up [animation-delay:240ms]">
          {activeSocials.map((s) => (
            <a
              key={s}
              href={links[s]}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-[30px] h-[30px] cursor-pointer transition-transform duration-200 ease-out hover:scale-125 active:scale-110 rounded-full"
            >
              <SmartImage
                wrapperClassName="block w-full h-full"
                className="w-full h-full"
                src={toAbsoluteUrl(`media/social/${s}.svg`)}
                alt={s}
              />
            </a>
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessDetails;
