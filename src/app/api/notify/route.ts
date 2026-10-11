import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { notifyPublished } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Admin-only: announce a newly published event or update by email and web push. */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "event" ? "event" : body.kind === "update" ? "update" : null;
  const id = typeof body.id === "string" ? body.id : "";
  if (!kind || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
    return NextResponse.json(await notifyPublished(kind, id, origin));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
