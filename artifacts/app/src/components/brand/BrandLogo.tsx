import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  light?: boolean;
}

export function BrandLogo({ className, markClassName, showWordmark = true, light = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className={cn("brand-float h-10 w-10 shrink-0", markClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="15" fill={light ? "#F8F6F1" : "#111318"} />
        <path d="M14 15.5h13.5A6.5 6.5 0 0 1 34 22v3.5A6.5 6.5 0 0 1 27.5 32H14V15.5Z" fill="#F07167" />
        <path d="M19 20h8.25A2.75 2.75 0 0 1 30 22.75v.5A2.75 2.75 0 0 1 27.25 26H19v-6Z" fill={light ? "#111318" : "#F8F6F1"} />
        <path d="M14 32.5h13.5A6.5 6.5 0 0 0 34 26v-3.5A6.5 6.5 0 0 0 27.5 16H14" stroke="#E8DDBD" strokeWidth="2.25" strokeLinecap="round" opacity=".9" />
        <path className="brand-spark" d="m34.5 12.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" fill="#E8DDBD" />
      </svg>
      {showWordmark && (
        <span className={cn("font-display text-[1.15rem] font-semibold tracking-[-0.04em]", light ? "text-white" : "text-[#111318] dark:text-white")}>
          AIPrintVerse<span className="text-[#F07167]">.</span>
        </span>
      )}
    </span>
  );
}
