import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guugle — Token Intelligence",
  description:
    "Live rug risk scoring, OKX security pre-flight, and smart money signals for any contract.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://rsms.me" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/jetbrains-mono@1.0.6/css/jetbrains-mono.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
