import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

export function WowFace({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-5 h-5", className)}
      aria-hidden
    >
      {/* Face circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Left wide eye */}
      <circle cx="8.5" cy="9" r="1.8" fill="currentColor" stroke="none" />
      {/* Right wide eye */}
      <circle cx="15.5" cy="9" r="1.8" fill="currentColor" stroke="none" />
      {/* Open surprised mouth (oval) */}
      <ellipse cx="12" cy="16" rx="2" ry="2.8" />
    </svg>
  );
}
