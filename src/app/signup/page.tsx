import SignupForm from "@/components/SignupForm";
import { getSettings } from "@/lib/data";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const s = await getSettings();
  // The old "Join Team link" setting (e.g. a WhatsApp group) is now offered after sign-up.
  return <div className="wrap py-10"><SignupForm next={safe} groupUrl={s.join_url || ""} /></div>;
}
