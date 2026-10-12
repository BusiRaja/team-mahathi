import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { cloudinaryEnv, requireAdmin } from "@/lib/server-auth";

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const env = cloudinaryEnv();
  if (!env) return NextResponse.json({ error: "Cloudinary env vars missing on server" }, { status: 500 });

  const { folder } = (await req.json().catch(() => ({}))) as { folder?: string };
  const safeFolder = (folder ?? "utsav").replace(/[^a-zA-Z0-9/_-]/g, "");
  const timestamp = Math.floor(Date.now() / 1000);

  // Params are signed alphabetically: folder, timestamp
  const signature = createHash("sha1")
    .update(`folder=${safeFolder}&timestamp=${timestamp}${env.apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    cloudName: env.cloudName,
    apiKey: env.apiKey,
    timestamp,
    folder: safeFolder,
    signature,
  });
}
