// src/app/discover/page.js - USING EXACT SAME FEATUREDPROFILECARD
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import LocationSearch from "@/components/ui/LocationSearch";
import LocationFooter from "@/components/ui/LocationFooter";
import { useRouter } from "next/navigation";
import { getFallbackLocations } from "@/utils/locationUtils";
import Link from "next/link";

export default function DiscoverPage({ initialLocation = "" }) {
  const [profiles, setProfiles] = useState([]);
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [debouncedLocation, setDebouncedLocation] = useState(initialLocation);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState(null);
  const [currentMatchLevel, setCurrentMatchLevel] = useState("exact");
  const [fallbackLocations, setFallbackLocations] = useState([]);

  const router = useRouter();

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(searchLocation);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchLocation]);

  // Get location from URL parameters
  useEffect(() => {
    if (initialLocation) {
      const decodedLocation = decodeURIComponent(initialLocation);
      setSearchLocation(decodedLocation);
      return;
    }

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const locationParam = urlParams.get("location");
      if (locationParam) {
        const decodedLocation = decodeURIComponent(locationParam);
        setSearchLocation(decodedLocation);

        const urlFriendly = decodedLocation
          .toLowerCase()
          .replace(/\s*,\s*/g, "/")
          .replace(/\s+/g, " ");

        router.replace(`/discover/${urlFriendly}`);
      }
    }
  }, [initialLocation, router]);

  // Load only ads initially (EXACTLY LIKE FEATUREDPROFILES)
  useEffect(() => {
    loadAllAds();
  }, []);

  const loadAllAds = async () => {
    setLoading(true);
    setError(null);

    try {
      console.time("Initial ads load");

      // Load active ads (EXACT QUERY FROM FEATUREDPROFILES)
      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        orderBy("priority", "desc"),
        orderBy("lastPaymentDate", "desc"),
        limit(50)
      );

      const adsSnapshot = await getDocs(adsQuery);

      // Process ads and enrich with user data (EXACTLY LIKE FEATUREDPROFILES)
      const adsData = await Promise.all(
        adsSnapshot.docs.map(async (adDoc) => {
          const adData = adDoc.data();

          // Try to get additional user data (EXACTLY LIKE FEATUREDPROFILES)
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
            // Use ad data primarily, fallback to user data (EXACTLY LIKE FEATUREDPROFILES)
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
            // Additional ad-specific fields
            bio: adData.bio,
            services: adData.services || [],
            contactPhone: adData.contactPhone,
            boostUntil: adData.boostUntil,
            priority: adData.priority,
            userId: adData.userId, // CRITICAL FOR PROFILE LINKS
          };
        })
      );

      setAllAds(adsData);
      setInitialLoadComplete(true);
      console.timeEnd("Initial ads load");
    } catch (error) {
      console.error("Error loading ads:", error);
      setError({
        type: "load_failed",
        message: "Failed to load ads. Please try again.",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Smart location filtering for ads only
  const filterAdsByLocation = useCallback((ads, location) => {
    if (!location) return ads;

    const search = location.toLowerCase().trim();
    const fallbacks = getFallbackLocations(location);

    const scoredAds = ads
      .map((ad) => {
        if (!ad.location) return { ...ad, matchScore: 0 };

        const adLoc = ad.location.toLowerCase().trim();

        // EXACT MATCH
        if (adLoc === search) return { ...ad, matchScore: 100 };

        // SIMPLE LOCATION MATCHING LIKE FEATUREDPROFILES
        let score = 0;

        // Extract city names (first part before comma)
        const searchCity = search.split(",")[0].trim();
        const adCity = adLoc.split(",")[0].trim();

        // If cities match exactly
        if (searchCity === adCity) {
          score = 90;
        }
        // If one contains the other
        else if (adLoc.includes(searchCity) || search.includes(adCity)) {
          score = 70;
        }
        // Check for word overlap
        else {
          const searchWords = new Set(
            search.split(/[,\s]+/).filter((w) => w.length > 2)
          );
          const adWords = new Set(
            adLoc.split(/[,\s]+/).filter((w) => w.length > 2)
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

  // Apply location filtering when search changes
  useEffect(() => {
    if (initialLoadComplete && allAds.length > 0) {
      const filtered = filterAdsByLocation(allAds, debouncedLocation);
      setProfiles(filtered);
    }
  }, [debouncedLocation, allAds, initialLoadComplete, filterAdsByLocation]);

  // Handle search
  const handleSearch = (location) => {
    if (!location) return;

    setSearchLocation(location);
    setError(null);

    const urlFriendly = location
      .toLowerCase()
      .replace(/\s*,\s*/g, "/")
      .replace(/\s+/g, " ");

    router.push(`/discover/${urlFriendly}`);
  };

  // Enhanced results display with location feedback
  const getLocationFeedback = () => {
    if (!searchLocation) return null;

    switch (currentMatchLevel) {
      case "exact":
        return {
          message: `Showing  profiles in ${searchLocation}`,
          type: "success",
        };
      case "state":
        return {
          message: `No exact matches for ${searchLocation}. Showing  profiles in the broader area.`,
          type: "info",
        };
      case "country":
        return {
          message: `Showing  profiles across ${searchLocation}`,
          type: "info",
        };
      case "partial":
        return {
          message: `Showing related  profiles for ${searchLocation}`,
          type: "warning",
        };
      case "none":
        return {
          message: `No  profiles found for "${searchLocation}"`,
          type: "error",
          fallbacks: fallbackLocations,
        };
      default:
        return null;
    }
  };

  const locationFeedback = getLocationFeedback();

  // Loading skeleton (EXACTLY LIKE FEATUREDPROFILES)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Profiles</h2>
            <p className="text-pink-200">Discover our most exclusive members</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Back Button */}
        <div className="fixed top-4 right-4 z-50">
          <Link
            href="/"
            className="group border-2 border-pink-500/50 text-pink-300 px-8 py-4 rounded-xl font-semibold hover:bg-pink-500/10 hover:border-pink-400 transition-all duration-300 transform hover:scale-105 hover:text-white flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 font-medium">{error.message}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Location Feedback */}
        {locationFeedback && (
          <div
            className={`mb-6 rounded-xl p-4 border ${
              locationFeedback.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-200"
                : locationFeedback.type === "info"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-200"
                : locationFeedback.type === "warning"
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-200"
                : "bg-red-500/10 border-red-500/30 text-red-200"
            }`}
          >
            <p>{locationFeedback.message}</p>
            {locationFeedback.fallbacks &&
              locationFeedback.fallbacks.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm">Try searching for:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {locationFeedback.fallbacks.map((fallback, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(fallback)}
                        className="text-sm underline hover:no-underline px-2 py-1 bg-black/20 rounded"
                      >
                        {fallback}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Section Header (EXACTLY LIKE FEATUREDPROFILES) */}
        <div className="text-center mb-12 mt-20">
          {/* <div className="inline-flex items-center bg-pink-500/20 text-pink-300 px-4 py-2 rounded-full text-sm font-medium border border-pink-500/30 mb-4">
            ⭐ Promoted Ads
          </div> */}
          <h2 className="text-4xl font-bold text-white mb-4">
            Discover{" "}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Profiles
            </span>
          </h2>
          <p className="text-xl text-pink-200 max-w-2xl mx-auto">
            Discover our professionals. Active with verified contact
            information.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-pink-500/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const location = formData.get("location");
              if (location) {
                handleSearch(location);
              }
            }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <LocationSearch
                  name="location"
                  value={searchLocation}
                  onChange={setSearchLocation}
                  className="w-full px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white placeholder-pink-300/50 focus:outline-none focus:border-pink-400"
                  placeholder="🔍 Search city, state, or country..."
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition duration-300 whitespace-nowrap"
              >
                Search Location
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-pink-200">
            Found {profiles.length}{" "}
            {profiles.length === 1 ? "promoted profile" : "promoted profiles"}
            {searchLocation && ` for "${searchLocation}"`}
          </p>
        </div>

        {/* Profiles Grid (USING EXACT SAME FEATUREDPROFILECARD) */}
        {profiles.length === 0 && initialLoadComplete ? (
          <div className="text-center py-16 bg-black/20 rounded-2xl border border-pink-500/20">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-white mb-2">
              No promoted profiles found
            </h3>
            <p className="text-pink-200 mb-4">
              Try searching for a different location or check back later for new
              promoted profiles.
            </p>
            <button
              onClick={() => {
                setSearchLocation("");
                router.push("/discover");
              }}
              className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition duration-300"
            >
              Show All Promoted Profiles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {profiles.map((profile, index) => (
              <FeaturedProfileCard
                key={profile.id}
                profile={profile}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Location Footer */}
      <LocationFooter currentLocation={searchLocation} />
    </div>
  );
}

// EXACT SAME FEATUREDPROFILECARD COMPONENT FROM YOUR FEATUREDPROFILES
function FeaturedProfileCard({ profile, index }) {
  const mainPhoto = profile.photos?.[0]?.url || profile.selectedPhoto;
  const delay = index * 0.1;

  return (
    <Link href={`/profile/${profile.userId || profile.id}`}>
      <div
        className="group relative bg-black/30 rounded-2xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 overflow-hidden cursor-pointer"
        style={{
          animationDelay: `${delay}s`,
          animation: "fadeInUp 0.6s ease-out forwards",
        }}
      >
        {/* Promoted Badge - Always show for ads */}
        {profile.isAd && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              🔥 PROMOTED
            </span>
          </div>
        )}

        {/* Priority Badge - Show high priority ads */}
        {profile.priority > 1761062782 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              ⚡ BOOSTED
            </span>
          </div>
        )}

        {/* Verified Badge */}
        {profile.verified && (
          <div className="absolute top-12 right-3 z-10">
            <span className="bg-green-500 text-white p-1 rounded-full shadow-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        )}

        {/* Profile Image */}
        <div className="relative h-48 overflow-hidden">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={profile.displayName}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-4xl text-pink-300">👤</span>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-white text-sm truncate flex-1">
              {profile.displayName}
            </h3>
            <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded text-xs ml-2 whitespace-nowrap">
              {profile.age}
            </span>
          </div>

          <p
            className="text-pink-200 text-xs mb-3 truncate"
            title={profile.location}
          >
            📍 {profile.location}
          </p>

          {/* Services Badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {profile.services?.includes("incall") && (
              <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-xs">
                Incall
              </span>
            )}
            {profile.services?.includes("outcall") && (
              <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs">
                Outcall
              </span>
            )}
            {profile.services?.includes("video") && (
              <span className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded text-xs">
                Video
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-green-400 font-semibold text-sm">
              {profile.incallPrice
                ? `$${profile.incallPrice}`
                : profile.priceRange
                ? `$${profile.priceRange}`
                : "Contact"}
            </span>

            {/* Ad Stats */}
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {profile.views > 0 && <span>👁️ {profile.views}</span>}
              {profile.clicks > 0 && <span>👆 {profile.clicks}</span>}
            </div>
          </div>

          {/* Bio Preview */}
          {profile.bio && (
            <p className="text-gray-400 text-xs mt-2 line-clamp-2">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition duration-500" />
      </div>
    </Link>
  );
}
