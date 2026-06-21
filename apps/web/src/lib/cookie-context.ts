import { cookies } from "next/headers";

export async function getSelectedEntityId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("intelicont_selected_entity")?.value ?? null;
  } catch (err) {
    // cookies() might throw if called outside of Request lifecycle or client components
    return null;
  }
}
