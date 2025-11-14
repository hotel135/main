// src/app/discover/[...location]/page.js (Simplified)
"use client";
import { useParams } from "next/navigation";
import DiscoverPage from "../page";

export default function DiscoverLocationPage() {
  const params = useParams();
  const locationParts = params.location || []; // ['fargo', 'northdakota', 'unitedstates']

  // Simply join with commas for display - let the matching logic handle the rest
  const displayLocation = locationParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(", ");

  return <DiscoverPage initialLocation={displayLocation} />;
}
