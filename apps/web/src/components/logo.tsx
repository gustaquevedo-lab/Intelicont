"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSlogan?: boolean;
  dark?: boolean;
  hideText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: "text-base", slogan: "text-[9px]" },
  md: { icon: 32, text: "text-xl", slogan: "text-[10px]" },
  lg: { icon: 42, text: "text-3xl", slogan: "text-xs" },
  xl: { icon: 64, text: "text-5xl", slogan: "text-sm" },
};

// Single source of truth lives at apps/web/public/brand/. See docs/BRAND.md.
export function Logo({
  size = "md",
  showSlogan = false,
  dark = false,
  hideText = false,
  className,
}: LogoProps) {
  const s = sizes[size];
  const inteliColor = dark ? "text-blue-300" : "text-[#104c91] dark:text-blue-300";
  const contColor = dark ? "text-emerald-300" : "text-[#08a14b] dark:text-emerald-300";
  const sloganColor = dark
    ? "text-blue-200/60"
    : "text-gray-400 dark:text-blue-200/60";

  return (
    <div className={cn("flex flex-col items-start gap-1 group", className)}>
      <div className="flex items-center gap-3">
        <svg
          width={s.icon * 2}
          height={s.icon}
          viewBox="0 0 72 36"
          fill="none"
          className="shrink-0 drop-shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105"
        >
          <path
            d="M 36 18 C 18 2, 4 9, 4 18 C 4 27, 18 34, 36 18 C 54 2, 68 9, 68 18 C 68 27, 54 34, 36 18 Z"
            stroke="url(#loopGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 36 11 Q 36 18 43 18 Q 36 18 36 25 Q 36 18 29 18 Q 36 18 36 11 Z"
            fill="#ffffff"
          />
          <defs>
            <linearGradient id="loopGrad" x1="4" y1="18" x2="68" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1b63c4" />
              <stop offset="35%" stopColor="#2f80ed" />
              <stop offset="50%" stopColor="#33c1cc" />
              <stop offset="70%" stopColor="#1bbb75" />
              <stop offset="100%" stopColor="#08a14b" />
            </linearGradient>
          </defs>
        </svg>

        {!hideText && (
          <div className="flex leading-none">
            <span className={cn(s.text, "font-extrabold tracking-tight", inteliColor)}>
              Inteli
            </span>
            <span className={cn(s.text, "font-extrabold tracking-tight", contColor)}>
              Cont
            </span>
          </div>
        )}
      </div>
      {showSlogan && (
        <p className={cn(s.slogan, "font-bold uppercase tracking-[0.2em] ml-1", sloganColor)}>
          Contabilidad Inteligente
        </p>
      )}
    </div>
  );
}

/**
 * Inline bicolor wordmark for use inside headings / body copy.
 * Inherits font-size and base styles from the parent — only sets colors.
 * Example:  <h1 className="text-2xl font-bold">Bienvenido a <Wordmark /></h1>
 */
export function Wordmark({ dark = false }: { dark?: boolean }) {
  const a = dark ? "text-blue-300" : "text-[#104c91] dark:text-blue-300";
  const b = dark ? "text-emerald-300" : "text-[#08a14b] dark:text-emerald-300";
  return (
    <>
      <span className={a}>Inteli</span>
      <span className={b}>Cont</span>
    </>
  );
}
