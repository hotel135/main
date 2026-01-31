"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import LocationSearch from "@/components/ui/LocationSearch";
import LocationFooter from "@/components/ui/LocationFooter";
import { useRouter } from "next/navigation";
import { getFallbackLocations } from "@/utils/locationUtils";
import Link from "next/link";

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState([]);
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [currentMatchLevel, setCurrentMatchLevel] = useState("exact");
  const [fallbackLocations, setFallbackLocations] = useState([]);
  const router = useRouter();

  const searchTimeoutRef = useRef(null);

  // FIXED: Read location from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;

      // If just "/discover", leave search empty
      if (path === "/discover") {
        setSearchLocation("");
        setDebouncedLocation("");
        return;
      }

      // If we have a location in URL
      if (path.startsWith("/discover/")) {
        const urlLocation = path.replace("/discover/", "");

        if (urlLocation) {
          // Decode URL and convert to readable format
          const decodedLocation = decodeURIComponent(urlLocation);

          // Convert "edo-state/nigeria" to "Edo state, Nigeria"
          const readableLocation = decodedLocation
            .split("/")
            .map((part) =>
              part
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase()),
            )
            .join(", ");

          setSearchLocation(readableLocation);
          setDebouncedLocation(readableLocation);
        }
      }
    }
  }, []);

  // Simple debounce for filtering
  const handleInputChange = (value) => {
    setSearchLocation(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedLocation(value);
    }, 300);
  };

  // Load ads
  useEffect(() => {
    loadAllAds();
  }, []);

  const loadAllAds = async () => {
    setLoading(true);
    try {
      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        orderBy("priority", "desc"),
        orderBy("lastPaymentDate", "desc"),
        limit(50),
      );

      const adsSnapshot = await getDocs(adsQuery);

      const adsData = await Promise.all(
        adsSnapshot.docs.map(async (adDoc) => {
          const adData = adDoc.data();

          let userData = {};
          try {
            const userDoc = await getDoc(doc(db, "users", adData.userId));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (error) {
            console.log("User data not available for ad:", adDoc.id);
          }

          return {
            id: adDoc.id,
            ...adData,
            displayName: adData.title || userData.displayName,
            age: adData.age || userData.age,
            location: adData.location || userData.location,
            photos: adData.selectedPhoto
              ? [{ url: adData.selectedPhoto }]
              : userData.photos || [],
            verified: userData.verified || false,
            incallPrice: adData.priceRange || userData.incallPrice,
            outcallPrice: userData.outcallPrice,
            isAd: true,
            bio: adData.bio,
            services: adData.services || [],
            contactPhone: adData.contactPhone,
            boostUntil: adData.boostUntil,
            priority: adData.priority,
            userId: adData.userId,
          };
        }),
      );

      setAllAds(adsData);
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error loading ads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter ads by location
  const filterAdsByLocation = useCallback((ads, location) => {
    if (!location) return ads;

    const search = location.toLowerCase().trim();
    const fallbacks = getFallbackLocations(location);

    const scoredAds = ads
      .map((ad) => {
        if (!ad.location) return { ...ad, matchScore: 0 };

        const adLoc = ad.location.toLowerCase().trim();

        if (adLoc === search) return { ...ad, matchScore: 100 };

        let score = 0;
        const searchCity = search.split(",")[0].trim();
        const adCity = adLoc.split(",")[0].trim();

        if (searchCity === adCity) {
          score = 90;
        } else if (adLoc.includes(searchCity) || search.includes(adCity)) {
          score = 70;
        } else {
          const searchWords = new Set(
            search.split(/[,\s]+/).filter((w) => w.length > 2),
          );
          const adWords = new Set(
            adLoc.split(/[,\s]+/).filter((w) => w.length > 2),
          );

          let matches = 0;
          searchWords.forEach((word) => {
            if (adWords.has(word)) matches++;
          });

          if (matches > 0) {
            score = (matches / searchWords.size) * 60;
          }
        }

        return { ...ad, matchScore: score };
      })
      .filter((ad) => ad.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    if (scoredAds.length > 0) {
      const bestMatch = scoredAds[0].matchScore;
      if (bestMatch >= 80) setCurrentMatchLevel("exact");
      else if (bestMatch >= 60) setCurrentMatchLevel("state");
      else if (bestMatch >= 40) setCurrentMatchLevel("country");
      else setCurrentMatchLevel("partial");
    } else {
      setCurrentMatchLevel("none");
    }

    setFallbackLocations(fallbacks);
    return scoredAds;
  }, []);

  // Apply filtering
  useEffect(() => {
    if (initialLoadComplete && allAds.length > 0) {
      const filtered = filterAdsByLocation(allAds, debouncedLocation);
      setProfiles(filtered);
    }
  }, [debouncedLocation, allAds, initialLoadComplete, filterAdsByLocation]);

  // Handle search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const location = formData.get("location");

    if (location) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      setSearchLocation(location);
      setDebouncedLocation(location);

      // Create clean URL
      const urlFriendly = location
        .toLowerCase()
        .replace(/\s*,\s*/g, "/")
        .replace(/\s+/g, "-");

      router.push(`/discover/${urlFriendly}`);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Get feedback message
  const getLocationFeedback = () => {
    if (!searchLocation) return null;

    switch (currentMatchLevel) {
      case "exact":
        return {
          message: `Showing profiles in ${searchLocation}`,
          type: "success",
        };
      case "state":
        return {
          message: `No exact matches for ${searchLocation}. Showing profiles in the broader area.`,
          type: "info",
        };
      case "country":
        return {
          message: `Showing profiles across ${searchLocation}`,
          type: "info",
        };
      case "partial":
        return {
          message: `Showing related profiles for ${searchLocation}`,
          type: "warning",
        };
      case "none":
        return {
          message: `No profiles found for "${searchLocation}"`,
          type: "error",
          fallbacks: fallbackLocations,
        };
      default:
        return null;
    }
  };

  const locationFeedback = getLocationFeedback();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Discover</h2>
            <p className="text-pink-200">Loading profiles...</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 rounded-2xl h-64 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="fixed top-4 right-4 z-30">
          <Link
            href="/"
            className="group border-2 border-pink-500/50 text-pink-300 px-4 py-2 rounded-lg font-medium hover:bg-pink-500/10 hover:border-pink-400 transition"
          >
            ← Back
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Find Independent Escort in{" "}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {searchLocation || "Your Area"}
            </span>
          </h2>
          <p className="text-pink-200">
            Discover verified{" "}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {searchLocation || "Your Area"}
            </span>{" "}
            escorts, from independent companions to BDSM, kink, massage, and
            video services. Active with verified contact information{" "}
          </p>
        </div>

        {/* Search Bar - NOW EMPTY WHEN NO LOCATION */}
        <div className="bg-black/30 rounded-xl p-6 mb-8 border border-pink-500/20">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <LocationSearch
                  name="location"
                  value={searchLocation} // This will be empty at /discover
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400"
                  placeholder="🔍 Search city, state, or country..."
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {searchLocation && (
          <div className="mb-6">
            <p className="text-pink-200">
              Found {profiles.length}{" "}
              {profiles.length === 1 ? "profile" : "profiles"} for "
              {searchLocation}"
            </p>
          </div>
        )}

        {/* Profiles */}
        {profiles.length === 0 && initialLoadComplete ? (
          <div className="text-center py-16 bg-black/20 rounded-xl border border-pink-500/20">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchLocation ? "No profiles found" : "Search for a location"}
            </h3>
            <p className="text-pink-200 mb-4">
              {searchLocation
                ? "Try searching for a different location."
                : "Enter a city, state, or country above to find escorts."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profiles.map((profile, index) => (
              <FeaturedProfileCard
                key={profile.id}
                profile={profile}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Location Footer */}
        <LocationFooter currentLocation={searchLocation} />
      </div>
    </div>
  );
}

// FeaturedProfileCard Component
function FeaturedProfileCard({ profile, index }) {
  const mainPhoto = profile.photos?.[0]?.url || profile.selectedPhoto;

  return (
    <Link href={`/profile/${profile.userId || profile.id}`}>
      <div className="group relative bg-black/30 rounded-xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 overflow-hidden">
        {/* Promoted Badge */}
        {profile.isAd && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              🔥 PROMOTED
            </span>
          </div>
        )}

        {/* Profile Image */}
        <div className="relative h-48 overflow-hidden">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={profile.displayName}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-4xl text-pink-300">👤</span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-white text-sm truncate">
              {profile.displayName}
            </h3>
            <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded text-xs">
              {profile.age}
            </span>
          </div>

          <p className="text-pink-200 text-xs mb-3 truncate">
            📍 {profile.location}
          </p>

          <div className="flex justify-between items-center">
            <span className="text-green-400 font-semibold text-sm">
              {profile.incallPrice
                ? `$${profile.incallPrice}`
                : profile.priceRange
                  ? `$${profile.priceRange}`
                  : "Contact"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
