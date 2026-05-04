"use client";
import { Calendar } from "lucide-react";
import PlaceholderPage from "@/components/placeholder-page";

export default function CalendarioPage() {
  return (
    <PlaceholderPage
      title="Calendario Fiscal"
      description="Vencimientos DNIT/SET, presentaciones y obligaciones tributarias"
      icon={Calendar}
    />
  );
}
