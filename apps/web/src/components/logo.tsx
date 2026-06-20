"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  dark?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 'text-base', slogan: 'text-[9px]' },
  md: { icon: 32, text: 'text-xl', slogan: 'text-[10px]' },
  lg: { icon: 42, text: 'text-3xl', slogan: 'text-xs' },
  xl: { icon: 64, text: 'text-5xl', slogan: 'text-sm' },
};

export function Logo({ size = 'md', showSlogan = false, dark = false, className }: LogoProps) {
  const s = sizes[size];
  const textColor = dark ? 'text-white' : 'text-gray-900 dark:text-white';
  const sloganColor = dark ? 'text-blue-200/60' : 'text-gray-400 dark:text-blue-200/60';

  return (
    <div className={cn("flex flex-col items-start gap-1 group", className)}>
      <div className="flex items-center gap-3">
        {/* Isotipo: Opción 1 - Balance Loop (Infinity loop estilizado) */}
        <div className="relative">
          <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" className="shrink-0 drop-shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-110">
            <rect width="40" height="40" rx="10" fill="url(#logoGradIC)" />
            
            {/* Balance Loop Infinity Shape - Colorful Gradient */}
            <path d="M12 20 C12 15, 17 15, 20 20 C23 25, 28 25, 28 20 C28 15, 23 15, 20 20 C17 25, 12 25, 12 20 Z" stroke="url(#loopGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            
            {/* Spark at the junction */}
            <path d="M20 17 L20 23 M17 20 L23 20" stroke="#00d46a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="1.5" fill="white" />
            
            <defs>
              <linearGradient id="logoGradIC" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#104c91" />
                <stop offset="100%" stopColor="#0a2244" />
              </linearGradient>
              <linearGradient id="loopGrad" x1="12" y1="15" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
          </svg>
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none rounded-[10px]" />
        </div>
 
        {/* Wordmark */}
        <div className="flex flex-col leading-none">
          <span className={cn(s.text, "font-black tracking-tighter bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent")}>
            InteliCont
          </span>
        </div>
      </div>
      {showSlogan && (
        <p className={cn(s.slogan, "font-bold uppercase tracking-[0.2em] ml-1", sloganColor)}>
          Contabilidad Inteligente
        </p>
      )}
    </div>
  );
}
