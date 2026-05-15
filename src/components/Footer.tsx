import { toAbsoluteUrl } from "../utils/Assets";

const Footer = () => {
  return (
    <footer className="w-full py-4 flex items-center justify-center gap-2">
      <span className="text-footer-text text-[14px]">Powered by</span>
      <img
        src={toAbsoluteUrl("media/logos/footerlogo.svg")}
        alt="Rate + React AI"
        className="w-[90px]"
      />
    </footer>
  );
};

export default Footer;
