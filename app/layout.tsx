import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./componets/Header";
import { Footer } from "./componets/Footer";
import { ConfigProvider, theme, App } from "antd";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stars Exchange",
  description: "Telegram Stars Exchange Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <App>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: "#1890ff",
            },
            components: {
              Card: {
                colorBgContainer: "transparent",
                colorText: "white",
                colorBorderSecondary: "transparent",
              },
            },
          }}
        >
          <div className="main-container">
            <Header />
            <main className="content-wrapper">
              {children}
            </main>
            <Footer />
          </div>
        </ConfigProvider>
        </App>
      </body>
    </html>
  );
}