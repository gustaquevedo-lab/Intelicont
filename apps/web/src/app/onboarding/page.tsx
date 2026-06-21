"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, Calculator, FileText, CheckCircle2,
  ArrowRight, ArrowLeft, Sparkles, Zap, Shield,
  Globe, BarChart3, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/logo";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bienvenido a InteliCont",
    description: "El sistema contable más inteligente de Paraguay. AI-first, multi-tenant, cumplimiento fiscal automático.",
    icon: Sparkles,
    color: "from-primary to-secondary",
  },
  {
    id: "company",
    title: "Tu Empresa",
    description: "Configurá los datos básicos de tu empresa o estudio contable.",
    icon: Building2,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "team",
    title: "Tu Equipo",
    description: "Invitá a tu equipo para que colabore en tiempo real.",
    icon: Users,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "accounts",
    title: "Plan de Cuentas",
    description: "Elegí el plan de cuentas CONPLA PY o creá uno personalizado.",
    icon: Calculator,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "fiscal",
    title: "Configuración Fiscal",
    description: "Configurá timbrado, RUC y régimen impositivo.",
    icon: FileText,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "complete",
    title: "¡Todo Listo!",
    description: "InteliCont está configurado. Empezá a usar la IA para tu contabilidad.",
    icon: CheckCircle2,
    color: "from-green-500 to-teal-500",
  },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyRuc: "",
    companyType: "estudio",
    teamEmails: [],
    accountPlan: "conpla",
    fiscalRegime: "iva_gral",
  });

  const step = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300",
                  i === currentStep ? "scale-110" : "opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < currentStep
                      ? "bg-green-500 text-white"
                      : i === currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-800 text-gray-500"
                  )}
                >
                  {i < currentStep ? "✓" : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 transition-all",
                      i < currentStep ? "bg-green-500" : "bg-gray-800"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main card */}
        <div
          className={cn(
            "bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 sm:p-12 transition-all duration-300",
            isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}
        >
          {/* Step icon */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-2xl",
                step.color
              )}
            >
              <step.icon className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Step content */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {step.title}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
              {step.description}
            </p>
          </div>

          {/* Step-specific content */}
          <div className="min-h-[200px]">
            {step.id === "welcome" && <WelcomeStep />}
            {step.id === "company" && <CompanyStep formData={formData} setFormData={setFormData} />}
            {step.id === "team" && <TeamStep formData={formData} setFormData={setFormData} />}
            {step.id === "accounts" && <AccountsStep formData={formData} setFormData={setFormData} />}
            {step.id === "fiscal" && <FiscalStep formData={formData} setFormData={setFormData} />}
            {step.id === "complete" && <CompleteStep />}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isFirstStep
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                <Zap className="h-4 w-4" />
                Empezar a usar InteliCont
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Skip button */}
        {!isLastStep && (
          <div className="text-center mt-4">
            <button
              onClick={handleComplete}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              Saltar configuración →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeStep() {
  const features = [
    { icon: Sparkles, title: "IA Contable", desc: "Sugerencias automáticas de asientos" },
    { icon: Shield, title: "Cumplimiento PY", desc: "SIFEN, Hechauka, RG90 automático" },
    { icon: Globe, title: "Multi-tenant", desc: "Gestioná N empresas desde un solo login" },
    { icon: BarChart3, title: "Reportes Real-time", desc: "Balance, PyG, flujo de efectivo al instante" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {features.map((f) => (
        <div
          key={f.title}
          className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-primary/50 transition-all"
        >
          <f.icon className="h-6 w-6 text-primary mb-2" />
          <h3 className="text-white text-sm font-medium">{f.title}</h3>
          <p className="text-gray-400 text-xs mt-1">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

function CompanyStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Nombre de la empresa o estudio
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="Ej: Estudio Contable Pérez"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">RUC</label>
        <input
          type="text"
          value={formData.companyRuc}
          onChange={(e) => setFormData({ ...formData, companyRuc: e.target.value })}
          placeholder="80012345-1"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo</label>
        <select
          value={formData.companyType}
          onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="estudio">Estudio Contable</option>
          <option value="empresa">Empresa</option>
        </select>
      </div>
    </div>
  );
}

function TeamStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  const [email, setEmail] = useState("");

  const addEmail = () => {
    if (email && !formData.teamEmails.includes(email)) {
      setFormData({ ...formData, teamEmails: [...formData.teamEmails, email] });
      setEmail("");
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEmail()}
          placeholder="email@ejemplo.com"
          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={addEmail}
          className="px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
        >
          Agregar
        </button>
      </div>
      {formData.teamEmails.length > 0 && (
        <div className="space-y-2">
          {formData.teamEmails.map((e: string) => (
            <div key={e} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
              <span className="text-white text-sm">{e}</span>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    teamEmails: formData.teamEmails.filter((x: string) => x !== e),
                  })
                }
                className="text-gray-400 hover:text-red-400 text-xs"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-gray-500 text-xs">Los miembros recibirán un magic link por email</p>
    </div>
  );
}

function AccountsStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setFormData({ ...formData, accountPlan: "conpla" })}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all",
            formData.accountPlan === "conpla"
              ? "border-primary bg-primary/10"
              : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
          )}
        >
          <Calculator className="h-6 w-6 text-primary mb-2" />
          <h3 className="text-white text-sm font-medium">CONPLA PY</h3>
          <p className="text-gray-400 text-xs mt-1">Plan oficial paraguayo</p>
        </button>
        <button
          onClick={() => setFormData({ ...formData, accountPlan: "custom" })}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all",
            formData.accountPlan === "custom"
              ? "border-primary bg-primary/10"
              : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
          )}
        >
          <CreditCard className="h-6 w-6 text-secondary mb-2" />
          <h3 className="text-white text-sm font-medium">Personalizado</h3>
          <p className="text-gray-400 text-xs mt-1">Creá tu propio plan</p>
        </button>
      </div>
    </div>
  );
}

function FiscalStep({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Régimen impositivo</label>
        <select
          value={formData.fiscalRegime}
          onChange={(e) => setFormData({ ...formData, fiscalRegime: e.target.value })}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="iva_gral">IVA General</option>
          <option value="ire_gral">IRE General (30%)</option>
          <option value="ire_simple">IRE Simple (10%)</option>
          <option value="resimple">ReSimple (6%)</option>
        </select>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <h4 className="text-white text-sm font-medium mb-2">Configuración fiscal automática</h4>
        <ul className="space-y-2 text-xs text-gray-400">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Validación RUC automática
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            CDC 44 dígitos SIFEN
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Hechauka automático
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            RG90 conciliación
          </li>
        </ul>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="h-12 w-12 text-green-400" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">¡<Wordmark dark /> está listo!</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Ya podés empezar a subir facturas, crear asientos y generar reportes. 
          La IA sugerirá asientos automáticamente.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">32</div>
          <div className="text-xs text-gray-500">Cuentas CONPLA</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">∞</div>
          <div className="text-xs text-gray-500">Asientos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary">AI</div>
          <div className="text-xs text-gray-500">Sugerencias</div>
        </div>
      </div>
    </div>
  );
}
