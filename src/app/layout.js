// src/app/layout.js
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";
import { NowPaymentsWalletProvider } from "@/context/NowPaymentsWalletContext";
import { SimpleWalletProvider } from "@/context/SimpleWalletContext";
import { AdsProvider } from "@/context/AdsContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "MeetAnEscort - Premium Escort Dating & Companionship Platform",
  description:
    "Meet verified independent escorts and companions in your area. Safe, discreet, and professional encounters with premium dating experiences.",
  keywords:
    "escorts, independent escorts, dating, companionship, verified escorts, adult dating, premium dating, escorts near me, luxury dating, discreet encounters, escorts in New York, escorts in Los Angeles, escorts in Chicago, escorts in Houston, escorts in Phoenix, escorts in Philadelphia, escorts in San Antonio, escorts in San Diego, escorts in Dallas, escorts in San Jose, escorts in Austin, escorts in Jacksonville, escorts in Fort Worth, escorts in Columbus, escorts in Indianapolis, escorts in Charlotte, escorts in San Francisco, escorts in Seattle, escorts in Denver, escorts in Washington, escorts in Boston, escorts in Nashville, escorts in El Paso, escorts in Detroit, escorts in Memphis, escorts in Portland, escorts in Oklahoma City, escorts in Las Vegas, escorts in Louisville, escorts in Baltimore, escorts in Milwaukee, escorts in Albuquerque, escorts in Tucson, escorts in Fresno, escorts in Mesa, escorts in Sacramento, escorts in Atlanta, escorts in Kansas City, escorts in Colorado Springs, escorts in Miami, escorts in Raleigh, escorts in Omaha, escorts in Long Beach, escorts in Virginia Beach, escorts in Oakland, escorts in Minneapolis, escorts in Tulsa, escorts in Tampa, escorts in Arlington, escorts in New Orleans, escorts in Wichita, escorts in Bakersfield, escorts in Cleveland, escorts in Aurora, escorts in Anaheim, escorts in Honolulu, escorts in Santa Ana, escorts in Riverside, escorts in Corpus Christi, escorts in Lexington, escorts in Henderson, escorts in Stockton, escorts in Saint Paul, escorts in Cincinnati, escorts in St. Louis, escorts in Pittsburgh, escorts in Greensboro, escorts in Lincoln, escorts in Plano, escorts in Orlando, escorts in Irvine, escorts in Newark, escorts in Durham, escorts in Chula Vista, escorts in Toledo, escorts in Fort Wayne, escorts in St. Petersburg, escorts in Laredo, escort",

  // Open Graph Meta Tags
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

  // Twitter Card Meta Tags
  twitter: {
    card: "summary_large_image",
    title: "MeetAnEscort - Premium Escort Dating",
    description: "Verified independent escorts and companions in your area",
    images: ["https://ibb.co/zVx5NXRS"],
  },

  // Additional Important Meta Tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Canonical URL
  alternates: {
    canonical: "https://meetanescort.com",
  },

  // Verification (when you have these)
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },

  // Other Meta Tags
  authors: [{ name: "MeetAnEscort" }],
  creator: "MeetAnEscort",
  publisher: "MeetAnEscort",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Theme Color for Mobile
  themeColor: "#EC4899",
  manifest: "/manifest.json",
};

// Structured Data Components
const StructuredDataScripts = () => {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "Website",
    name: "MeetAnEscort",
    url: "https://meetanescort.com",
    description:
      "Premium escort dating and companionship platform connecting verified independent escorts with clients",
    publisher: {
      "@type": "Organization",
      name: "MeetAnEscort",
      logo: {
        "@type": "ImageObject",
        url: "https://meetanescort.com/logo.png",
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://meetanescort.com/discover?location={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const datingServiceSchema = {
    "@context": "https://schema.org",
    "@type": "DatingService",
    name: "MeetAnEscort",
    description: "Premium escort dating and companionship services",
    url: "https://meetanescort.com",
    serviceType: "adult dating, companionship services",
    areaServed: "Worldwide",
    availableLanguage: ["English"],
    knowsAbout: [
      "adult dating",
      "companionship",
      "escort services",
      "premium dating",
    ],
  };

  return (
    <>
      <script
        key="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        key="dating-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datingServiceSchema),
        }}
      />
    </>
  );
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Manifest Link */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Color for Different Browsers */}
        <meta name="theme-color" content="#EC4899" />
        <meta name="msapplication-TileColor" content="#EC4899" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Favicon Links */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Structured Data Scripts */}
        <StructuredDataScripts />

        {/* Additional Meta Tags for Better SEO */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="language" content="en" />
        <meta name="revisit-after" content="7 days" />
        <meta name="author" content="MeetAnEscort" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />

        {/* Geo Tags */}
        <meta name="geo.region" content="Global" />
        <meta name="geo.placename" content="Global" />
        <meta name="geo.position" content="global" />
        <meta name="ICBM" content="global" />

        {/* Social Media Meta Tags */}
        <meta property="og:site_name" content="MeetAnEscort" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Additional Tags */}
        <meta name="twitter:site" content="@meetanescort" />
        <meta name="twitter:creator" content="@meetanescort" />

        {/* Mobile Specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MeetAnEscort" />

        {/* Preload Critical Resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
      </head>

      <body className="font-sans bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
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
