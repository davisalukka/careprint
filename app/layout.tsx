import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careprint — make the kindest next swap",
  description: "A private dashboard for lowering the animal-welfare pressure in your weekly food choices.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
