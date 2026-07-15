"use client";

import { cn } from "@/lib/utils";

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-8", className)}>
      <div className="w-5 h-5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      <span className="text-sm text-foreground/60">بنحضّر الشاي…</span>
    </div>
  );
}
