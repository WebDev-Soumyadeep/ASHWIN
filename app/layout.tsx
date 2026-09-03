import type { Metadata } from "next";
import { ThemeControls } from "@/components/theme-controls";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ashwin Healthcare System",
  description: "Hospital queue, telemedicine, diagnostics, blood bank, and medical shop management"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-mode="light" data-theme="lagoon" suppressHydrationWarning>
      <body>
        <ThemeControls />
        {children}
      </body>
    </html>
  );
}
