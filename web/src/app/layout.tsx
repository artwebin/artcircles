import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { ProtonProvider } from "@/components/ProtonProvider";
import { Toaster } from "react-hot-toast";
import { TestnetBanner } from "@/components/layout/TestnetBanner";
import { Header } from "@/components/layout/Header";
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
  const cookieStore = await cookies();
  const initialActor = cookieStore.get("xpr_auth")?.value || null;

  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('proton-storage-user-auth');
                  if (stored && !document.cookie.includes('xpr_auth=')) {
                    var parsed = JSON.parse(stored);
                    if (parsed && parsed.actor) {
                      document.cookie = 'xpr_auth=' + encodeURIComponent(parsed.actor) + '; path=/; max-age=31536000; SameSite=Lax';
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ProtonProvider initialActor={initialActor}>
          <TestnetBanner />
          <Header initialActor={initialActor} />
          <main style={{ minHeight: "100vh" }}>
            {children}
          </main>
          <Toaster position="bottom-center" />
        </ProtonProvider>
      </body>
    </html>
  );
}
