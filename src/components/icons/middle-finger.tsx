import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

export function MiddleFinger({ className }: IconProps) {
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
      {/* Middle finger extended up */}
      <path d="M12 2v8" />
      {/* Index finger curled */}
      <path d="M9 10c0-1.5 0-3 1.5-3" />
      {/* Ring finger curled */}
      <path d="M15 10c0-1.5 0-3-1.5-3" />
      {/* Pinky curled */}
      <path d="M17 11c0-1-.5-2-1.5-2" />
      {/* Thumb */}
      <path d="M7 13c-.5-.5-1.5-.5-2 0" />
      {/* Palm / hand base */}
      <path d="M8 10c-1 0-1.5 1-1.5 2v3a5 5 0 0 0 5 5h1a5 5 0 0 0 5-5v-3c0-1-.5-2-1.5-2" />
      {/* Knuckle line */}
      <path d="M12 10v-1" />
    </svg>
  );
}
