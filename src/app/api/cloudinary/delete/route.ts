import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { cloudinaryEnv, requireAdmin } from "@/lib/server-auth";

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const env = cloudinaryEnv();
  if (!env) return NextResponse.json({ error: "Cloudinary env vars missing on server" }, { status: 500 });

  const { public_id, resource_type } = (await req.json().catch(() => ({}))) as {
    public_id?: string;
    resource_type?: "image" | "video";
  };
  if (!public_id) return NextResponse.json({ error: "public_id required" }, { status: 400 });
  const type = resource_type === "video" ? "video" : "image";

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`public_id=${public_id}&timestamp=${timestamp}${env.apiSecret}`)
    .digest("hex");

  const body = new URLSearchParams({
    public_id,
    timestamp: String(timestamp),
    api_key: env.apiKey,
    signature,
  });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/${type}/destroy`, {
    method: "POST",
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ error: json?.error?.message ?? "Delete failed" }, { status: 502 });
  return NextResponse.json({ result: json.result });
}
