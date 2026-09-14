import type { Metadata } from "next";
import { Syne, IBM_Plex_Sans } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "MindPress — We put AI to work for you",
    template: "%s · MindPress",
  },
  description:
    "MindPress is a forward-deployed AI engineering company. We build the company brain, the apps employees use, and bounded agents that get work done.",
  metadataBase: new URL("https://mindpress.ca"),
  openGraph: {
    title: "MindPress — We put AI to work for you",
    description:
      "Forward-deployed AI engineering: company brain, app factory, bounded agents, measured outcomes.",
    siteName: "MindPress",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${ibmPlex.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
