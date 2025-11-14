// src/app/dashboard/provider/ads/create/page.js
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAds } from "@/context/AdsContext";
import { useSimpleWallet } from "@/context/SimpleWalletContext";
import LocationSearch from "@/components/ui/LocationSearch";
import { useRouter } from "next/navigation";

export default function CreateAdPage() {
  const { user, userData } = useAuth();
  const { balance } = useSimpleWallet();
  const { createAd, loading } = useAds();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    bio: "",
    selectedPhoto: "",
    contactPhone: "",
    instagram: "",
    twitter: "",
    location: "",
    age: "",
    services: [],
    priceRange: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        title: userData.displayName || "",
        location: userData.location || "",
        age: userData.age || "",
        contactPhone: userData.phone || "",
        services:
          userData.incallPrice && userData.outcallPrice
            ? ["incall", "outcall"]
            : [],
      }));
    }
  }, [userData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleServiceToggle = (service) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handlePhotoSelect = (photoUrl) => {
    setFormData((prev) => ({ ...prev, selectedPhoto: photoUrl }));
    if (errors.selectedPhoto) {
      setErrors((prev) => ({ ...prev, selectedPhoto: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title?.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.bio?.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length < 50) {
      newErrors.bio = "Bio should be at least 50 characters long";
    }

    if (!formData.selectedPhoto) {
      newErrors.selectedPhoto = "Please select a main photo";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.priceRange?.trim()) {
      newErrors.priceRange = "Price range is required";
    }

    // Optional fields format validation
    if (formData.instagram && !formData.instagram.startsWith("@")) {
      newErrors.instagram = "Instagram handle should start with @";
    }

    if (formData.twitter && !formData.twitter.startsWith("@")) {
      newErrors.twitter = "Twitter handle should start with @";
    }

    if (
      formData.contactPhone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(
        formData.contactPhone.replace(/[\s\-\(\)]/g, "")
      )
    ) {
      newErrors.contactPhone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      // Validate form
      if (!validateForm()) {
        throw new Error("Please fix the errors below");
      }

      if (balance < 3) {
        throw new Error(
          "Insufficient balance. Please add funds to your wallet."
        );
      }

      // Create ad
      const result = await createAd(formData);

      if (result.success) {
        router.push("/dashboard/provider/ads?created=true");
      }
    } catch (error) {
      if (error.message !== "Please fix the errors below") {
        setErrors({ submit: error.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!userData?.photos || userData.photos.length === 0) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
            <div className="text-4xl mb-4">📸</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Photos Required
            </h1>
            <p className="text-gray-600 mb-6">
              You need to upload photos before creating ads.
            </p>
            <button
              onClick={() => router.push("/dashboard/provider/upload-photos")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Upload Photos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ad Creation Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create New Ad
              </h1>
              <p className="text-gray-600 mb-6">
                $3 will be deducted from your wallet
              </p>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 text-black">
                {/* Photo Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Main Photo *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {userData.photos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => handlePhotoSelect(photo.url)}
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition duration-200 ${
                          formData.selectedPhoto === photo.url
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {errors.selectedPhoto && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.selectedPhoto}
                    </p>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your display name"
                      required
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      placeholder="e.g., 25-30"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <LocationSearch
                    value={formData.location}
                    onChange={(value) => handleInputChange("location", value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                      errors.location
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your city"
                  />
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.location}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio/Description *
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      ({formData.bio.length}/50 characters minimum)
                    </span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                      errors.bio
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Describe your services, personality, and what clients can expect. Minimum 50 characters."
                  />
                  {errors.bio && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.bio}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        handleInputChange("contactPhone", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.contactPhone
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="+1 234 567 8900"
                    />
                    {errors.contactPhone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.contactPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range *
                    </label>
                    <input
                      type="text"
                      value={formData.priceRange}
                      onChange={(e) =>
                        handleInputChange("priceRange", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.priceRange
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., $100-$200"
                      required
                    />
                    {errors.priceRange && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.priceRange}
                      </p>
                    )}
                  </div>
                </div>

                {/* Social Media */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                      <span className="text-gray-500 text-sm font-normal ml-2">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) =>
                        handleInputChange("instagram", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.instagram
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="@username"
                    />
                    {errors.instagram && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.instagram}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                      <span className="text-gray-500 text-sm font-normal ml-2">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) =>
                        handleInputChange("twitter", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.twitter
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="@username"
                    />
                    {errors.twitter && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.twitter}
                      </p>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Services Offered
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      (Optional)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {["incall", "outcall", "video", "other"].map((service) => (
                      <label
                        key={service}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {service}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || balance < 3}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Ad...
                      </>
                    ) : (
                      `Create Ad - $3.00`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Ad Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ad Preview
              </h3>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Ad Card Preview */}
                <div className="bg-white">
                  {formData.selectedPhoto ? (
                    <img
                      src={formData.selectedPhoto}
                      alt="Ad preview"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Select a photo</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {formData.title || "Your Name"}
                      </h4>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {formData.age || "Age"}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      {formData.location || "Location"}
                    </p>

                    <p className="text-gray-700 text-sm line-clamp-2">
                      {formData.bio || "Bio will appear here..."}
                    </p>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <span className="text-green-600 font-semibold">
                        {formData.priceRange || "Price"}
                      </span>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Balance:</span>
                  <span
                    className={`font-semibold ${
                      balance < 3 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ${balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Ad Cost:</span>
                  <span className="font-semibold">$3.00</span>
                </div>
                {balance < 3 && (
                  <p className="text-red-600 text-xs mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    Insufficient balance. Please add funds.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
