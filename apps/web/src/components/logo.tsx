"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  dark?: boolean;
  className?: string;
}

const sizes = {
  sm: { iconW: 36, iconH: 18, text: 'text-base', slogan: 'text-[9px]' },
  md: { iconW: 48, iconH: 24, text: 'text-xl', slogan: 'text-[10px]' },
  lg: { iconW: 63, iconH: 31, text: 'text-3xl', slogan: 'text-xs' },
  xl: { iconW: 96, iconH: 48, text: 'text-5xl', slogan: 'text-sm' },
};

export function Logo({ size = 'md', showSlogan = false, dark = false, className }: LogoProps) {
  // useId prevents gradient-id collisions when multiple <Logo> render on the same page
  const uid = useId().replace(/:/g, '');
  const s = sizes[size];
  const textColor = dark ? 'text-white' : 'text-gray-900 dark:text-white';
  const sloganColor = dark ? 'text-blue-200/60' : 'text-gray-400 dark:text-blue-200/60';
  const inteliColor = dark ? '#60a5fa' : '#104c91';
  const contColor  = dark ? '#34d399' : '#08a14b';

  return (
    <div className={cn("flex flex-col items-start gap-1 group", className)}>
      <div className="flex items-center gap-3">
        {/* Isotipo aprobado: bucle doble con gradiente azul→verde */}
        <div className="relative shrink-0 transition-transform duration-500 group-hover:scale-110">
          <svg width={s.iconW} height={s.iconH} viewBox="0 0 72 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 36 18 C 18 2, 4 9, 4 18 C 4 27, 18 34, 36 18 C 54 2, 68 9, 68 18 C 68 27, 54 34, 36 18 Z"
              stroke={`url(#loopGrad${uid})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 36 11 Q 36 18 43 18 Q 36 18 36 25 Q 36 18 29 18 Q 36 18 36 11 Z"
              fill={`url(#sparkGrad${uid})`}
            />
            <defs>
              <linearGradient id={`loopGrad${uid}`} x1="4" y1="18" x2="68" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#1b63c4" />
                <stop offset="35%"  stopColor="#2f80ed" />
                <stop offset="50%"  stopColor="#33c1cc" />
                <stop offset="70%"  stopColor="#1bbb75" />
                <stop offset="100%" stopColor="#08a14b" />
              </linearGradient>
              <linearGradient id={`sparkGrad${uid}`} x1="29" y1="18" x2="43" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col leading-none">
          <span className={cn(s.text, "font-black tracking-tighter", textColor)}>
            <span style={{ color: inteliColor }}>Inteli</span>
            <span style={{ color: contColor }}>Cont</span>
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
