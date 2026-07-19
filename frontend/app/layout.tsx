import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";

// Marketplace typefaces.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Verid overlay typefaces — Space Grotesk is the visual tell that a pixel
// belongs to Verid, not the marketplace. Never used in marketplace components.
const veridHead = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-verid-head",
  display: "swap",
});

const veridBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-verid-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kora Market — handmade, vintage & more",
  description: "A vibrant marketplace for makers, sellers and one-of-a-kind finds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${veridHead.variable} ${veridBody.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
