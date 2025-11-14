// src/app/dashboard/provider/page.js
"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProviderDashboard() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect based on verification status
  // useEffect(() => {
  //   if (!loading && userData) {
  //     if (!userData.vDoc) {
  //       setIsRedirecting(true);
  //       router.push("/dashboard/provider/verification");
  //     } else if (!userData.verified) {
  //       setIsRedirecting(true);
  //       router.push("/dashboard/provider/pending-verification");
  //     }
  //   }
  // }, [userData, loading, router]);

  // Show loading state
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? "Redirecting..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // If user doesn't have vDoc or isn't verified, show redirect message
  // if (!userData?.vDoc || !userData?.verified) {
  //   return (
  //     <div className="min-h-screen bg-white flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Redirecting to verification...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Check if provider needs to complete profile (upload photos)
  const needsPhotoUpload = !userData?.photos || userData.photos.length < 3;

  if (needsPhotoUpload) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📸</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Complete Your Profile
            </h1>
            <p className="text-blue-600 mb-6">
              Please upload 3-5 photos to activate your profile and start
              receiving clients.
            </p>
            <Link
              href="/dashboard/provider/upload-photos"
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold"
            >
              Upload Photos Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userData?.displayName || "Provider"}! 👋
          </h1>
          <p className="text-gray-600">Here&apos;s your dashboard overview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Earnings
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">This month</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Profile Views
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-blue-600 text-xl">👁️</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Response Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-purple-600 text-xl">⚡</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Average response time
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/provider/ads"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition duration-200 group"
                >
                  <div className="p-3 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition duration-200">
                    <span className="text-blue-600 text-xl">📢</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Ads</h3>
                    <p className="text-sm text-gray-600">
                      Create and edit advertisements
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/provider/profile"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition duration-200 group"
                >
                  <div className="p-3 bg-green-100 rounded-lg mr-4 group-hover:bg-green-200 transition duration-200">
                    <span className="text-green-600 text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Edit Profile
                    </h3>
                    <p className="text-sm text-gray-600">
                      Update your information
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/provider/wallet"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition duration-200 group"
                >
                  <div className="p-3 bg-purple-100 rounded-lg mr-4 group-hover:bg-purple-200 transition duration-200">
                    <span className="text-purple-600 text-xl">💳</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Wallet</h3>
                    <p className="text-sm text-gray-600">Manage your balance</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/provider/profile"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition duration-200 group"
                >
                  <div className="p-3 bg-orange-100 rounded-lg mr-4 group-hover:bg-orange-200 transition duration-200">
                    <span className="text-orange-600 text-xl">📅</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Schedule</h3>
                    <p className="text-sm text-gray-600">Manage availability</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Preview */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center mb-4">
                {userData?.photos?.[0] ? (
                  <img
                    src={userData.photos[0].url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 border-4 border-blue-100">
                    <span className="text-2xl text-gray-500">👤</span>
                  </div>
                )}
                <h3 className="font-semibold text-gray-900">
                  {userData?.displayName}
                </h3>
                <p className="text-sm text-gray-600">{userData?.location}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Verified
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since:</span>
                  <span className="font-medium text-gray-900">
                    {userData?.createdAt
                      ? new Date(
                          userData.createdAt.toDate()
                        ).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response time:</span>
                  <span className="font-medium text-gray-900">-</span>
                </div>
              </div>

              <Link
                href="/dashboard/provider/profile"
                className="block w-full mt-4 text-center bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition duration-200 font-medium text-sm"
              >
                View Full Profile
              </Link>
            </div>

            {/* Photo Gallery Preview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Photo Gallery</h3>
                <Link
                  href="/dashboard/provider/upload-photos"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Manage
                </Link>
              </div>

              {userData?.photos && userData.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {userData.photos.slice(0, 3).map((photo, index) => (
                    <img
                      key={index}
                      src={photo.url}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                  {userData.photos.length > 3 && (
                    <div className="bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        +{userData.photos.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl text-gray-400 mb-2">📸</div>
                  <p className="text-gray-600 text-sm">No photos yet</p>
                </div>
              )}
            </div>

            {/* Verification Status */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <span className="text-green-600">✅</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">
                    Verified Provider
                  </h4>
                  <p className="text-green-700 text-sm">
                    Your account is fully verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
