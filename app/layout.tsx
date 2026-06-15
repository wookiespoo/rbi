import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "RBI — Rug Bureau of Investigation",
  description: "Community rug-pull enforcement bulletin for the Solana trenches.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
