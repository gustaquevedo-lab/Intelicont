"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  dark?: boolean;
  hideText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 'text-base', slogan: 'text-[9px]' },
  md: { icon: 32, text: 'text-xl', slogan: 'text-[10px]' },
  lg: { icon: 42, text: 'text-3xl', slogan: 'text-xs' },
  xl: { icon: 64, text: 'text-5xl', slogan: 'text-sm' },
};

export function Logo({ size = 'md', showSlogan = false, dark = false, hideText = false, className }: LogoProps) {
  const s = sizes[size];
  const textColor = dark ? 'text-white' : 'text-gray-900 dark:text-white';
  const sloganColor = dark ? 'text-blue-200/60' : 'text-gray-400 dark:text-blue-200/60';

  return (
    <div className={cn("flex flex-col items-start gap-1 group", className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <svg 
            width={hideText ? s.icon : s.icon * 1.8} 
            height={s.icon} 
            viewBox="0 0 72 36" 
            fill="none" 
            style={{ overflow: 'visible' }}
            className="shrink-0 drop-shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105"
          >
            {/* Balance Loop Infinity Shape - 3D Gradient matching the user's logo exactly */}
            <path 
              d="M 36 18 C 18 4, 6 10, 6 18 C 6 26, 18 32, 36 18 C 54 4, 66 10, 66 18 C 66 26, 54 32, 36 18 Z" 
              stroke="url(#loopGrad)" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />
            
            {/* Spark (shining 4-pointed star) at the center crossing */}
            <path 
              d="M 36 11 Q 36 18 43 18 Q 36 18 36 25 Q 36 18 29 18 Q 36 18 36 11 Z" 
              fill="#ffffff" 
              className="drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
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
        </div>
 
        {/* Wordmark */}
        {!hideText && (
          <div className="flex flex-col leading-none">
            <span className={cn(s.text, "font-bold tracking-tight text-slate-800 dark:text-white")}>
              InteliCont
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
