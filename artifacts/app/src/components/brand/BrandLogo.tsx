import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  light?: boolean;
}

export function BrandLogo({ className, markClassName, showWordmark = true, light = false }: BrandLogoProps) {
  const ink = light ? "#F8F6F1" : "#111318";
  const surface = light ? "#111318" : "#F8F6F1";

  return (
    <span className={cn("inline-flex items-center gap-3", className)} aria-label="AIPrintVerse">
      <svg
        viewBox="0 0 56 56"
        role="img"
        aria-label="AIPrintVerse mark"
        className={cn("brand-mark h-10 w-10 shrink-0", markClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ai-print-coral" x1="9" y1="8" x2="48" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9A83" />
            <stop offset="1" stopColor="#F07167" />
          </linearGradient>
          <linearGradient id="ai-print-paper" x1="14" y1="12" x2="43" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF8E8" />
            <stop offset="1" stopColor="#E8DDBD" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="54" height="54" rx="17" fill={light ? "#F8F6F1" : "#111318"} />
        <rect x="1" y="1" width="54" height="54" rx="17" stroke={light ? "#F8F6F1" : "#111318"} strokeOpacity=".12" strokeWidth="2" />
        <path className="brand-layer brand-layer-back" d="M17.2 13.5h18.4c5.3 0 9.6 4.3 9.6 9.6v9.7c0 5.3-4.3 9.6-9.6 9.6H17.2V13.5Z" fill={ink} fillOpacity=".32" />
        <path className="brand-layer brand-layer-mid" d="M13.8 16.9h18.4c5.3 0 9.6 4.3 9.6 9.6v9.7c0 5.3-4.3 9.6-9.6 9.6H13.8V16.9Z" fill="url(#ai-print-coral)" />
        <path d="M18.8 22h11.4a5 5 0 0 1 5 5v1.4a5 5 0 0 1-5 5H18.8V22Z" fill={surface} />
        <path className="brand-layer brand-layer-front" d="M18.8 22h6.1a5 5 0 0 1 5 5v1.4a5 5 0 0 1-5 5h-6.1V22Z" fill={ink} />
        <path d="M13.8 36.2h16.4" stroke="url(#ai-print-paper)" strokeWidth="2.2" strokeLinecap="round" />
        <path className="brand-spark" d="m42.3 11.2.95 2.6 2.55.95-2.55.95-.95 2.6-.95-2.6-2.55-.95 2.55-.95.95-2.6Z" fill="url(#ai-print-paper)" />
      </svg>
      {showWordmark && (
        <span className={cn("font-display text-[1.12rem] font-semibold tracking-[-0.045em]", light ? "text-white" : "text-[#111318] dark:text-white")}>
          AIPrintVerse<span className="text-[#F07167]">.</span>
        </span>
      )}
    </span>
  );
}
