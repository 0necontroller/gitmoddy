import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AppButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

export default function AppButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  type = 'button',
}: AppButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ' +
    'select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1f22] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed shrink-0';

  const variants: Record<string, string> = {
    primary:
      'bg-[#4b8ef0] hover:bg-[#3a7de0] active:bg-[#2d6fd4] text-white shadow-lg shadow-[#4b8ef0]/25 focus-visible:ring-[#4b8ef0]',
    danger:
      'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:from-red-700 active:to-orange-700 ' +
      'text-white shadow-lg shadow-red-500/20 focus-visible:ring-red-500',
    ghost:
      'bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.04] text-[#e8e8ea] ' +
      'border border-white/[0.09] hover:border-white/[0.16] focus-visible:ring-white/30',
  };

  const sizes: Record<string, string> = {
    sm: 'text-[12px] px-3.5 py-1.5',
    md: 'text-[13px] px-5 py-2.5',
    lg: 'text-[13px] px-7 py-3',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
