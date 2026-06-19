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
        {/* Isotipo: squircle con ícono de contabilidad */}
        <div className="relative">
          <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" className="shrink-0 drop-shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-110">
            <rect width="40" height="40" rx="10" fill="url(#logoGradIC)" />
            
            {/* Ícono de Ledger/Cuentas simplificado */}
            <rect x="10" y="10" width="20" height="20" rx="2" stroke="white" strokeWidth="2.5" fill="none" />
            <line x1="14" y1="15" x2="26" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="20" x2="26" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="25" x2="20" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
            
            {/* Punto de acento (Green) */}
            <circle cx="28" cy="28" r="5" fill="#00a651" className="animate-ai-pulse" />
            <path d="M26.5 28L27.5 29L29.5 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            <defs>
              <linearGradient id="logoGradIC" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#256ebf" />
                <stop offset="100%" stopColor="#104c91" />
              </linearGradient>
            </defs>
          </svg>
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none rounded-[10px]" />
        </div>

        {/* Wordmark */}
        <div className="flex flex-col leading-none">
          <span className={cn(s.text, "font-black tracking-tighter", textColor)}>
            <span className="text-primary-light dark:text-blue-400 group-hover:text-primary transition-colors">Inteli</span>
            <span className="text-secondary group-hover:text-secondary-dark transition-colors">Cont</span>
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
