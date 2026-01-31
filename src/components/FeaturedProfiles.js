// src/components/FeaturedProfiles.js
"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function FeaturedProfiles() {
  const [featuredProfiles, setFeaturedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadFeaturedProfiles();
  }, []);

  const loadFeaturedProfiles = async () => {
    try {
      console.log("Loading featured profiles...");

      // Step 1: Query admin-selected featured ads
      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        where("isFeatured", "==", true),
        limit(20),
      );

      const adsSnapshot = await getDocs(adsQuery);
      console.log(`Found ${adsSnapshot.size} admin-selected ads`);

      const adminSelectedProfiles = [];

      if (adsSnapshot.size > 0) {
        // Process admin-selected ads
        const adsData = await Promise.all(
          adsSnapshot.docs.map(async (adDoc) => {
            const adData = adDoc.data();

            // Get user data for each ad
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
              displayName: adData.title || userData.displayName || "Unknown",
              age: adData.age || userData.age || "N/A",
              location: adData.location || userData.location || "Unknown",
              photos: adData.selectedPhoto
                ? [{ url: adData.selectedPhoto }]
                : userData.photos || [],
              verified: userData.verified || false,
              incallPrice: adData.priceRange || userData.incallPrice,
              outcallPrice: userData.outcallPrice,
              isAd: true,
              isAdminSelected: true,
              bio: adData.bio || userData.bio,
              services: adData.services || userData.services || [],
              contactPhone: adData.contactPhone || userData.contactPhone,
              boostUntil: adData.boostUntil,
              featuredOrder: adData.featuredOrder || 999,
            };
          }),
        );

        // Sort by featuredOrder if available
        adminSelectedProfiles.push(
          ...adsData.sort(
            (a, b) => (a.featuredOrder || 999) - (b.featuredOrder || 999),
          ),
        );
      }

      // Step 2: If we have less than 20 profiles, fill with regular active ads
      const remainingSlots = 20 - adminSelectedProfiles.length;
      console.log(`Remaining slots to fill: ${remainingSlots}`);

      if (remainingSlots > 0) {
        const regularProfiles = await loadRegularProfiles(remainingSlots);
        console.log(`Found ${regularProfiles.length} regular profiles`);

        // Combine admin-selected + regular profiles
        const combinedProfiles = [...adminSelectedProfiles, ...regularProfiles];

        setFeaturedProfiles(combinedProfiles);
      } else {
        // We already have 20+ admin-selected profiles
        setFeaturedProfiles(adminSelectedProfiles.slice(0, 20));
      }

      console.log(`Total profiles loaded: ${featuredProfiles.length}`);
    } catch (error) {
      console.error("Error loading featured profiles:", error);
      // Fallback to simpler query
      await loadFallbackProfiles();
    } finally {
      setLoading(false);
    }
  };

  const loadRegularProfiles = async (limitCount) => {
    try {
      console.log(`Loading ${limitCount} regular profiles...`);

      // SIMPLIFIED QUERY: Get recently created active ads without complex conditions
      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(limitCount * 3), // Get extra to account for filtering
      );

      const adsSnapshot = await getDocs(adsQuery);
      const regularProfiles = [];

      for (const adDoc of adsSnapshot.docs) {
        const adData = adDoc.data();

        // Skip if this is already a featured ad
        if (adData.isFeatured === true) {
          continue;
        }

        // Skip if user has no photos/selectedPhoto
        if (!adData.selectedPhoto) {
          continue;
        }

        // Get user data
        let userData = {};
        try {
          const userDoc = await getDoc(doc(db, "users", adData.userId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (error) {
          console.log("User data not available for ad:", adDoc.id);
        }

        // Skip if user profile is not active (optional check)
        if (userData.profileActive === false) {
          continue;
        }

        regularProfiles.push({
          id: adDoc.id,
          ...adData,
          ...userData,
          isAd: true,
          isAdminSelected: false,
          displayName: adData.title || userData.displayName || "Unknown",
          age: adData.age || userData.age || "N/A",
          location: adData.location || userData.location || "Unknown",
          photos: adData.selectedPhoto
            ? [{ url: adData.selectedPhoto }]
            : userData.photos || [],
          verified: userData.verified || false,
          incallPrice: adData.priceRange || userData.incallPrice,
          bio: adData.bio || userData.bio,
          services: adData.services || userData.services || [],
        });

        if (regularProfiles.length >= limitCount) break;
      }

      return regularProfiles;
    } catch (error) {
      console.error("Error loading regular profiles:", error);
      // If this fails, try an even simpler approach
      return await loadSimpleProfiles(limitCount);
    }
  };

  const loadSimpleProfiles = async (limitCount) => {
    try {
      console.log("Trying simple profiles load...");
      // Even simpler: just get the most recent ads
      const adsQuery = query(
        collection(db, "ads"),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      );

      const adsSnapshot = await getDocs(adsQuery);
      const simpleProfiles = [];

      for (const adDoc of adsSnapshot.docs) {
        const adData = adDoc.data();

        // Skip featured ads
        if (adData.isFeatured === true) continue;

        // Get minimal user data
        let userData = {};
        try {
          const userDoc = await getDoc(doc(db, "users", adData.userId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (error) {
          console.log("Simple: User data not available");
        }

        simpleProfiles.push({
          id: adDoc.id,
          ...adData,
          ...userData,
          isAd: true,
          isAdminSelected: false,
          displayName: adData.title || "Member",
          age: adData.age || "",
          location: adData.location || "",
          photos: adData.selectedPhoto ? [{ url: adData.selectedPhoto }] : [],
        });
      }

      return simpleProfiles;
    } catch (error) {
      console.error("Error in simple profiles load:", error);
      return [];
    }
  };

  const loadFallbackProfiles = async () => {
    try {
      console.log("Using fallback profiles load...");
      // Last resort: get any ads
      const adsQuery = query(collection(db, "ads"), limit(20));

      const adsSnapshot = await getDocs(adsQuery);
      const fallbackProfiles = [];

      for (const adDoc of adsSnapshot.docs) {
        const adData = adDoc.data();

        let userData = {};
        try {
          const userDoc = await getDoc(doc(db, "users", adData.userId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (error) {
          console.log("Fallback: User data not available");
        }

        fallbackProfiles.push({
          id: adDoc.id,
          ...adData,
          ...userData,
          isAd: true,
          isAdminSelected: adData.isFeatured === true,
          displayName: adData.title || userData.displayName || "Member",
          age: adData.age || userData.age || "",
          location: adData.location || userData.location || "",
          photos: adData.selectedPhoto
            ? [{ url: adData.selectedPhoto }]
            : userData.photos || [],
          verified: userData.verified || false,
        });
      }

      // Sort: featured first, then others
      fallbackProfiles.sort((a, b) => {
        if (a.isAdminSelected && !b.isAdminSelected) return -1;
        if (!a.isAdminSelected && b.isAdminSelected) return 1;
        return 0;
      });

      setFeaturedProfiles(fallbackProfiles.slice(0, 20));
    } catch (error) {
      console.error("Error in fallback load:", error);
      setFeaturedProfiles([]);
    }
  };

  const displayedProfiles = showAll
    ? featuredProfiles
    : featuredProfiles.slice(0, 8);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Featured Profiles
            </h2>
            <p className="text-pink-200">Loading featured members...</p>
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
      </section>
    );
  }

  if (featuredProfiles.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Featured Profiles
          </h2>
          <p className="text-pink-200">
            No featured profiles available at the moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-pink-500/20 text-pink-300 px-4 py-2 rounded-full text-sm font-medium border border-pink-500/30 mb-4">
            {featuredProfiles.some((p) => p.isAdminSelected)
              ? "⭐ Featured & Active Members"
              : "⭐ Active Members"}
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            {featuredProfiles.some((p) => p.isAdminSelected)
              ? "Featured Profiles"
              : "Active Members"}
          </h2>
          <p className="text-xl text-pink-200 max-w-2xl mx-auto">
            {featuredProfiles.some((p) => p.isAdminSelected)
              ? "Discover our featured professionals and community members."
              : "Browse our active community members."}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Showing {displayedProfiles.length} of {featuredProfiles.length}{" "}
            profiles
          </p>
        </div>

        {/* Profiles Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 transition-all duration-500 ${
            showAll ? "max-h-full" : "max-h-[800px] overflow-hidden"
          }`}
        >
          {displayedProfiles.map((profile, index) => (
            <FeaturedProfileCard
              key={`${profile.id}-${index}`}
              profile={profile}
              index={index}
            />
          ))}
        </div>

        {/* View More/Less Button */}
        {featuredProfiles.length > 8 && (
          <div className="text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="group bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 px-8 py-3 rounded-xl font-semibold hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 hover:border-pink-400 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                {showAll ? "Show Less" : `View More Profiles`}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    showAll ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// Featured Profile Card Component
function FeaturedProfileCard({ profile, index }) {
  const mainPhoto = profile.photos?.[0]?.url || profile.selectedPhoto;
  const delay = index * 0.1;

  const profileUrl = profile.userId
    ? `/profile/${profile.userId}${profile.id !== profile.userId ? `?ad=${profile.id}` : ""}`
    : `/profile/${profile.id}`;

  return (
    <Link href={profileUrl}>
      <div
        className="group relative bg-black/30 rounded-2xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20 overflow-hidden cursor-pointer"
        style={{
          animationDelay: `${delay}s`,
          animation: "fadeInUp 0.6s ease-out forwards",
          opacity: 0,
        }}
      >
        {/* Admin Selected Badge */}
        {profile.isAdminSelected && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              ⭐ FEATURED
            </span>
          </div>
        )}

        {/* Regular Profile Badge */}
        {!profile.isAdminSelected && profile.isAd && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              🔥 ACTIVE
            </span>
          </div>
        )}

        {/* Verified Badge */}
        {profile.verified && (
          <div className="absolute top-3 right-3 z-10">
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
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232d3748'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%239f7aea' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
              }}
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
              {profile.displayName || "Member"}
            </h3>
            {profile.age && (
              <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded text-xs ml-2 whitespace-nowrap">
                {profile.age}
              </span>
            )}
          </div>

          {profile.location && (
            <p
              className="text-pink-200 text-xs mb-3 truncate"
              title={profile.location}
            >
              📍 {profile.location}
            </p>
          )}

          {/* Services Badges */}
          {profile.services && profile.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {profile.services.includes("incall") && (
                <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-xs">
                  Incall
                </span>
              )}
              {profile.services.includes("outcall") && (
                <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs">
                  Outcall
                </span>
              )}
              {profile.services.includes("video") && (
                <span className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded text-xs">
                  Video
                </span>
              )}
            </div>
          )}

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

// Add CSS for animation
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
