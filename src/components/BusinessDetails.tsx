import { toAbsoluteUrl } from "../utils/Assets";
import SmartImage from "./SmartImage";

type SocialKey = "rueblur" | "instagram" | "tiktok" | "youtube";

type BusinessVariant = {
  variant: "business";
  logo: string;
  name: string;
  location: string;
  about: string;
  website: string;
  socials?: SocialKey[];
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
          wrapperClassName="block mx-auto w-[60px] h-[60px] rounded-full"
          className="w-full h-full object-cover rounded-full"
          src={toAbsoluteUrl(props.logo)}
          alt={props.name}
        />
        <h1 className="text-[18px] font-bold text-center mt-2 mb-4">
          {props.name}
        </h1>
        <SmartImage
          wrapperClassName="block w-full aspect-square rounded-2xl"
          className="w-full h-full object-cover"
          src={toAbsoluteUrl(props.productImage)}
          alt={props.productName}
        />
        <h1 className="text-[22px] font-bold text-center mt-5">
          {props.productName}
        </h1>
      </div>
    );
  }

  const socials = props.socials ?? ["rueblur", "instagram", "tiktok", "youtube"];
  return (
    <>
      <div className="mb-5 animate-fade-in-up [animation-delay:80ms]">
        <h5 className="text-center text-muted-dark text-[14px] mb-2">Business</h5>
        <SmartImage
          wrapperClassName="block mx-auto w-[90px] h-[90px] rounded-full"
          className="w-full h-full object-cover rounded-full"
          src={toAbsoluteUrl(props.logo)}
          alt={props.name}
        />
        <h1 className="text-[20px] font-bold text-center mt-2">{props.name}</h1>
        <h3 className="text-[16px] italic text-center text-muted mt-2">
          {props.location}
        </h3>
      </div>

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
        <div className="w-full h-[1px] bg-divider my-5"></div>
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

      <div className="flex justify-center items-center gap-[20px] mb-7 animate-fade-in-up [animation-delay:240ms]">
        {socials.map((s) => (
          <SmartImage
            key={s}
            wrapperClassName="block w-[30px] h-[30px] cursor-pointer transition-transform duration-200 ease-out hover:scale-125 active:scale-110 rounded-full"
            className="w-full h-full"
            src={toAbsoluteUrl(`media/social/${s}.svg`)}
            alt={s}
          />
        ))}
      </div>
    </>
  );
};

export default BusinessDetails;
