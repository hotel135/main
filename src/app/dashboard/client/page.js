// src/app/dashboard/client/page.js
"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ClientDashboard() {
  const { userData } = useAuth();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-black/20 rounded-2xl p-8 border border-pink-500/20 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back , {userData?.displayName || "Client"}! 👋
          </h1>
          <p className="text-pink-200">
            Ready to find your perfect match? Browse verified providers in your
            area.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
            <div className="text-2xl font-bold text-pink-400 mb-2">0</div>
            <div className="text-pink-200">Saved Profiles</div>
          </div>
          <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
            <div className="text-2xl font-bold text-pink-400 mb-2">0</div>
            <div className="text-pink-200">Messages</div>
          </div>
          <div className="bg-black/20 rounded-xl p-6 border border-pink-500/20">
            <div className="text-2xl font-bold text-pink-400 mb-2">0</div>
            <div className="text-pink-200">Views Today</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl p-6 border border-pink-500/30">
            <h3 className="text-xl font-semibold text-white mb-3">
              🔍 Browse Providers
            </h3>
            <p className="text-pink-200 mb-4">
              Discover verified professionals in your area
            </p>
            <Link
              href="/discover"
              className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition duration-200"
            >
              Start Browsing
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-semibold text-white mb-3">
              ❤️ Saved Profiles
            </h3>
            <p className="text-purple-200 mb-4">View your favorite providers</p>
            <button className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition duration-200">
              View Saved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
