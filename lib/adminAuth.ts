// lib/adminAuth.ts — shared check for the admin routes.
// Requires the ADMIN_KEY env var to be set; the client sends it as a header.
export function isAdmin(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}
