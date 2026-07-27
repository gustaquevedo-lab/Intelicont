"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MANUAL_SECTIONS, ManualSection } from "@/lib/manual-data";
import {
  BookOpen, Search, ChevronDown, ChevronRight, Menu, X,
  ChevronLeft, ArrowUp, Sparkles, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

function groupSections(sections: ManualSection[]) {
  const groups: { name: string; icon: React.ReactNode; sections: ManualSection[] }[] = [];
  for (const s of sections) {
    let g = groups.find((g) => g.name === s.group);
    if (!g) {
      g = { name: s.group, icon: s.groupIcon, sections: [] };
      groups.push(g);
    }
    g.sections.push(s);
  }
  return groups;
}

export default function ManualUsuarioPage() {
  const [activeId, setActiveId] = useState(MANUAL_SECTIONS[0].id);
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => groupSections(MANUAL_SECTIONS), []);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return MANUAL_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q)
    );
  }, [search]);

  const activeSection = MANUAL_SECTIONS.find((s) => s.id === activeId) || MANUAL_SECTIONS[0];

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const navigateSection = (dir: -1 | 1) => {
    const idx = MANUAL_SECTIONS.findIndex((s) => s.id === activeId);
    const next = idx + dir;
    if (next >= 0 && next < MANUAL_SECTIONS.length) {
      setActiveId(MANUAL_SECTIONS[next].id);
      scrollToTop();
    }
  };

  const currentIdx = MANUAL_SECTIONS.findIndex((s) => s.id === activeId);

  const renderSection = (section: ManualSection) => (
    <div key={section.id} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
        <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
          {section.icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{section.title}</h2>
          <p className="text-xs text-gray-500">{section.group}</p>
        </div>
      </div>
      {section.content}
    </div>
  );

  const searchResults = filteredSections && (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        {filteredSections.length} resultado{filteredSections.length !== 1 ? "s" : ""} para "<strong className="text-white">{search}</strong>"
      </p>
      {filteredSections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron resultados</p>
          <p className="text-xs mt-1">Intente con otros términos como "asientos", "SIFEN", "IVA", etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredSections.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveId(s.id); setSearch(""); setMobileNavOpen(false); scrollToTop(); }}
              className="text-left bg-gray-900/60 border border-gray-800 hover:border-primary/40 rounded-xl p-4 transition-all group"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-primary shrink-0">{s.icon}</span>
                <p className="font-semibold text-white text-sm group-hover:text-primary transition-colors">
                  {s.title}
                </p>
              </div>
              <p className="text-xs text-gray-500 pl-7">{s.group}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-body">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-body/90 backdrop-blur-xl border-b border-gray-800/50">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  className="lg:hidden h-8 w-8 rounded-lg border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-700"
                >
                  {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-bold text-white truncate">Manual de Usuario Interactivo</h1>
                    <p className="text-[10px] text-gray-500 truncate">Guía completa de InteliCont — v1.0.0</p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-xs hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar en el manual..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-800 bg-gray-900/60 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        {search && (
          <div className="sm:hidden px-4 py-2 border-b border-gray-800/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-800 bg-gray-900/60 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex">
          {/* Sidebar Navigation */}
          <aside
            className={cn(
              "w-72 shrink-0 border-r border-gray-800/50 bg-gray-900/20 overflow-y-auto",
              "hidden lg:block",
              "sticky top-[57px] self-start max-h-[calc(100vh-57px)]"
            )}
          >
            <div className="p-4 space-y-1">
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.name);
                const hasActive = group.sections.some((s) => s.id === activeId);
                return (
                  <div key={group.name}>
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all",
                        hasActive ? "text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <span className="shrink-0">{group.icon}</span>
                      <span className="flex-1 text-left">{group.name}</span>
                      {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {!isCollapsed && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-800/50 pl-2">
                        {group.sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => { setActiveId(section.id); scrollToTop(); }}
                            className={cn(
                              "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all",
                              section.id === activeId
                                ? "bg-primary/15 text-primary font-medium"
                                : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                            )}
                          >
                            <span className="shrink-0">{section.icon}</span>
                            <span className="truncate">{section.title.replace(/^\d+\.\s*/, "")}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Mobile overlay nav */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
              <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gray-950 border-r border-gray-800 overflow-y-auto z-50">
                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-white">Manual</span>
                    </div>
                    <button onClick={() => setMobileNavOpen(false)} className="text-gray-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {groups.map((group) => {
                    const isCollapsed = collapsedGroups.has(group.name);
                    return (
                      <div key={group.name}>
                        <button
                          onClick={() => toggleGroup(group.name)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-300"
                        >
                          <span className="shrink-0">{group.icon}</span>
                          <span className="flex-1 text-left">{group.name}</span>
                          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {!isCollapsed && (
                          <div className="ml-2 space-y-0.5 border-l border-gray-800/50 pl-2">
                            {group.sections.map((section) => (
                              <button
                                key={section.id}
                                onClick={() => { setActiveId(section.id); setMobileNavOpen(false); scrollToTop(); }}
                                className={cn(
                                  "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]",
                                  section.id === activeId ? "bg-primary/15 text-primary font-medium" : "text-gray-400 hover:text-white"
                                )}
                              >
                                <span className="shrink-0">{section.icon}</span>
                                <span className="truncate">{section.title.replace(/^\d+\.\s*/, "")}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main
            ref={contentRef}
            className="flex-1 overflow-y-auto max-h-[calc(100vh-57px)]"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / MANUAL_SECTIONS.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-medium tabular-nums shrink-0">
                  {currentIdx + 1} / {MANUAL_SECTIONS.length}
                </span>
              </div>

              <div className="card p-4 sm:p-6 lg:p-8 min-h-[60vh]">
                {search ? searchResults : renderSection(activeSection)}

                {/* Bottom navigation */}
                {!search && (
                  <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-800">
                    <button
                      onClick={() => navigateSection(-1)}
                      disabled={currentIdx === 0}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-all",
                        currentIdx === 0
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Anterior
                    </button>
                    <span className="text-[10px] text-gray-600">
                      {activeSection.title}
                    </span>
                    <button
                      onClick={() => navigateSection(1)}
                      disabled={currentIdx === MANUAL_SECTIONS.length - 1}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-all",
                        currentIdx === MANUAL_SECTIONS.length - 1
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-6">
                <span>Desarrollado con</span>
                <Heart className="h-3 w-3 text-red-500 fill-current" />
                <span>para contadores de Paraguay.</span>
                <span className="mx-2">·</span>
                <span>InteliCont v1.0.0</span>
              </div>
            </div>
          </main>
        </div>

        {/* Scroll to top */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:bg-primary/90 transition-all z-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
