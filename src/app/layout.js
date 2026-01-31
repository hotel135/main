// src/app/layout.js - SIMPLIFY
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";
import { NowPaymentsWalletProvider } from "@/context/NowPaymentsWalletContext";
import { SimpleWalletProvider } from "@/context/SimpleWalletContext";
import { AdsProvider } from "@/context/AdsContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Script from "next/script";

// DEFAULT METADATA (for pages that don't override it)
export const metadata = {
  title: "MeetAnEscort - Premium Escort Dating & Companionship Platform",
  description:
    "Meet verified independent escorts and companions in your area. Safe, discreet, and professional encounters with premium dating experiences.",
  keywords:
    "escorts, independent escorts, dating, companionship, verified escorts",

  openGraph: {
    title: "MeetAnEscort - Premium Escort Dating Platform",
    description:
      "Connect with verified independent escorts and companions in your area. Safe, discreet, and professional dating experiences.",
    url: "https://meetanescort.com",
    siteName: "MeetAnEscort",
    images: [
      {
        url: "https://ibb.co/zVx5NXRS",
        width: 1200,
        height: 630,
        alt: "MeetAnEscort - Premium Escort Dating Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MeetAnEscort - Premium Escort Dating",
    description: "Verified independent escorts and companions in your area",
    images: ["https://ibb.co/zVx5NXRS"],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://meetanescort.com",
  },
};

// Structured Data (keep this as is)
const StructuredDataScripts = () => {
  // ... keep your existing structured data code
  return <>{/* Your existing structured data */}</>;
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Theme Color */}
        <meta name="theme-color" content="#EC4899" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Structured Data */}
        <StructuredDataScripts />

        {/* SmartSupp Script */}
        <Script
          id="smartsupp-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _smartsupp = _smartsupp || {};
              _smartsupp.key = 'a5a819116fb14c49b4748bea952a243c1bf940dd';
              window.smartsupp || (function(d) {
                var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
                s=d.getElementsByTagName('script')[0];c=d.createElement('script');
                c.type='text/javascript';c.charset='utf-8';c.async=true;
                c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
              })(document);
            `,
          }}
        />
      </head>

      <body>
        <ErrorBoundary>
          <AuthProvider>
            <SimpleWalletProvider>
              <AdsProvider>{children}</AdsProvider>
            </SimpleWalletProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
