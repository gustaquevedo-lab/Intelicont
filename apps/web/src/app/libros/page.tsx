"use client";
import { BookOpen } from "lucide-react";
import PlaceholderPage from "@/components/placeholder-page";

export default function LibrosPage() {
  return (
    <PlaceholderPage
      title="Libros Contables"
      description="Libro IVA, Diario, Mayor y registros electrónicos"
      icon={BookOpen}
    />
  );
}
