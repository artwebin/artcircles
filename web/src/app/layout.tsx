import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { ProtonProvider } from "@/components/ProtonProvider";
import { Toaster } from "react-hot-toast";
import { TestnetBanner } from "@/components/layout/TestnetBanner";
import { Header } from "@/components/layout/Header";
import { getSessionActor } from "@/lib/auth/session";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const figtree = Figtree({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: {
    default: "XPR Circles - Save together with people you trust",
    template: "%s - XPR Circles",
  },
  description: "A savings circle on XPR Network. Everyone pays the same amount, everyone takes the pot once. No interest, no bank, no middleman.",
  icons: {
    icon: [
      { url: "/images/Circle_logo.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/images/Circle_logo.svg",
    apple: "/images/Circle_logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialActor = await getSessionActor();

  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body suppressHydrationWarning>
        <ProtonProvider initialActor={initialActor}>
          <TestnetBanner />
          <Header />
          <main style={{ minHeight: "100vh" }}>
            {children}
          </main>
          <Toaster position="bottom-center" />
        </ProtonProvider>
      </body>
    </html>
  );
}
