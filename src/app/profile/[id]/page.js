// src/app/profile/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("photos");

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileDoc = await getDoc(doc(db, "users", profileId));

        if (!profileDoc.exists()) {
          throw new Error("Profile not found");
        }

        const profileData = profileDoc.data();
        setProfile(profileData);

        // Increment profile views
        await updateDoc(doc(db, "users", profileId), {
          views: (profileData.views || 0) + 1,
          lastViewed: new Date(),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-200 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Profile Not Found
          </h1>
          <p className="text-pink-200 mb-6">
            {error || "The profile you are looking for does not exist."}
          </p>
          <Link
            href="/discover"
            className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition duration-300"
          >
            Browse Other Profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header/Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-pink-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/discover"
              className="text-pink-300 hover:text-white transition duration-300"
            >
              ← Back to Discover
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-pink-200">🔥 Promoted Profile</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1">
            <ProfileOverview profile={profile} />
          </div>

          {/* Right Column - Content Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-black/30 rounded-2xl border border-pink-500/20 overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-pink-500/20">
                <nav className="flex space-x-8 px-6">
                  {["photos", "about", "services", "availability"].map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition duration-300 ${
                          activeTab === tab
                            ? "border-pink-500 text-pink-400"
                            : "border-transparent text-pink-200 hover:text-pink-300"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "photos" && (
                  <PhotoGallery
                    profile={profile}
                    onImageSelect={setSelectedImage}
                  />
                )}
                {activeTab === "about" && <AboutSection profile={profile} />}
                {activeTab === "services" && (
                  <ServicesSection profile={profile} />
                )}
                {activeTab === "availability" && (
                  <AvailabilitySection profile={profile} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

// Profile Overview Component
function ProfileOverview({ profile }) {
  const bio = profile.bio ? profile.bio : "Bio";

  const [isExpanded, setIsExpanded] = useState(false);

  if (!bio) {
    return (
      <p className="text-pink-300/70 text-sm italic">No bio provided yet.</p>
    );
  }

  const displayText = isExpanded ? bio : bio.slice(0, 120);
  const needsTruncation = bio.length > 120;
  const handleSendMessage = () => {
    // Get the phone number from profile (you might need to adjust this field name)
    const phoneNumber = profile.contactPhone || profile.phone;

    if (!phoneNumber) {
      alert("Phone number not available for this profile");
      return;
    }

    // Clean the phone number (remove any non-digit characters except +)
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, "");

    // Create SMS URL
    const smsUrl = `sms:${cleanPhoneNumber}`;

    // Open messaging app
    window.location.href = smsUrl;
  };
  return (
    <div className="bg-black/30 rounded-2xl border border-pink-500/20 p-6 sticky top-24">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div className="relative inline-block mb-4">
          <img
            src={profile.photos?.[0]?.url || "/default-avatar.jpg"}
            alt={profile.displayName}
            className="w-32 h-32 rounded-full object-cover border-4 border-pink-500/30 mx-auto"
          />
          {profile.verified && (
            <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {profile.displayName}
        </h1>
        <div className="mb-3">
          <p className="text-pink-200 text-sm leading-relaxed break-words">
            {displayText}
            {needsTruncation && !isExpanded && "..."}
          </p>
          {needsTruncation && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-pink-400 hover:text-pink-300 text-xs font-medium mt-1 transition duration-200"
            >
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>{" "}
        <div className="flex items-center justify-center space-x-4 text-pink-200 mb-4">
          <span>📍 {profile.location}</span>
          <span>👤 {profile.age}</span>
        </div>
        <div className="flex justify-center space-x-2 mb-4">
          <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm">
            {profile.gender}
          </span>
          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
            {profile.ethnicity}
          </span>
          {profile.isAd && (
            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">
              🔥 Promoted
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-black/20 rounded-lg">
          <div className="text-white font-bold text-lg">
            {profile.views || 0}
          </div>
          <div className="text-pink-200 text-sm">Profile Views</div>
        </div>
        <div className="text-center p-3 bg-black/20 rounded-lg">
          <div className="text-white font-bold text-lg">
            {profile.photos?.length || 0}
          </div>
          <div className="text-pink-200 text-sm">Photos</div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold mb-3">Contact & Pricing</h3>

        {profile.incallPrice && (
          <div className="flex justify-between items-center p-2">
            <span className="text-pink-200">Incall:</span>
            <span className="text-green-400 font-semibold">
              ${profile.incallPrice}
            </span>
          </div>
        )}

        {profile.outcallPrice && (
          <div className="flex justify-between items-center p-2">
            <span className="text-pink-200">Outcall:</span>
            <span className="text-green-400 font-semibold">
              ${profile.outcallPrice}
            </span>
          </div>
        )}

        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-blue-500/20 text-blue-300 py-2 rounded-lg hover:bg-blue-500/30 transition duration-300"
          >
            Visit Website
          </a>
        )}

        <button
          onClick={handleSendMessage}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition duration-300 mt-4"
        >
          💌 Send Message
        </button>
      </div>
    </div>
  );
}

// Photo Gallery Component
function PhotoGallery({ profile, onImageSelect }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">Photo Gallery</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {profile.photos?.map((photo, index) => (
          <div
            key={index}
            onClick={() => onImageSelect(photo)}
            className="relative group cursor-pointer transform hover:scale-105 transition duration-300"
          >
            <img
              src={photo.url}
              alt={`${profile.displayName} photo ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3-3H7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// About Section Component
function AboutSection({ profile }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">About Me</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-pink-300">
            Basic Information
          </h4>
          <InfoRow label="Display Name" value={profile.displayName} />
          <InfoRow label="Age" value={profile.age} />
          <InfoRow label="Gender" value={profile.gender} />
          <InfoRow label="Ethnicity" value={profile.ethnicity} />
          <InfoRow label="Body Type" value={profile.bodyType} />
          <InfoRow
            label="Height"
            value={profile.height ? `${profile.height} cm` : ""}
          />
          <InfoRow label="Hair Color" value={profile.hairColor} />
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-pink-300">Details</h4>
          <InfoRow label="Caters To" value={profile.catersTo} />
          <InfoRow label="Languages" value={profile.languages?.join(", ")} />
          <InfoRow label="Location" value={profile.location} />

          {profile.website && (
            <div>
              <span className="text-pink-200 font-medium">Website:</span>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-400 ml-2"
              >
                {profile.website}
              </a>
            </div>
          )}

          {/* Bio Section */}
          {profile.bio && (
            <div>
              <h4 className="text-lg font-semibold text-pink-300 mb-2">Bio</h4>
              <p className="text-pink-100 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Services Section Component
function ServicesSection({ profile }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6">Services & Rates</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing */}
        <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
          <h4 className="text-lg font-semibold text-pink-300 mb-4">Pricing</h4>
          <div className="space-y-3">
            {profile.incallPrice && (
              <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                <span className="text-pink-200">Incall Service</span>
                <span className="text-green-400 font-bold text-lg">
                  ${profile.incallPrice}
                </span>
              </div>
            )}
            {profile.outcallPrice && (
              <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                <span className="text-pink-200">Outcall Service</span>
                <span className="text-green-400 font-bold text-lg">
                  ${profile.outcallPrice}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
          <h4 className="text-lg font-semibold text-pink-300 mb-4">
            Service Information
          </h4>
          <div className="space-y-3">
            <InfoRow label="Caters To" value={profile.catersTo} />
            <InfoRow label="Response Time" value="Within 1 hour" />
            <InfoRow label="Availability" value="Flexible schedule" />

            {/* Service Tags */}
            <div>
              <span className="text-pink-200 font-medium">
                Services Offered:
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.incallPrice && (
                  <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm">
                    Incall
                  </span>
                )}
                {profile.outcallPrice && (
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                    Outcall
                  </span>
                )}
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                  Professional
                </span>
                <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Availability Section Component
function AvailabilitySection({ profile }) {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const handleSendMessage = () => {
    // Get the phone number from profile (you might need to adjust this field name)
    const phoneNumber = profile.contactPhone || profile.phone;

    if (!phoneNumber) {
      alert("Phone number not available for this profile");
      return;
    }

    // Clean the phone number (remove any non-digit characters except +)
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, "");

    // Create SMS URL
    const smsUrl = `sms:${cleanPhoneNumber}`;

    // Open messaging app
    window.location.href = smsUrl;
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6">Availability</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Schedule */}
        <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
          <h4 className="text-lg font-semibold text-pink-300 mb-4">
            Weekly Schedule
          </h4>
          <div className="space-y-3">
            {days.map((day) => {
              const availability = profile.availability?.[day];
              return (
                <div
                  key={day}
                  className="flex justify-between items-center p-3 bg-black/30 rounded-lg"
                >
                  <span className="text-pink-200 capitalize">{day}</span>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        availability?.available
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {availability?.available
                        ? availability.hours || "Available"
                        : "Not Available"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Information */}
        <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
          <h4 className="text-lg font-semibold text-pink-300 mb-4">
            Booking Information
          </h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-pink-200 font-medium mb-2">
                📞 Contact Methods
              </h5>
              <div className="space-y-2">
                <button
                  onClick={handleSendMessage}
                  className="w-full bg-green-500/20 text-green-300 py-2 rounded-lg hover:bg-green-500/30 transition duration-300"
                >
                  Send Message
                </button>
                <button
                  onClick={handleSendMessage}
                  className="w-full bg-blue-500/20 text-blue-300 py-2 rounded-lg hover:bg-blue-500/30 transition duration-300"
                >
                  Request Booking
                </button>
              </div>
            </div>

            <div>
              <h5 className="text-pink-200 font-medium mb-2">
                ℹ️ Important Notes
              </h5>
              <ul className="text-pink-100 text-sm space-y-1">
                <li>• 24-hour advance booking recommended</li>
                <li>• Discretion guaranteed</li>
                <li>• Professional service only</li>
                <li>• Verification required for first-time clients</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Modal Component
function ImageModal({ image, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-pink-300 transition duration-300"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <img
          src={image.url}
          alt="Enlarged view"
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
}

// Reusable Info Row Component
function InfoRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="flex justify-between items-center py-2 border-b border-pink-500/10">
      <span className="text-pink-200 font-medium">{label}:</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
