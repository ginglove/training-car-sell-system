import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Auto Dealership - Nền tảng bán hàng ô tô trực tuyến",
  description: "Nền tảng bán hàng & quản trị ô tô trực tuyến hàng đầu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* Preload 3D GLB Models to optimize initial load time */}
        <link rel="preload" href="/models/sedan.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/models/suv.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/models/pickup.glb" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
