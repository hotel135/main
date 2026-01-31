// src/app/discover/[...location]/layout.js
export async function generateMetadata({ params }) {
  const { location } = params;

  if (!location || location.length === 0) {
    return {
      title: "Discover Escorts by Location | MeetAnEscort",
      description:
        "Find verified independent escorts in cities and countries worldwide.",
    };
  }

  const formattedLocation = location
    .map((part) =>
      part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .join(", ");

  return {
    title: `Find Independent Escort in ${formattedLocation} | MeetAnEscort`,
    description: `Discover verified ${formattedLocation} escorts, from independent companions to BDSM, kink, massage, and video services. Active with verified contact information.`,

    openGraph: {
      title: `Find Escort in ${formattedLocation} | MeetAnEscort`,
      description: `Verified independent escorts and companions in ${formattedLocation}.`,
      url: `https://meetanescort.com/discover/${location.join("/")}`,
    },
  };
}

export default function DiscoverLocationLayout({ children }) {
  return <>{children}</>;
}
