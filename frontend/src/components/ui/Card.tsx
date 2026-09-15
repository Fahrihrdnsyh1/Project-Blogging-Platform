import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
};

export default function Card({
  as: Component = "article",
  className = "",
  ...props
}: CardProps) {
  return (
    <Component
      className={`border-3 border-ink bg-white p-5 shadow-brutal ${className}`}
      {...props}
    />
  );
}
