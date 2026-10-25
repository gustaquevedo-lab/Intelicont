export const DEFAULT_SUPERADMIN_EMAILS = [
  "intellihousepy@gmail.com",
  "gustaquevedo@gmail.com",
  "admin@intelicont.com.py",
  "admin@intellihouse.lat",
];

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false;
  return DEFAULT_SUPERADMIN_EMAILS.includes(email.toLowerCase().trim());
}
