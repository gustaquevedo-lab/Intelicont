"use client";

import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

type KeyLike = { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; target: EventTarget | null };

/** Ctrl/Cmd+E, unless the user is typing in a field (so it never steals editing keys). */
export function isSwitcherShortcut(e: KeyLike): boolean {
  if (e.key.toLowerCase() !== "e" || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return false;
  const t = e.target as HTMLElement | null;
  const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable === true);
  return !typing;
}

/** Highlighted index after a key press; wraps around. `null` = the key does not move the highlight. */
export function nextIndex(index: number, key: string, length: number): number | null {
  if (length === 0) return null;
  if (key === "ArrowDown") return (index + 1) % length;
  if (key === "ArrowUp") return (index - 1 + length) % length;
  return null;
}

export type SwitcherAction<E> =
  | { type: "move"; index: number }
  | { type: "select"; entity: E }
  | { type: "close" };

/** Pure key -> action for the open switcher: arrows move the highlight, Enter selects THAT entity, Escape closes. */
export function switcherAction<E>(index: number, key: string, entities: E[]): SwitcherAction<E> | null {
  if (key === "Escape") return { type: "close" };
  if (key === "Enter") return entities[index] === undefined ? { type: "close" } : { type: "select", entity: entities[index] };
  const next = nextIndex(index, key, entities.length);
  return next === null ? null : { type: "move", index: next };
}

export function EntitySwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedEntity, availableEntities, selectEntity } = useAuthStore();
  const [index, setIndex] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setIndex(Math.max(0, availableEntities.findIndex((e) => e.id === selectedEntity?.id)));
    boxRef.current?.focus();
  }, [open, availableEntities, selectedEntity?.id]);

  if (!open) return null;

  const choose = (i: number) => {
    const entity = availableEntities[i];
    if (entity) selectEntity(entity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={boxRef}
        role="dialog"
        aria-label="Cambiar empresa"
        tabIndex={-1}
        onKeyDown={(e) => {
          const a = switcherAction(index, e.key, availableEntities);
          if (!a) return;
          e.preventDefault();
          if (a.type === "move") setIndex(a.index);
          else if (a.type === "select") { selectEntity(a.entity); onClose(); }
          else onClose();
        }}
        className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden premium-shadow outline-none"
      >
        <p className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
          Cambiar empresa — ↑↓ para elegir, Enter para seleccionar
        </p>
        <ul role="listbox" aria-label="Empresas" className="max-h-72 overflow-y-auto p-1">
          {availableEntities.length === 0 && <li className="px-3 py-4 text-sm text-gray-500">No tenés empresas todavía.</li>}
          {availableEntities.map((entity, i) => (
            <li
              key={entity.id}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onClick={() => choose(i)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm",
                i === index ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50",
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate font-bold">{entity.tradeName || entity.legalName}</span>
              <span className="text-[10px] font-mono opacity-70">RUC {entity.ruc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
