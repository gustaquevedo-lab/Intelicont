import { Suspense } from "react";
import LoginPageComponent from "./login-page-component";

export const metadata = {
  title: "Acceso - Intelicont",
  description: "Ingresá a tu estudio contable Intelicont.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-radial-light dark:bg-radial-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando...</p>
        </div>
      </div>
    }>
      <LoginPageComponent />
    </Suspense>
  );
}
