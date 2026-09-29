import { useSiteLogo, FALLBACK_LOGO_URL } from "@/hooks/useSiteLogo";

const SiteLogo = ({ className = "h-10 w-auto" }: { className?: string }) => {
  const logo = useSiteLogo();
  return (
    <img
      src={logo.url || FALLBACK_LOGO_URL}
      alt="Prime11"
      className={className}
      style={{
        transform: `translate(${logo.x}px, ${logo.y}px) scale(${logo.size / 100})`,
        transformOrigin: "left center",
      }}
    />
  );
};

export default SiteLogo;
