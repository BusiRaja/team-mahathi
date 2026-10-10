import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Poppins, Noto_Sans_Telugu, Dancing_Script } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["500", "700", "900"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"] });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu", "latin"], variable: "--font-telugu", weight: ["400", "500", "600", "700"] });
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-script", weight: ["500", "600"] });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Team Mahathi · Gajwel Festivals",
  description: "Festival albums, photos, videos, updates and events for our Ganesh and Durga celebrations.",
};
export const viewport: Viewport = { themeColor: "#6B0F1A", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${poppins.variable} ${telugu.variable} ${script.variable}`}>
      <body>
        <Nav joinUrl={settings.join_url || "/updates"} />
        <main className="pb-24 md:pb-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
