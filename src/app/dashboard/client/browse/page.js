import Link from "next/link";

// src/app/dashboard/client/browse/page.js
export default function BrowsePage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          🔍 Browse Providers
        </h1>
        <div className="bg-black/20 rounded-2xl p-8 border border-pink-500/20 text-center">
          <Link
            href="/discover"
            className="group border-2 border-pink-500/50 text-pink-300 px-8 py-4 rounded-xl font-semibold hover:bg-pink-500/10 hover:border-pink-400 transition-all duration-300 transform hover:scale-105 hover:text-white"
          >
            Explore All Profiles
          </Link>{" "}
        </div>
      </div>
    </div>
  );
}
