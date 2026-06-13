import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  type?: "button" | "submit";
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center cursor-pointer justify-center gap-2 font-semibold rounded transition-all duration-200 " +
    "select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1f22] " +
    "disabled:opacity-40 disabled:cursor-not-allowed shrink-0";

  const variants: Record<string, string> = {
    primary:
      "bg-[#ec4f31] hover:bg-[#d43d20] active:bg-[#b83017] text-white shadow-lg shadow-[#ec4f31]/25 focus-visible:ring-[#ec4f31]",
    danger:
      "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:from-red-700 active:to-orange-700 " +
      "text-white shadow-lg shadow-red-500/20 focus-visible:ring-red-500",
    ghost:
      "bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.04] text-[#e8e8ea] " +
      "border border-white/[0.09] hover:border-white/[0.16] focus-visible:ring-white/30",
  };

  const sizes: Record<string, string> = {
    sm: "text-[12px] px-3.5 py-1.5",
    md: "text-[13px] px-5 py-2.5",
    lg: "text-[13px] px-7 py-3",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative overflow-hidden ${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {(variant === "primary" || variant === "danger") && (
        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></span>
      )}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <Loader2 size={13} className="animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0 flex items-center group-hover:scale-110 transition-transform">
            {icon}
          </span>
        ) : null}
        {children}
      </span>
    </button>
  );
}
