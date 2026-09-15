import { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`min-h-32 w-full resize-y border-3 border-ink bg-white px-3 py-3 font-body text-base leading-7 text-ink outline-none transition-[box-shadow,background-color] placeholder:text-ink/50 focus:bg-mint focus:shadow-brutal-sm ${className}`}
      {...props}
    />
  );
}
