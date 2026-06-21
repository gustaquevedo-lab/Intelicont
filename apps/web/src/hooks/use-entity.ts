"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserMemberships, type MembershipWithEntity } from "@/lib/auth-actions";

export interface EntityInfo {
  id: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  role: string;
}

export function useEntity(userId: string | null | undefined) {
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEntities([]);
      setSelectedEntityId(null);
      setIsLoading(false);
      return;
    }

    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
      return null;
    };

    const saved = localStorage.getItem("intelicont_selected_entity") || getCookie("intelicont_selected_entity");
    if (saved) setSelectedEntityId(saved);

    getUserMemberships(userId).then((result) => {
      if (result.success && result.data) {
        const mapped = result.data.map((m: MembershipWithEntity) => ({
          id: m.entityId,
          ruc: m.ruc,
          legalName: m.legalName,
          tradeName: m.tradeName,
          role: m.role,
        }));
        setEntities(mapped);

        // If no selected entity but we have entities, select the first one
        const activeId = saved || (mapped[0]?.id ?? null);
        if (activeId && activeId !== saved) {
          setSelectedEntityId(activeId);
          localStorage.setItem("intelicont_selected_entity", activeId);
          document.cookie = `intelicont_selected_entity=${activeId}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
      setIsLoading(false);
    });
  }, [userId]);

  const selectEntity = useCallback((entityId: string) => {
    setSelectedEntityId(entityId);
    localStorage.setItem("intelicont_selected_entity", entityId);
    document.cookie = `intelicont_selected_entity=${entityId}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }, []);

  const selectedEntity = selectedEntityId
    ? entities.find((e) => e.id === selectedEntityId) ?? null
    : entities.length === 1
    ? entities[0]
    : null;

  return { entities, selectedEntity, selectEntity, isLoading };
}

