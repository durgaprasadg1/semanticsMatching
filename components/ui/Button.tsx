"use client";

import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800",
    ghost: "text-neutral-700 hover:bg-neutral-100",
    danger: "text-red-600 hover:bg-red-50",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
