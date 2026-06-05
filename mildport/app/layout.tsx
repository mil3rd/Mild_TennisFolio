import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Lato } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--next-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--next-dancing",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--next-lato",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Phassaree's Tennis Archive",
  description:
    "A scrapbook of Phassaree's tennis journey — tournaments, awards, and memories across every age group.",
  openGraph: {
    title: "Phassaree's Tennis Archive",
    description: "Tennis achievements, polaroid memories, and golden moments.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dancing.variable} ${lato.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-cream">{children}</body>
    </html>
  );
}
