import { LucideIcon } from "lucide-react";

export default function PlaceholderPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="text-zinc-400 mt-1">{description}</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-zinc-500" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">En construcción</h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Esta sección está siendo desarrollada. Pronto estará disponible con toda la funcionalidad esperada.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <span className="inline-flex px-3 py-1 rounded-full text-xs bg-blue-900/20 text-blue-400 border border-blue-800/50">
            Sprint 2
          </span>
          <span className="inline-flex px-3 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  );
}
