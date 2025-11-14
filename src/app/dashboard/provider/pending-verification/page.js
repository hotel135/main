// src/app/dashboard/provider/pending-verification/page.js
"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PendingVerificationPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Real-time verification status monitoring
  useEffect(() => {
    if (!user) return;

    // Check initial status
    if (userData) {
      if (userData.verified) {
        router.push("/dashboard/provider");
        return;
      }
      setCheckingStatus(false);
    }

    // Set up real-time listener for verification status changes
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();

          // If admin verifies the user, redirect immediately
          if (userData.verified) {
            console.log("User verified! Redirecting to dashboard...");
            router.push("/dashboard/provider");
          }
        }
      },
      (error) => {
        console.error("Error listening to verification status:", error);
        setCheckingStatus(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, userData, router]);

  // Redirect if user shouldn't be on this page
  useEffect(() => {
    if (!loading && userData) {
      // If user hasn't uploaded vDoc yet, redirect to verification page
      if (!userData.vDoc) {
        router.push("/dashboard/provider/verification");
        return;
      }

      // If user is already verified, redirect to dashboard
      if (userData.verified) {
        router.push("/dashboard/provider");
        return;
      }
    }
  }, [userData, loading, router]);

  // Show loading while checking status
  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Checking Status...
            </h1>
            <p className="text-gray-600">Verifying your account status</p>
          </div>
        </div>
      </div>
    );
  }

  // Additional safety check - if user is verified but still on this page
  if (userData?.verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verified!</h1>
            <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
            <button
              onClick={() => router.push("/dashboard/provider")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user hasn't uploaded vDoc (shouldn't happen due to redirect, but safety check)
  if (!userData?.vDoc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Verification Required
            </h1>
            <p className="text-gray-600 mb-4">
              Please complete identity verification first.
            </p>
            <button
              onClick={() => router.push("/dashboard/provider/verification")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Start Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⏳</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Pending
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for submitting your verification documents. Our team is
            reviewing your information. This process typically takes 24-48
            hours.
          </p>

          {/* Auto-refresh notification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-700 text-sm">
              🔄 <strong>Auto-refresh enabled:</strong> This page will
              automatically update when you are verified
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">
              What happens next?
            </h3>
            <ul className="text-yellow-700 text-sm space-y-1 text-left">
              <li>• Our team reviews your documents</li>
              <li>• You will receive an email notification</li>
              <li>• Full access granted upon approval</li>
              <li>• Page will auto-redirect when verified</li>
            </ul>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Document Submitted:</span>
              <span className="font-medium text-gray-900">
                {userData?.verificationDoc ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Submission Date:</span>
              <span className="font-medium text-gray-900">
                {userData?.verificationDoc?.uploadedAt
                  ? new Date(
                      userData.verificationDoc.uploadedAt
                    ).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-yellow-600">Under Review</span>
            </div>
          </div>

          {/* Manual refresh button */}
          <div className="flex space-x-3 mb-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition duration-200 text-sm font-medium"
            >
              Refresh Page
            </button>
            <button
              onClick={() => router.push("/dashboard/provider")}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
            >
              Check Dashboard
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <Link
                href="/contact-support"
                className="text-blue-600 hover:text-blue-700"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
