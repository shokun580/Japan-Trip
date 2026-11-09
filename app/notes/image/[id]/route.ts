import { db } from "@/lib/db";

// Behind the same name picker as every page (proxy.ts), since a shared note can hold
// a ticket or a passport photo. An image never changes under its id, because editing
// a note only adds and removes rows, so the phone may keep each one for good.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const small = new URL(request.url).searchParams.has("thumb");
  const row = await db.noteImage.findUnique({ where: { id }, select: { full: !small, thumb: small } });
  const bytes = small ? row?.thumb : row?.full;
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
