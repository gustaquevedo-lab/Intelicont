"use client";
import { Settings } from "lucide-react";
import PlaceholderPage from "@/components/placeholder-page";

export default function ConfiguracionPage() {
  return (
    <PlaceholderPage
      title="Configuración"
      description="Régimen tributario, plan de cuentas, usuarios y preferencias del sistema"
      icon={Settings}
    />
  );
}
