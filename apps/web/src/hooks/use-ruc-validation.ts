"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { RucLookupResult, RucSearchResult } from "@/lib/ruc-service";

// ─── Internal state ───────────────────────────────────────────────────────

interface RucState {
  /** Current RUC value being edited */
  value: string;
  /** Full lookup result from API */
  lookup: RucLookupResult | null;
  /** Whether a remote lookup is in flight */
  loading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Search results for autocomplete */
  searchResults: RucSearchResult[];
  /** Whether search is in progress */
  searching: boolean;
  /** Whether the RUC has been touched (blurred or submitted) */
  touched: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useRucValidation(options: {
  /** Called when a RUC is successfully looked up (for external updates) */
  onLookup?: (result: RucLookupResult) => void;
  /** Initial RUC value */
  initialRuc?: string;
} = {}) {
  const { onLookup, initialRuc = "" } = options;

  const [state, setState] = useState<RucState>({
    value: initialRuc,
    lookup: null,
    loading: false,
    error: null,
    searchResults: [],
    searching: false,
    touched: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef(state.value);

  // ── Local DV validation on value change ─────────────────────────────────
  const validateAndLookup = useCallback(
    async (ruc: string) => {
      latestValueRef.current = ruc;
      setState((prev) => ({ ...prev, value: ruc, error: null }));

      // Clear debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Skip validation for very short values
      const cleaned = ruc.replace(/\D/g, "");
      if (cleaned.length < 4) {
        setState((prev) => ({
          ...prev,
          lookup: null,
          loading: false,
          error: cleaned.length > 0 ? "Mínimo 4 dígitos para buscar" : null,
        }));
        return;
      }

      // Dynamically import to avoid SSR issues
      const { lookupRuc } = await import("@/lib/ruc-service");

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const result = await lookupRuc(ruc, { fetchRemote: true });

        // Ensure we haven't changed value during lookup
        if (latestValueRef.current !== ruc) return;

        setState((prev) => ({
          ...prev,
          lookup: result,
          loading: false,
          error: result.dvValidation.error || null,
        }));

        onLookup?.(result);
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Error al consultar el RUC. Verificá tu conexión.",
        }));
      }
    },
    [onLookup]
  );

  // ── Debounced lookup ────────────────────────────────────────────────────
  const handleChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, value }));

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        validateAndLookup(value);
      }, 600); // 600ms debounce
    },
    [validateAndLookup]
  );

  // ── Mark as touched on blur ─────────────────────────────────────────────
  const handleBlur = useCallback(() => {
    setState((prev) => ({ ...prev, touched: true }));

    // Force immediate lookup on blur
    if (debounceRef.current) clearTimeout(debounceRef.current);
    validateAndLookup(state.value);
  }, [state.value, validateAndLookup]);

  // ── Search by name ──────────────────────────────────────────────────────
  const searchByName = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setState((prev) => ({ ...prev, searchResults: [] }));
      return;
    }

    setState((prev) => ({ ...prev, searching: true }));

    const { searchRuc } = await import("@/lib/ruc-service");

    try {
      const results = await searchRuc(query, { limit: 10, estado: "ACTIVO" });
      setState((prev) => ({ ...prev, searchResults: results, searching: false }));
    } catch {
      setState((prev) => ({ ...prev, searchResults: [], searching: false }));
    }
  }, []);

  // ── Select from search results ──────────────────────────────────────────
  const selectFromSearch = useCallback(
    (result: RucSearchResult) => {
      const lookup: RucLookupResult = {
        ruc: result.ruc,
        nombre: result.nombre,
        estado: result.estado,
        dv: result.dv,
        activo: result.activo,
        dvValidation: {
          isValid: true,
          ruc: result.ruc,
          dv: result.dv,
          calculatedDv: result.dv,
        },
        source: "api",
        fromLive: true,
      };

      setState((prev) => ({
        ...prev,
        value: result.ruc,
        lookup,
        searchResults: [],
        error: null,
        touched: true,
      }));

      onLookup?.(lookup);
    },
    [onLookup]
  );

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setState({
      value: "",
      lookup: null,
      loading: false,
      error: null,
      searchResults: [],
      searching: false,
      touched: false,
    });
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const isValid = state.lookup?.dvValidation.isValid ?? false;
  const isActive = state.lookup?.activo ?? false;
  const razonSocial = state.lookup?.nombre || "";

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    // State
    value: state.value,
    lookup: state.lookup,
    loading: state.loading,
    error: state.error,
    touched: state.touched,
    searchResults: state.searchResults,
    searching: state.searching,

    // Derived
    isValid,
    isActive,
    razonSocial,

    // Actions
    handleChange,
    handleBlur,
    searchByName,
    selectFromSearch,
    validateAndLookup,
    reset,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Status badge color map */
export function rucStatusColor(estado: string): string {
  const upper = estado.toUpperCase();
  switch (upper) {
    case "ACTIVO":
      return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    case "BLOQUEADO":
    case "SUSPENSION_TEMPORAL":
      return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
    case "CANCELADO":
    case "CANCELADO_DEFINITIVO":
      return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
  }
}

/** Status label in Spanish */
export function rucStatusLabel(estado: string): string {
  const upper = estado.toUpperCase();
  switch (upper) {
    case "ACTIVO":
      return "Activo";
    case "BLOQUEADO":
      return "Bloqueado";
    case "SUSPENSION_TEMPORAL":
      return "Suspendido";
    case "CANCELADO":
      return "Cancelado";
    case "CANCELADO_DEFINITIVO":
      return "Cancelado Definitivo";
    default:
      return estado || "Desconocido";
  }
}
