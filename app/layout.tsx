import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sara Impeach Poll",
  description: "Dapat bang i-impeach si Sara Duterte? Iboto ang iyong opinyon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fil">
      <head>
        <script
          src="https://pl29544470.effectivecpmnetwork.com/e7/db/07/e7db075d59e59f42b6a67dbadd68b4cc.js"
          async
        />
        <script
          src="https://pl29544477.effectivecpmnetwork.com/e5/4b/40/e54b40406937b38262c220a026402e35.js"
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}