"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  className?: string;
}

const sizes = {
  sm: { icon: 28, font: 15 },
  md: { icon: 36, font: 19 },
  lg: { icon: 44, font: 23 },
  xl: { icon: 60, font: 31 },
};

export function Logo({ size = "md", variant = "full", className }: LogoProps) {
  const s = sizes[size];

  const Isotipo = () => (
    <svg
      width={s.icon}
      height={s.icon}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="ic-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a6eff" />
          <stop offset="1" stopColor="#0d47c9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#ic-bg)" />
      {/* T-account: barra horizontal superior */}
      <rect x="7" y="12" width="26" height="2.5" rx="1.25" fill="white" />
      {/* T-account: divisor vertical central */}
      <rect x="18.75" y="12" width="2.5" height="17" rx="1.25" fill="white" />
      {/* Lado débito (izquierda) */}
      <rect x="9" y="19.5" width="7" height="2" rx="1" fill="rgba(255,255,255,0.8)" />
      <rect x="9" y="23.5" width="5" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      {/* Lado crédito (derecha): check verde = partida cuadrada */}
      <path d="M23.5 21.5 L26 24.5 L32 18" stroke="#00d46a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Punto acento */}
      <circle cx="33.5" cy="6.5" r="3.5" fill="#00a651" />
    </svg>
  );

  if (variant === "icon") {
    return <div className={cn("inline-flex", className)}><Isotipo /></div>;
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("inline-flex items-baseline", className)}>
        <span style={{ fontSize: s.font, fontWeight: 900, color: "#1a6eff", letterSpacing: "-0.03em", lineHeight: 1 }}>Inteli</span>
        <span style={{ fontSize: s.font, fontWeight: 300, color: "#00a651", letterSpacing: "-0.03em", lineHeight: 1 }}>Cont</span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Isotipo />
      <div className="flex items-baseline">
        <span style={{ fontSize: s.font, fontWeight: 900, color: "#1a6eff", letterSpacing: "-0.03em", lineHeight: 1 }}>Inteli</span>
        <span style={{ fontSize: s.font, fontWeight: 300, color: "#00a651", letterSpacing: "-0.03em", lineHeight: 1 }}>Cont</span>
      </div>
    </div>
  );
}

export default Logo;
