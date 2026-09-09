import type { Metadata } from "next";
import { Bodoni_Moda, Newsreader, Archivo } from "next/font/google";
import "./globals.css";

/*
 * Three faces, which is one fewer than the site used to carry and a great
 * deal more like a newspaper.
 *
 * Bodoni is the nameplate and nothing else of any size — a modern with hairline
 * serifs that shatter below about 30px, which is exactly why it reads as
 * masthead rather than as text. Newsreader does the reading: headlines,
 * standfirsts, body. Archivo does the labelling: kickers, bylines, figures.
 */
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700", "900"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Dispatch — new releases, one page",
  description:
    "AI models, hardware, cameras, electric vehicles, sport and science — every new release, tracked in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${newsreader.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
