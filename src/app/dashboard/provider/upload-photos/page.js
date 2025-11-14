// src/app/dashboard/provider/upload-photos/page.js
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { uploadToImgBB, optimizeImage } from "@/lib/imgbb";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UploadPhotos() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length + photos.length > 5) {
      setError("Maximum 5 photos allowed");
      return;
    }

    // Validate files
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

    // Add photos with previews
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
    URL.revokeObjectURL(photo.preview);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (photos.length < 3) {
      setError("Minimum 3 photos required");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedPhotos = [];

      // Upload each photo to ImgBB
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        setUploadProgress((prev) => ({ ...prev, [i]: "uploading" }));

        console.log(`Uploading photo ${i + 1}...`);

        // Optimize and upload
        const optimizedFile = await optimizeImage(photo.file);
        const result = await uploadToImgBB(optimizedFile);

        if (result.success) {
          console.log(`Photo ${i + 1} uploaded successfully:`, result.url);
          uploadedPhotos.push({
            url: result.url,
            display_url: result.display_url,
            storage: "imgbb",
            size: result.size,
            width: result.width,
            height: result.height,
            uploadedAt: new Date().toISOString(),
            order: i,
          });
          setUploadProgress((prev) => ({ ...prev, [i]: "completed" }));
        } else {
          throw new Error(`Failed to upload ${photo.name}: ${result.error}`);
        }
      }

      // Update user document in Firebase
      console.log("Updating user document with photo data...");
      await updateDoc(doc(db, "users", user.uid), {
        photos: uploadedPhotos,
        profileComplete: true,
        profileActive: true,
        lastUpdated: new Date(),
      });

      console.log("Profile activated successfully!");

      // Redirect to dashboard
      router.push("/dashboard/provider");
    } catch (error) {
      console.error("Upload error:", error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "uploading":
        return "⏳";
      case "completed":
        return "✅";
      default:
        return "📷";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 rounded-2xl p-8 border border-pink-500/20">
          <h1 className="text-3xl font-bold text-white mb-2">
            📸 Upload Your Photos
          </h1>
          <p className="text-pink-200 mb-6">
            Upload 3-5 high-quality photos (Max 5MB per photo)
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload Area */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition duration-200 ${
                photos.length >= 5
                  ? "border-gray-500/30 cursor-not-allowed"
                  : "border-pink-500/30 hover:border-pink-500/50 cursor-pointer"
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={photos.length >= 5 || uploading}
              />
              <label
                htmlFor="photo-upload"
                className={`block ${
                  photos.length >= 5 ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div className="text-4xl mb-4">🖼️</div>
                <div className="text-lg font-semibold text-pink-300 mb-2">
                  {photos.length >= 5
                    ? "Maximum photos reached"
                    : "Click to upload photos"}
                </div>
                <div className="text-sm text-pink-200/70">
                  PNG, JPG, JPEG up to 5MB each ({photos.length}/5 photos)
                </div>
              </label>
            </div>

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Selected Photos ({photos.length}/5)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group bg-black/30 rounded-lg p-2"
                    >
                      <div className="relative">
                        <img
                          src={photo.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                            {getStatusIcon(uploadProgress[index])}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                            disabled={uploading}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-pink-200">
                        <div className="truncate">{photo.name}</div>
                        <div>{formatFileSize(photo.size)}</div>
                        {uploadProgress[index] === "uploading" && (
                          <div className="text-yellow-400">Uploading...</div>
                        )}
                        {uploadProgress[index] === "completed" && (
                          <div className="text-green-400">✅ Uploaded</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              type="submit"
              disabled={photos.length < 3 || uploading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading... (
                  {
                    Object.values(uploadProgress).filter(
                      (p) => p === "uploading"
                    ).length
                  }{" "}
                  remaining)
                </>
              ) : (
                `Upload ${photos.length} Photos & Activate Profile`
              )}
            </button>

            {/* Free Service Notice */}
            {/* <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="text-sm text-blue-200/80 space-y-1">
                <p>✅ Completely free - no costs involved</p>
                <p>✅ No CORS issues - works seamlessly</p>
                <p>✅ Fast image delivery</p>
                <p>✅ Perfect for development and testing</p>
              </div>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
