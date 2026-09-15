import { HTMLAttributes } from "react";

type BadgeTone = "butter" | "mint" | "coral" | "sky";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  butter: "bg-butter",
  mint: "bg-mint",
  coral: "bg-coral",
  sky: "bg-sky",
};

export default function Badge({
  tone = "butter",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex border-2 border-ink px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
