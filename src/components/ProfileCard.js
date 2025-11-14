// src/components/ProfileCard.js - OPTIMIZED
"use client";
import Link from "next/link";
import { useState, memo, useCallback } from "react";

const ProfileCard = memo(function ProfileCard({ profile }) {
  const mainPhoto = profile.photos?.[0]?.url || "/default-avatar.jpg";
  const age = profile.age || "Not specified";
  const location = profile.location || "Location not specified";
  const incallPrice = profile.incallPrice
    ? `$${profile.incallPrice}`
    : "Contact for pricing";
  const bio = profile.bio || "No bio provided yet.";

  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const toggleExpand = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Optimize text display
  const displayText = isExpanded ? bio : bio.slice(0, 100);
  const needsTruncation = bio.length > 100 && !isExpanded;

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="group block"
      prefetch={false} // Disable prefetch to reduce initial load
    >
      <div className="bg-black/30 rounded-2xl overflow-hidden border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-pink-500/20 h-full flex flex-col">
        {/* Ad Badge */}
        {profile.isAd && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              🔥 PROMOTED
            </span>
          </div>
        )}

        {/* Profile Image with optimized loading */}
        <div className="relative h-48 overflow-hidden flex-shrink-0 bg-gray-700">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-600 w-full h-full"></div>
            </div>
          )}

          {imageError ? (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-white text-sm">No Image</span>
            </div>
          ) : (
            <img
              src={mainPhoto}
              alt={`${profile.displayName || "Profile"} photo`}
              className={`w-full h-full object-cover transition duration-500 ${
                imageLoaded ? "group-hover:scale-110" : "opacity-0"
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
        </div>

        {/* Profile Info */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-white text-lg truncate flex-1 mr-2">
              {profile.displayName || "Anonymous"}
            </h3>
            <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded text-xs whitespace-nowrap flex-shrink-0">
              {age}
            </span>
          </div>

          {/* Location */}
          <p className="text-pink-200 text-sm mb-3 truncate" title={location}>
            📍 {location}
          </p>

          {/* Bio Section */}
          {bio !== "No bio provided yet." && (
            <div className="mb-3 flex-1 min-h-[60px]">
              <p className="text-pink-200 text-sm leading-relaxed break-words">
                {displayText}
                {needsTruncation && "..."}
              </p>
              {bio.length > 100 && (
                <button
                  onClick={toggleExpand}
                  className="text-pink-400 hover:text-pink-300 text-xs font-medium mt-1 transition duration-200 focus:outline-none"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          )}

          {/* Price and Verification */}
          <div className="flex justify-between items-center mb-3 mt-auto">
            <span className="text-green-400 font-semibold">{incallPrice}</span>
            {profile.verified && (
              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                ✅ Verified
              </span>
            )}
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.incallPrice && (
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                Incall
              </span>
            )}
            {profile.outcallPrice && (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                Outcall
              </span>
            )}
          </div>

          {/* View Profile Button */}
          <button className="w-full bg-pink-500/20 text-pink-300 py-2 rounded-lg hover:bg-pink-500/30 transition duration-300 text-sm font-medium focus:outline-none">
            View Profile
          </button>
        </div>
      </div>
    </Link>
  );
});

ProfileCard.displayName = "ProfileCard";

export default ProfileCard;
