import { supabase } from "./supabase";

async function authHeader() {
  const { data } = await supabase!.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
}

export interface CloudinaryUpload {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video" | "raw";
}

/** Signed upload: the server signs, the browser sends the file straight to Cloudinary. */
export async function uploadToCloudinary(file: File, folder: string): Promise<CloudinaryUpload> {
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ folder }),
  });
  const sig = await signRes.json().catch(() => ({}));
  if (!signRes.ok) throw new Error(sig.error ?? "Could not sign upload");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body: fd });
  const json = await up.json().catch(() => ({}));
  if (!up.ok) throw new Error(json?.error?.message ?? "Cloudinary upload failed");
  return json as CloudinaryUpload;
}

export async function deleteFromCloudinary(publicId: string, type: "photo" | "video") {
  await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ public_id: publicId, resource_type: type === "video" ? "video" : "image" }),
  });
}

/** Adds Cloudinary auto format/quality (and optional width) to a delivery URL; other URLs pass through. */
export function optimize(url: string, width?: number) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const t = `f_auto,q_auto${width ? `,w_${width},c_limit` : ""}`;
  return url.replace("/upload/", `/upload/${t}/`);
}
