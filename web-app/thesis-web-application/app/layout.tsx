import type { Metadata } from "next";
import { Darumadrop_One, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const darumadrop = Darumadrop_One({
  variable: "--font-darumadrop",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Pawket Book",
  description: "Health records and reminders for every animal you love.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${darumadrop.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
