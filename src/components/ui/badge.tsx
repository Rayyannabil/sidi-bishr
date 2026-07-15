import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "secondary" | "teal" | "tea" | "destructive" | "outline";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-teal text-white",
    secondary: "bg-muted text-foreground",
    teal: "bg-teal/10 text-teal border border-teal/20",
    tea: "bg-tea-100 text-tea-700 border border-tea-200",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-border text-foreground",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
