// src/app/dashboard/provider/profile/page.js
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { uploadToImgBB, optimizeImage } from "@/lib/imgbb";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Image from "next/image";

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("edit"); // 'edit' or 'view'

  // Form state
  // In the form state initialization, add phone and bio:
  const [formData, setFormData] = useState({
    displayName: "",
    age: "",
    gender: "",
    ethnicity: "",
    height: "",
    bodyType: "",
    hairColor: "",
    location: "",
    website: "",
    incallPrice: "",
    outcallPrice: "",
    catersTo: "both",
    languages: [],
    phone: "", // Add phone
    bio: "", // Add bio
    availability: {
      monday: { available: true, hours: "9:00 AM - 6:00 PM" },
      tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
      wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
      thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
      friday: { available: true, hours: "9:00 AM - 6:00 PM" },
      saturday: { available: false, hours: "" },
      sunday: { available: false, hours: "" },
    },
  });

  // Photo upload state
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Load user data
  // In the useEffect that loads user data:
  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || "",
        age: userData.age || "",
        gender: userData.gender || "",
        ethnicity: userData.ethnicity || "",
        height: userData.height || "",
        bodyType: userData.bodyType || "",
        hairColor: userData.hairColor || "",
        location: userData.location || "",
        website: userData.website || "",
        incallPrice: userData.incallPrice || "",
        outcallPrice: userData.outcallPrice || "",
        catersTo: userData.catersTo || "both",
        languages: userData.languages || [],
        phone: userData.phone || userData.contactPhone || "", // Load phone
        bio: userData.bio || "", // Load bio
        availability: userData.availability || {
          monday: { available: true, hours: "9:00 AM - 6:00 PM" },
          tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
          wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
          thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
          friday: { available: true, hours: "9:00 AM - 6:00 PM" },
          saturday: { available: false, hours: "" },
          sunday: { available: false, hours: "" },
        },
      });

      setPhotos(userData.photos || []);
      setLoading(false);
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: field === "available" ? value === "true" : value,
        },
      },
    }));
  };

  const handleLanguageChange = (e) => {
    const options = e.target.options;
    const selectedLanguages = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedLanguages.push(options[i].value);
      }
    }
    setFormData((prev) => ({
      ...prev,
      languages: selectedLanguages,
    }));
  };

  // Photo upload functions
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length + photos.length > 5) {
      setError("Maximum 5 photos allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      return isImage && isUnder5MB;
    });

    if (validFiles.length === 0) {
      setError("Please select valid image files (PNG, JPG, JPEG up to 5MB)");
      return;
    }

    setError("");

    const newPhotos = validFiles.slice(0, 5 - photos.length).map((file) => ({
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      status: "pending",
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    const photo = photos[index];
    if (photo.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const uploadNewPhotos = async () => {
    const newPhotosToUpload = photos.filter((photo) => photo.file);

    if (newPhotosToUpload.length === 0) return photos;

    setUploadingPhotos(true);
    setError("");

    try {
      const uploadedPhotos = [];
      const existingPhotos = photos.filter((photo) => !photo.file);

      // Upload each new photo
      for (let i = 0; i < newPhotosToUpload.length; i++) {
        const photo = newPhotosToUpload[i];

        setUploadProgress((prev) => ({ ...prev, [i]: "uploading" }));

        const optimizedFile = await optimizeImage(photo.file);
        const result = await uploadToImgBB(optimizedFile);

        if (result.success) {
          uploadedPhotos.push({
            url: result.url,
            display_url: result.display_url,
            storage: "imgbb",
            size: result.size,
            width: result.width,
            height: result.height,
            uploadedAt: new Date().toISOString(),
            order: existingPhotos.length + i,
          });
          setUploadProgress((prev) => ({ ...prev, [i]: "completed" }));
        } else {
          throw new Error(`Failed to upload ${photo.name}: ${result.error}`);
        }
      }

      return [...existingPhotos, ...uploadedPhotos];
    } catch (error) {
      console.error("Photo upload error:", error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Upload new photos first
      let finalPhotos = photos;
      if (photos.some((photo) => photo.file)) {
        finalPhotos = await uploadNewPhotos();
      }

      // Update user document
      await updateDoc(doc(db, "users", user.uid), {
        ...formData,
        photos: finalPhotos,
        lastUpdated: new Date(),
        profileComplete: true,
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Log In</h2>
          <p className="text-pink-200">
            You need to be logged in to access your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                👤 Provider Profile
              </h1>
              <p className="text-gray-600">
                Manage your profile information and photos
              </p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("view")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  activeTab === "view"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                👀 View Profile
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  activeTab === "edit"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {activeTab === "edit" ? (
          /* EDIT PROFILE TAB */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📝 Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Display Name
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Age Range
                      </label>
                      <select
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Age Range</option>
                        <option value="18-25">18-25</option>
                        <option value="26-30">26-30</option>
                        <option value="31-35">31-35</option>
                        <option value="36-40">36-40</option>
                        <option value="41-45">41-45</option>
                        <option value="46-50">46-50</option>
                        <option value="51+">51+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="transgender">Transgender</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Ethnicity
                      </label>
                      <input
                        type="text"
                        name="ethnicity"
                        value={formData.ethnicity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Height (cm)
                      </label>
                      <input
                        type="text"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., 165"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Body Type
                      </label>
                      <select
                        name="bodyType"
                        value={formData.bodyType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Body Type</option>
                        <option value="slim">Slim</option>
                        <option value="athletic">Athletic</option>
                        <option value="average">Average</option>
                        <option value="curvy">Curvy</option>
                        <option value="muscular">Muscular</option>
                        <option value="stocky">Stocky</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Hair Color
                      </label>
                      <input
                        type="text"
                        name="hairColor"
                        value={formData.hairColor}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Caters To
                      </label>
                      <select
                        name="catersTo"
                        value={formData.catersTo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    About Me
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Tell clients about yourself, your personality, and what makes your service special..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      This helps clients get to know you better
                    </p>
                    <span
                      className={`text-xs ${
                        (formData.bio?.length || 0) < 50
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {formData.bio?.length || 0}/50 characters
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your phone number for client contact
                  </p>
                </div>

                {/* Contact & Pricing Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    💼 Contact & Pricing
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., New York, NY"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">
                          Incall Price ($)
                        </label>
                        <input
                          type="number"
                          name="incallPrice"
                          value={formData.incallPrice}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="100"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2 font-medium">
                          Outcall Price ($)
                        </label>
                        <input
                          type="number"
                          name="outcallPrice"
                          value={formData.outcallPrice}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="150"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Languages
                      </label>
                      <select
                        multiple
                        value={formData.languages}
                        onChange={handleLanguageChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Russian">Russian</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Italian">Italian</option>
                      </select>
                      <p className="text-gray-500 text-sm mt-1">
                        Hold Ctrl/Cmd to select multiple languages
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Photos & Availability */}
              <div className="space-y-6">
                {/* Photos Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    📸 Photos ({photos.length}/5)
                  </h2>

                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 ${
                      photos.length >= 5
                        ? "border-gray-300 cursor-not-allowed"
                        : "border-blue-300 hover:border-blue-400 cursor-pointer transition-colors"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={photos.length >= 5 || uploadingPhotos}
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`block ${
                        photos.length >= 5
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="text-4xl mb-3 text-gray-400">🖼️</div>
                      <div className="text-lg font-medium text-gray-700 mb-1">
                        {photos.length >= 5
                          ? "Maximum photos reached"
                          : "Add Photos"}
                      </div>
                      <div className="text-sm text-gray-500">
                        PNG, JPG, JPEG up to 5MB each
                      </div>
                    </label>
                  </div>

                  {/* Photo Preview Grid */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group bg-gray-50 rounded-lg p-2"
                        >
                          <Image
                            src={photo.preview || photo.url}
                            alt={`Preview ${index + 1}`}
                            width={96}
                            height={96}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                              disabled={uploadingPhotos}
                            >
                              ×
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 truncate">
                            {photo.name || `Photo ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Availability Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    🕒 Availability
                  </h2>

                  <div className="space-y-3">
                    {Object.entries(formData.availability).map(
                      ([day, data]) => (
                        <div
                          key={day}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={data.available}
                              onChange={(e) =>
                                handleAvailabilityChange(
                                  day,
                                  "available",
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700 capitalize min-w-[80px] sm:min-w-[100px]">
                              {day}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={data.hours}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                day,
                                "hours",
                                e.target.value
                              )
                            }
                            placeholder="Hours (e.g., 9:00 AM - 6:00 PM)"
                            className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-700 text-sm w-full sm:w-48 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={!data.available}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={saving || uploadingPhotos}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center space-x-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* VIEW PROFILE TAB */
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Sidebar */}
              <div className="lg:col-span-1">
                {/* Profile Photo */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                  <div className="text-center">
                    {photos.length > 0 ? (
                      <Image
                        src={photos[0].url}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                        <span className="text-4xl text-gray-400">👤</span>
                      </div>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formData.displayName}
                    </h2>
                    <p className="text-gray-600">{formData.location}</p>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          userData?.profileActive
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {userData?.profileActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Quick Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Photos:</span>
                      <span className="text-gray-900 font-medium">
                        {photos.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Profile Views:</span>
                      <span className="text-gray-900 font-medium">
                        Coming Soon
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Member Since:</span>
                      <span className="text-gray-900 font-medium">
                        {userData?.createdAt
                          ? new Date(
                              userData.createdAt.toDate()
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ℹ️ Basic Information
                    </h3>
                    <div className="space-y-3">
                      <ProfileField label="Age Range" value={formData.age} />
                      <ProfileField label="Gender" value={formData.gender} />
                      <ProfileField
                        label="Ethnicity"
                        value={formData.ethnicity}
                      />
                      <ProfileField
                        label="Height"
                        value={formData.height ? `${formData.height} cm` : ""}
                      />
                      <ProfileField
                        label="Body Type"
                        value={formData.bodyType}
                      />
                      <ProfileField
                        label="Hair Color"
                        value={formData.hairColor}
                      />
                      <ProfileField
                        label="Caters To"
                        value={formData.catersTo}
                      />
                      <ProfileField label="Phone" value={formData.phone} />
                    </div>
                  </div>

                  {/* Contact & Services */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💼 Services & Contact
                    </h3>
                    <div className="space-y-3">
                      <ProfileField
                        label="Incall Price"
                        value={
                          formData.incallPrice ? `$${formData.incallPrice}` : ""
                        }
                      />
                      <ProfileField
                        label="Outcall Price"
                        value={
                          formData.outcallPrice
                            ? `$${formData.outcallPrice}`
                            : ""
                        }
                      />
                      <ProfileField
                        label="Languages"
                        value={formData.languages?.join(", ")}
                      />
                      <ProfileField
                        label="Website"
                        value={formData.website}
                        isLink
                      />
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="md:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🕒 Availability
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(formData.availability).map(
                        ([day, data]) => (
                          <div
                            key={day}
                            className={`p-3 rounded-lg text-center ${
                              data.available
                                ? "bg-green-50 border border-green-200"
                                : "bg-gray-100 border border-gray-200"
                            }`}
                          >
                            <div className="font-semibold text-gray-900 capitalize">
                              {day.substring(0, 3)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {data.available
                                ? data.hours || "Available"
                                : "Unavailable"}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  {photos.length > 0 && (
                    <div className="md:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📸 Photo Gallery
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((photo, index) => (
                          <Image
                            key={index}
                            src={photo.url}
                            alt={`Gallery ${index + 1}`}
                            width={200}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            onClick={() => window.open(photo.url, "_blank")}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for profile fields
function ProfileField({ label, value, isLink = false }) {
  if (!value) return null;

  return (
    <div>
      <div className="text-gray-600 text-sm">{label}</div>
      <div className="text-gray-900 font-medium">
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
