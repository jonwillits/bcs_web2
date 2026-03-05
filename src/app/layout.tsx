import type { Metadata } from "next";
import { Montserrat, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// University of Illinois Official Typography
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-source-sans-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "University of Illinois - Brain & Cognitive Sciences E-Learning Platform",
  description: "Official University of Illinois e-learning platform for Brain and Cognitive Sciences. Explore neuroscience, cognitive psychology, and brain research through interactive educational modules.",
  keywords: ["University of Illinois", "neuroscience", "cognitive science", "brain research", "e-learning", "educational platform", "UIUC"],
  authors: [{ name: "University of Illinois BCS Department" }],
  openGraph: {
    title: "University of Illinois - BCS E-Learning Platform",
    description: "Official educational platform for Brain and Cognitive Sciences at the University of Illinois.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "University of Illinois - BCS E-Learning Platform",
    description: "Official educational platform for Brain and Cognitive Sciences at the University of Illinois.",
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#13294B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UI BCS E-Learning" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${montserrat.variable} ${sourceSans3.variable} font-body antialiased`}>
        <Providers>
          <div id="skip-to-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-neural-primary text-white px-4 py-2 rounded-md z-50">
            <a href="#main-content">Skip to main content</a>
          </div>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
