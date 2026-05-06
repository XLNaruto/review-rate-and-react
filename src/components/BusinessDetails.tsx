import { toAbsoluteUrl } from "../utils/Assets";

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
      <div className="mb-5">
        <h5 className="text-center text-muted-dark text-[14px] mb-2">Business</h5>
        <img
          className="mx-auto w-[60px] h-[60px] rounded-full"
          src={toAbsoluteUrl(props.logo)}
          alt={props.name}
        />
        <h1 className="text-[18px] font-bold text-center mt-2 mb-4">
          {props.name}
        </h1>
        <img
          className="w-full"
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
      <div className="mb-5">
        <h5 className="text-center text-muted-dark text-[14px] mb-2">Business</h5>
        <img
          className="mx-auto w-[90px] h-[90px] rounded-full"
          src={toAbsoluteUrl(props.logo)}
          alt={props.name}
        />
        <h1 className="text-[20px] font-bold text-center mt-2">{props.name}</h1>
        <h3 className="text-[16px] italic text-center text-muted mt-2">
          {props.location}
        </h3>
      </div>

      <div className="bg-surface rounded-[30px] p-5 mb-5">
        <h1 className="font-bold text-[18px] leading-[1.1] mb-5">
          About Business
        </h1>
        <div className="flex items-start gap-[15px]">
          <img
            className="w-[24px] h-[24px]"
            src={toAbsoluteUrl("media/icons/filter-mail-edit.svg")}
            alt="about"
          />
          <p className="w-full text-[14px]">{props.about}</p>
        </div>
        <div className="w-full h-[1px] bg-divider my-5"></div>
        <div className="flex items-start gap-[15px]">
          <img
            className="w-[24px] h-[24px]"
            src={toAbsoluteUrl("media/icons/link.svg")}
            alt="link"
          />
          <p className="w-full text-[14px]">{props.website}</p>
        </div>
      </div>

      <div className="flex justify-center items-center gap-[20px] mb-7">
        {socials.map((s) => (
          <img
            key={s}
            className="w-[30px] h-[30px]"
            src={toAbsoluteUrl(`media/social/${s}.svg`)}
            alt={s}
          />
        ))}
      </div>
    </>
  );
};

export default BusinessDetails;
