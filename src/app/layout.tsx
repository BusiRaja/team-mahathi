import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Poppins, Noto_Sans_Telugu, Dancing_Script } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getLang } from "@/lib/i18n/server";
import { LangProvider } from "@/lib/i18n/client";
import { translator } from "@/lib/i18n";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["500", "700", "900"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"] });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu", "latin"], variable: "--font-telugu", weight: ["400", "500", "600", "700"] });
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-script", weight: ["500", "600"] });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "500", "600"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = translator(await getLang());
  return { title: t("meta.title"), description: t("meta.description") };
}
export const viewport: Viewport = { themeColor: "#6B0F1A", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${cinzel.variable} ${cormorant.variable} ${poppins.variable} ${telugu.variable} ${script.variable}`}>
      <body>
        <LangProvider initial={lang}>
          <Nav />
          <main className="pb-24 md:pb-0">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
