// src/app/discover/page.js - COMPLETE OPTIMIZED VERSION
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import LocationSearch from "@/components/ui/LocationSearch";
import ProfileCard from "@/components/ProfileCard";
import LocationFooter from "@/components/ui/LocationFooter";
import { useRouter } from "next/navigation";
import {
  normalizeLocation,
  expandAbbreviations,
  extractLocationHierarchy,
  getFallbackLocations,
} from "@/utils/locationUtils";

export default function DiscoverPage({ initialLocation = "" }) {
  const [profiles, setProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [debouncedLocation, setDebouncedLocation] = useState(initialLocation);
  const [filters, setFilters] = useState({
    gender: "",
    ageRange: "",
    services: [],
    sortBy: "recent",
  });
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

  // Load all profiles initially
  useEffect(() => {
    loadAllProfiles();
  }, []);

  const loadAllProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      console.time("Initial data load");

      // Load ads
      let adsData = [];
      try {
        const adsQuery = query(
          collection(db, "ads"),
          where("status", "==", "active"),
          limit(15)
        );
        const adsSnapshot = await getDocs(adsQuery);
        adsData = adsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isAd: true,
        }));
      } catch (adsError) {
        console.warn("Ads query failed:", adsError);
      }
      setAds(adsData);

      // Load all provider profiles
      let usersQuery;
      let usersSnapshot;

      try {
        usersQuery = query(
          collection(db, "users"),
          where("userType", "==", "provider"),
          where("profileActive", "==", true),
          where("verified", "==", true),
          orderBy("lastUpdated", "desc"),
          limit(100)
        );
        usersSnapshot = await getDocs(usersQuery);
      } catch (queryError) {
        console.warn("Optimized query failed, using fallback:", queryError);
        usersQuery = query(
          collection(db, "users"),
          where("userType", "==", "provider"),
          limit(100)
        );
        usersSnapshot = await getDocs(usersQuery);
      }

      const usersData = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          bio: data.bio
            ? data.bio.substring(0, 100) + (data.bio.length > 100 ? "..." : "")
            : "",
          isAd: false,
        };
      });

      setAllProfiles(usersData);
      setInitialLoadComplete(true);
      console.timeEnd("Initial data load");
    } catch (error) {
      console.error("Error loading data:", error);
      setError({
        type: "load_failed",
        message: "Failed to load profiles. Please try again.",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Smart location filtering with fallbacks
  const filterProfilesByLocation = useCallback((profiles, location) => {
    if (!location) return profiles;

    const normalizedSearch = normalizeLocation(expandAbbreviations(location));
    const fallbacks = getFallbackLocations(location);

    const scoredProfiles = profiles
      .map((profile) => {
        const score = extractLocationHierarchy(location, profile.location);
        return { ...profile, matchScore: score };
      })
      .filter((profile) => profile.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    // Determine match level for UI feedback
    if (scoredProfiles.length > 0) {
      const bestMatch = scoredProfiles[0].matchScore;
      if (bestMatch >= 80) setCurrentMatchLevel("exact");
      else if (bestMatch >= 60) setCurrentMatchLevel("state");
      else if (bestMatch >= 40) setCurrentMatchLevel("country");
      else setCurrentMatchLevel("partial");
    } else {
      setCurrentMatchLevel("none");
    }

    setFallbackLocations(fallbacks);
    return scoredProfiles;
  }, []);

  // Apply location filtering when search changes
  useEffect(() => {
    if (initialLoadComplete && allProfiles.length > 0) {
      const filtered = filterProfilesByLocation(allProfiles, debouncedLocation);
      setProfiles(filtered);
    }
  }, [
    debouncedLocation,
    allProfiles,
    initialLoadComplete,
    filterProfilesByLocation,
  ]);

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

  // Load more profiles
  const loadMoreProfiles = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      let usersQuery;
      let usersSnapshot;

      try {
        usersQuery = query(
          collection(db, "users"),
          where("userType", "==", "provider"),
          where("profileActive", "==", true),
          where("verified", "==", true),
          orderBy("lastUpdated", "desc"),
          startAfter(lastDoc),
          limit(12)
        );
        usersSnapshot = await getDocs(usersQuery);
      } catch (error) {
        console.warn("Load more query failed:", error);
        return;
      }

      if (usersSnapshot.empty) {
        setHasMore(false);
        return;
      }

      const lastVisible = usersSnapshot.docs[usersSnapshot.docs.length - 1];
      setLastDoc(lastVisible);

      const newProfiles = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          bio: data.bio
            ? data.bio.substring(0, 100) + (data.bio.length > 100 ? "..." : "")
            : "",
          isAd: false,
        };
      });

      const filteredNewProfiles = filterProfilesByLocation(
        newProfiles,
        debouncedLocation
      );
      setAllProfiles((prev) => [...prev, ...filteredNewProfiles]);

      if (usersSnapshot.docs.length < 12) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more profiles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Optimized combined results with ads
  const combinedResults = useMemo(() => {
    if (!profiles.length) return [];

    const adsMap = new Map(ads.map((ad) => [ad.userId, ad]));

    const profilesWithAds = profiles.map((profile) => {
      const ad = adsMap.get(profile.id);
      return ad ? { ...profile, isAd: true, adData: ad } : profile;
    });

    return [...profilesWithAds].sort((a, b) => {
      if (a.isAd && !b.isAd) return -1;
      if (!a.isAd && b.isAd) return 1;

      switch (filters.sortBy) {
        case "recent":
          const dateA =
            a.lastUpdated?.toDate?.() || a.lastUpdated || new Date(0);
          const dateB =
            b.lastUpdated?.toDate?.() || b.lastUpdated || new Date(0);
          return new Date(dateB) - new Date(dateA);

        case "price-low":
          return (
            (a.incallPrice || Number.MAX_SAFE_INTEGER) -
            (b.incallPrice || Number.MAX_SAFE_INTEGER)
          );

        case "price-high":
          return (b.incallPrice || 0) - (a.incallPrice || 0);

        default:
          return 0;
      }
    });
  }, [profiles, ads, filters.sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreProfiles();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById("load-more-trigger");
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  // Enhanced results display with location feedback
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
  const promotedCount = combinedResults.filter((p) => p.isAd).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {searchLocation
              ? `Independent escorts in ${searchLocation}`
              : "Find Independent escorts near you"}
          </h1>
          <p className="text-pink-200">
            Find verified professionals in your area
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

        {/* Filters */}
        <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-pink-500/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.gender}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, gender: e.target.value }))
              }
              className="px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white"
            >
              <option value="">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
            </select>

            <select
              value={filters.ageRange}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, ageRange: e.target.value }))
              }
              className="px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white"
            >
              <option value="">All Ages</option>
              <option value="18-25">18-25</option>
              <option value="26-30">26-30</option>
              <option value="31-35">31-35</option>
              <option value="36-40">36-40</option>
              <option value="41+">41+</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="px-4 py-3 bg-black/20 border border-pink-500/30 rounded-xl text-white"
            >
              <option value="recent">Most Recent</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            <button
              onClick={() => {
                setFilters({
                  gender: "",
                  ageRange: "",
                  services: [],
                  sortBy: "recent",
                });
              }}
              className="px-4 py-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-300 hover:bg-pink-500/30 transition duration-300"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && !initialLoadComplete ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-pink-200">Searching for profiles...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-pink-200">
                Found {combinedResults.length}{" "}
                {combinedResults.length === 1 ? "provider" : "providers"}
                {searchLocation && ` for "${searchLocation}"`}
              </p>
              <div className="flex items-center gap-4">
                {promotedCount > 0 && (
                  <p className="text-pink-300 text-sm">
                    {promotedCount} promoted{" "}
                    {promotedCount === 1 ? "profile" : "profiles"}
                  </p>
                )}
              </div>
            </div>

            {/* Profiles Grid */}
            {combinedResults.length === 0 && initialLoadComplete ? (
              <div className="text-center py-16 bg-black/20 rounded-2xl border border-pink-500/20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No providers found
                </h3>
                <p className="text-pink-200 mb-4">
                  Try searching for a different location or broader area.
                </p>
                <button
                  onClick={() => {
                    setSearchLocation("");
                    router.push("/discover");
                  }}
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition duration-300"
                >
                  Show All Providers
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {combinedResults.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} />
                  ))}
                </div>

                {/* Load More Trigger */}
                {hasMore && (
                  <div
                    id="load-more-trigger"
                    className="h-20 flex justify-center items-center mt-8"
                  >
                    {loadingMore ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                        <span className="text-pink-200">
                          Loading more profiles...
                        </span>
                      </div>
                    ) : (
                      <div className="h-10"></div>
                    )}
                  </div>
                )}

                {/* End of Results Message */}
                {!hasMore && combinedResults.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-pink-300">
                      ve reached the end of the results
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Dynamic Location Footer */}
      <LocationFooter currentLocation={searchLocation} />
    </div>
  );
}
