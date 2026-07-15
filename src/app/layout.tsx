import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "شقة سيدي بشر — بيت أصحاب وشاي وذكريات",
  description: "بيت أصحاب، شاي، وذكريات ما تتنسيش. لمة، فطار، ذكريات، وكل اللي بيحصل في الشقة.",
  keywords: ["شقة سيدي بشر", "أصحاب", "لمة", "فطار", "ذكريات", "شاي"],
  authors: [{ name: "Rayyan Nabil" }],
  openGraph: {
    title: "شقة سيدي بشر",
    description: "بيت أصحاب، شاي، وذكريات ما تتنسيش.",
    type: "website",
    locale: "ar_EG",
    siteName: "شقة سيدي بشر",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "شقة سيدي بشر" }],
  },
  twitter: {
    card: "summary",
    title: "شقة سيدي بشر",
    description: "بيت أصحاب، شاي، وذكريات ما تتنسيش.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const t = localStorage.getItem("theme");
                const d = t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches);
                if (d) document.documentElement.classList.add("dark");
              } catch {}
            })();`,
          }}
        />
      </head>
      <body className="font-arabic min-h-screen bg-background antialiased" style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
