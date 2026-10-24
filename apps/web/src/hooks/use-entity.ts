"use client";

import { useAuthStore, type Entity } from "@/lib/auth-store";

export function useEntity(_userId?: string | null) {
  const { selectedEntity, availableEntities, selectEntity } = useAuthStore();
  return {
    entities: availableEntities,
    selectedEntity,
    selectEntity: (id: string) => {
      const match = availableEntities.find((e) => e.id === id);
      if (match) selectEntity(match);
    },
    isLoading: false,
  };
}
