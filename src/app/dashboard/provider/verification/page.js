// src/app/dashboard/provider/verification/page.js
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { uploadToImgBB, optimizeImage } from "@/lib/imgbb";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function VerificationPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [verificationDoc, setVerificationDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");
    setVerificationDoc({
      file: file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  const removeDoc = () => {
    if (verificationDoc?.preview) {
      URL.revokeObjectURL(verificationDoc.preview);
    }
    setVerificationDoc(null);
    setError("");
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (!verificationDoc) {
      setError("Please upload a verification document");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Upload document to ImgBB
      let docUrl = "";
      if (verificationDoc.file.type.startsWith("image/")) {
        const optimizedFile = await optimizeImage(verificationDoc.file);
        const result = await uploadToImgBB(optimizedFile);
        if (!result.success) throw new Error(result.error);
        docUrl = result.url;
      } else {
        // For PDFs, you might want to use a different service
        // For now, we'll handle it the same way
        const result = await uploadToImgBB(verificationDoc.file);
        if (!result.success) throw new Error(result.error);
        docUrl = result.url;
      }

      // Update user document
      await updateDoc(doc(db, "users", user.uid), {
        vDoc: true,
        verificationDoc: {
          url: docUrl,
          type: verificationDoc.type,
          name: verificationDoc.name,
          uploadedAt: new Date().toISOString(),
          verified: false, // Admin will set this to true
        },
        lastUpdated: new Date(),
      });

      // Redirect to pending verification page
      router.push("/dashboard/provider/pending-verification");
    } catch (error) {
      console.error("Verification upload error:", error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please Log In
          </h2>
          <p className="text-gray-600">
            You need to be logged in to access verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Identity Verification Required
            </h1>
            <p className="text-gray-600">
              To ensure the safety of our community, we require all providers to
              verify their identity.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              📋 Required Documents
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>
                • Government-issued ID (Drivers license, Passport, National ID)
              </li>
              <li>• Must be clear and readable</li>
              <li>• File size: Maximum 5MB</li>
              <li>• Formats: JPEG, PNG, or PDF</li>
            </ul>
          </div>

          <form onSubmit={submitVerification} className="space-y-6">
            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Verification Document
              </label>

              {!verificationDoc ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition duration-200 ${
                    uploading
                      ? "border-gray-300 cursor-not-allowed"
                      : "border-blue-300 hover:border-blue-400 cursor-pointer"
                  }`}
                >
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleDocUpload}
                    className="hidden"
                    id="doc-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="doc-upload"
                    className={`block ${
                      uploading ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <div className="text-3xl mb-3">📄</div>
                    <div className="font-semibold text-blue-600 mb-1">
                      Click to upload document
                    </div>
                    <div className="text-gray-500 text-sm">
                      JPEG, PNG, or PDF (Max 5MB)
                    </div>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {verificationDoc.type.startsWith("image/")
                          ? "🖼️"
                          : "📄"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {verificationDoc.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {(verificationDoc.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeDoc}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                      disabled={uploading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1"
              />
              <label className="text-sm text-gray-600">
                I confirm that the document I am uploading is a valid
                government-issued ID and that I am the person depicted in the
                document. I understand that this information will be used solely
                for verification purposes and will be handled securely.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!verificationDoc || uploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                "Submit for Verification"
              )}
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>
                Verification typically takes 24-48 hours. You will be notified
                once approved.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
