import { useState, type CSSProperties, type ImgHTMLAttributes } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

type SmartImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  /** Optional lighter src used when on a slow / save-data connection. */
  slowSrc?: string;
  /** Optional fallback rendered when the image fails to load. */
  fallback?: React.ReactNode;
  /** When true, skip the skeleton placeholder. */
  noPlaceholder?: boolean;
  /** Wrapper style — useful when the consumer styles the <img> via inline style. */
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

const SmartImage = ({
  src,
  slowSrc,
  fallback,
  noPlaceholder = false,
  wrapperClassName = "",
  wrapperStyle,
  className = "",
  style,
  alt = "",
  loading = "lazy",
  decoding = "async",
  onLoad,
  onError,
  ...rest
}: SmartImageProps) => {
  const { slow } = useNetworkStatus();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const finalSrc = slow && slowSrc ? slowSrc : src;

  if (errored && fallback) {
    return <>{fallback}</>;
  }

  return (
    <span
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={wrapperStyle}
    >
      {!loaded && !noPlaceholder && (
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,#ececec_25%,#f7f7f7_50%,#ececec_75%)] bg-size-[200%_100%] animate-shimmer"
        />
      )}
      <img
        {...rest}
        src={finalSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrored(true);
          onError?.(e);
        }}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={style}
      />
    </span>
  );
};

export default SmartImage;
