import type { Metadata } from "next";
import "./globals.css";
import { ProvidersAndLayout } from "@/components/ProvidersAndLayout";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Upload Blob",
  description: "Upload blobs to Walrus, and display them on this page. See the Walrus documentation for more information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProvidersAndLayout>
          {children}
          <Analytics/>          
        </ProvidersAndLayout>
      </body>
    </html>
  );
}
