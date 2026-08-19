import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ThemeManager } from "@/components/ThemeManager";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WheelFood — מה אוכלים היום?",
  description: "גלגל המנות שמחליט בשבילך מה אוכלים. סנן לפי ארוחה, זמן הכנה ותקציב, סובב, ותאכל.",
  applicationName: "WheelFood",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WheelFood",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fff7f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/**
 * Set the theme before first paint so a dark-mode user never sees a light
 * flash. Mirrors the logic in ThemeManager.
 */
const THEME_BOOTSTRAP = `(function(){try{
var raw=localStorage.getItem('wheelfood.v1');
var theme=raw?(JSON.parse(raw).settings||{}).theme||'system':'system';
var dark=theme==='dark'||(theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme=dark?'dark':'light';
document.documentElement.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${rubik.variable} antialiased`}>
        <StoreProvider>
          <ThemeManager />
          <ServiceWorkerRegistrar />
          <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-4">
            <OfflineBanner />
            <main className="flex flex-1 flex-col pb-[calc(var(--wf-nav-height)+1.5rem)]">{children}</main>
          </div>
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
