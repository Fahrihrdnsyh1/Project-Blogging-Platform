import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-12 w-full border-3 border-ink bg-white px-3 font-body text-base text-ink outline-none transition-[box-shadow,background-color] placeholder:text-ink/50 focus:bg-butter focus:shadow-brutal-sm ${className}`}
      {...props}
    />
  );
}
