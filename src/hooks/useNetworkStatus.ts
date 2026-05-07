import { useEffect, useState } from "react";

type NetworkInformation = {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
};

const getConnection = (): NetworkInformation | undefined => {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
};

export type NetworkStatus = {
  online: boolean;
  slow: boolean;
  effectiveType?: string;
};

export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    const conn = getConnection();
    return {
      online: typeof navigator === "undefined" ? true : navigator.onLine,
      slow:
        conn?.effectiveType === "slow-2g" ||
        conn?.effectiveType === "2g" ||
        !!conn?.saveData,
      effectiveType: conn?.effectiveType,
    };
  });

  useEffect(() => {
    const update = () => {
      const conn = getConnection();
      setStatus({
        online: navigator.onLine,
        slow:
          conn?.effectiveType === "slow-2g" ||
          conn?.effectiveType === "2g" ||
          !!conn?.saveData,
        effectiveType: conn?.effectiveType,
      });
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const conn = getConnection();
    conn?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener?.("change", update);
    };
  }, []);

  return status;
};
