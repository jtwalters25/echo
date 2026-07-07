import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo — have we seen this ticket before?",
  description:
    "Paste an incoming support ticket; Echo finds the most similar resolved tickets and surfaces how they were fixed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
