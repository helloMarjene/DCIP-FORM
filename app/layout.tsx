import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Pastor Registration | DCNI", description: "Discipleship Christian Network International Pastoral Forum registration portal." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
