import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSiteLogo, FALLBACK_LOGO_URL, getPagePlacements, pageKeyFromPath, type LogoDevice } from "@/hooks/useSiteLogo";

const getDevice = (): LogoDevice => {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
};

const SiteLogo = ({ className = "h-10 w-auto" }: { className?: string }) => {
  const logo = useSiteLogo();
  const { pathname } = useLocation();
  const [device, setDevice] = useState<LogoDevice>(getDevice);

  useEffect(() => {
    const updateDevice = () => setDevice(getDevice());
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  const placement = getPagePlacements(logo, pageKeyFromPath(pathname))[device];
  return (
    <img
      src={logo.url || FALLBACK_LOGO_URL}
      alt="Prime11"
      className={className}
      style={{
        transform: `translate(${placement.x}px, ${placement.y}px) scale(${placement.size / 100})`,
        transformOrigin: "center center",
      }}
    />
  );
};

export default SiteLogo;
