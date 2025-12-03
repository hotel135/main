// src/app/admin/featured-ads/page.js - UPDATED
"use client";
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FeaturedAdsAdmin() {
  const [allAds, setAllAds] = useState([]);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const isAuth = localStorage.getItem("admin-authenticated");
    if (isAuth === "true") {
      setAuthenticated(true);
      loadAds();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin135") {
      setAuthenticated(true);
      setPasswordError("");
      localStorage.setItem("admin-authenticated", "true");
      loadAds();
    } else {
      setPasswordError("Invalid password");
    }
  };

  const loadAds = async () => {
    try {
      setLoading(true);

      // Load all active ads
      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        orderBy("lastPaymentDate", "desc")
      );

      const adsSnapshot = await getDocs(adsQuery);
      const adsData = adsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isFeatured: doc.data().isFeatured || false,
        featuredOrder: doc.data().featuredOrder || 999,
      }));

      setAllAds(adsData);

      // Separate featured ads and sort by order
      const featured = adsData
        .filter((ad) => ad.isFeatured)
        .sort((a, b) => (a.featuredOrder || 999) - (b.featuredOrder || 999));

      setFeaturedAds(featured);
    } catch (error) {
      console.error("Error loading ads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add ad to featured with ranking
  const addToFeatured = async (adId) => {
    try {
      setSaving(true);

      const nextOrder =
        featuredAds.length > 0
          ? Math.max(...featuredAds.map((ad) => ad.featuredOrder)) + 1
          : 1;

      const adRef = doc(db, "ads", adId);
      await updateDoc(adRef, {
        isFeatured: true,
        featuredOrder: nextOrder,
        lastUpdated: new Date(),
      });

      // Update local state
      const adToAdd = allAds.find((ad) => ad.id === adId);
      if (adToAdd) {
        const updatedAd = {
          ...adToAdd,
          isFeatured: true,
          featuredOrder: nextOrder,
        };
        setFeaturedAds((prev) =>
          [...prev, updatedAd].sort((a, b) => a.featuredOrder - b.featuredOrder)
        );
        setAllAds((prev) =>
          prev.map((ad) => (ad.id === adId ? updatedAd : ad))
        );
      }
    } catch (error) {
      console.error("Error adding to featured:", error);
      alert("Error adding ad to featured");
    } finally {
      setSaving(false);
    }
  };

  // Remove ad from featured
  const removeFromFeatured = async (adId) => {
    try {
      setSaving(true);

      const adRef = doc(db, "ads", adId);
      await updateDoc(adRef, {
        isFeatured: false,
        featuredOrder: 999, // Reset order
        lastUpdated: new Date(),
      });

      // Update local state
      setFeaturedAds((prev) => prev.filter((ad) => ad.id !== adId));
      setAllAds((prev) =>
        prev.map((ad) =>
          ad.id === adId ? { ...ad, isFeatured: false, featuredOrder: 999 } : ad
        )
      );
    } catch (error) {
      console.error("Error removing from featured:", error);
      alert("Error removing ad from featured");
    } finally {
      setSaving(false);
    }
  };

  // Reorder featured ads
  const reorderFeatured = async (adId, newOrder) => {
    try {
      setSaving(true);

      const adRef = doc(db, "ads", adId);
      await updateDoc(adRef, {
        featuredOrder: newOrder,
        lastUpdated: new Date(),
      });

      // Update local state
      setFeaturedAds((prev) =>
        prev
          .map((ad) =>
            ad.id === adId ? { ...ad, featuredOrder: newOrder } : ad
          )
          .sort((a, b) => a.featuredOrder - b.featuredOrder)
      );

      setAllAds((prev) =>
        prev.map((ad) =>
          ad.id === adId ? { ...ad, featuredOrder: newOrder } : ad
        )
      );
    } catch (error) {
      console.error("Error reordering featured:", error);
      alert("Error reordering ad");
    } finally {
      setSaving(false);
    }
  };

  // Move ad up in order
  const moveUp = (adId) => {
    const ad = featuredAds.find((a) => a.id === adId);
    if (!ad || ad.featuredOrder <= 1) return;

    const adToSwap = featuredAds.find(
      (a) => a.featuredOrder === ad.featuredOrder - 1
    );
    if (adToSwap) {
      reorderFeatured(adToSwap.id, ad.featuredOrder);
    }
    reorderFeatured(adId, ad.featuredOrder - 1);
  };

  // Move ad down in order
  const moveDown = (adId) => {
    const ad = featuredAds.find((a) => a.id === adId);
    if (!ad || ad.featuredOrder >= featuredAds.length) return;

    const adToSwap = featuredAds.find(
      (a) => a.featuredOrder === ad.featuredOrder + 1
    );
    if (adToSwap) {
      reorderFeatured(adToSwap.id, ad.featuredOrder);
    }
    reorderFeatured(adId, ad.featuredOrder + 1);
  };

  // Filter ads based on search
  const filteredAds = allAds.filter((ad) => {
    const matchesSearch =
      ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.userId?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Password protection (same as before)
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Admin Access Required
            </h1>
            <p className="text-gray-400">
              Enter the admin password to access featured ads management
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                required
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 transition duration-200"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Manual Featured Ads Management
            </h1>
            <p className="text-gray-300">
              Manually select and rank ads for Featured Profiles section
            </p>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false);
              localStorage.removeItem("admin-authenticated");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Ads</p>
            <p className="text-2xl font-bold text-white">{allAds.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Featured Ads</p>
            <p className="text-2xl font-bold text-yellow-400">
              {featuredAds.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Manual Selection</p>
            <p className="text-2xl font-bold text-green-400">Active</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Ads
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, location, or user ID..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSearchTerm("")}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-200"
              >
                Clear Search
              </button>
            </div>
          </div>
        </div>

        {/* Featured Ads Section with Ranking */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              Currently Featured Ads ({featuredAds.length})
            </h2>
            <p className="text-gray-400 text-sm">
              Drag handles or use arrows to reorder
            </p>
          </div>

          {featuredAds.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No ads are currently featured. Search and add ads below.
            </p>
          ) : (
            <div className="space-y-3">
              {featuredAds.map((ad, index) => (
                <FeaturedAdCard
                  key={ad.id}
                  ad={ad}
                  index={index}
                  total={featuredAds.length}
                  onRemove={removeFromFeatured}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>

        {/* All Ads Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              All Active Ads ({filteredAds.length})
            </h2>
            <p className="text-gray-400 text-sm">
              Click &quot;Add to Featured&quot; to manually select ads
            </p>
          </div>

          {filteredAds.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No ads found matching your search criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAds
                .filter((ad) => !ad.isFeatured) // Only show non-featured ads
                .map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    onAddToFeatured={addToFeatured}
                    saving={saving}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Featured Ad Card with Ranking Controls
function FeaturedAdCard({
  ad,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  saving,
}) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 border-2 border-yellow-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => onMoveUp(ad.id)}
              disabled={saving || index === 0}
              className="bg-gray-600 text-white p-1 rounded hover:bg-gray-500 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => onMoveDown(ad.id)}
              disabled={saving || index === total - 1}
              className="bg-gray-600 text-white p-1 rounded hover:bg-gray-500 disabled:opacity-30"
            >
              ↓
            </button>
          </div>
          <div className="bg-yellow-500 text-white px-2 py-1 rounded text-sm font-bold">
            #{index + 1}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
            FEATURED
          </span>
          <button
            onClick={() => onRemove(ad.id)}
            disabled={saving}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-white text-lg">{ad.title}</h3>
        <p className="text-gray-300 text-sm">
          <span className="font-medium">Location:</span>{" "}
          {ad.location || "Not specified"}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="font-medium">User ID:</span> {ad.userId}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="font-medium">Order:</span> {ad.featuredOrder}
        </p>
      </div>
    </div>
  );
}

// Regular Ad Card
function AdCard({ ad, onAddToFeatured, saving }) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-white text-lg">{ad.title}</h3>
        <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
          AVAILABLE
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-300 text-sm">
          <span className="font-medium">Location:</span>{" "}
          {ad.location || "Not specified"}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="font-medium">User ID:</span> {ad.userId}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="font-medium">Price:</span>{" "}
          {ad.priceRange || "Not specified"}
        </p>
      </div>

      <button
        onClick={() => onAddToFeatured(ad.id)}
        disabled={saving}
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition duration-200"
      >
        {saving ? "Adding..." : "Add to Featured"}
      </button>
    </div>
  );
}
