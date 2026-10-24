import { cookies } from "next/headers";

export async function getSelectedEntityId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("intelicont_selected_entity")?.value ?? cookieStore.get("ic.selectedEntityId")?.value ?? null;
  } catch {
    return null;
  }
}
