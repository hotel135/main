// src/app/dashboard/provider/ads/page.js
'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAds } from '@/context/AdsContext';
import { useSimpleWallet } from '@/context/SimpleWalletContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdsPage() {
  const { userData } = useAuth();
  const { ads, loading, boostAd, pauseAd, resumeAd, deleteAd } = useAds();
  const { balance } = useSimpleWallet();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(null);

  const handleBoost = async (adId) => {
    setActionLoading(adId);
    try {
      if (balance < 3) {
        alert('Insufficient balance. Please add funds to your wallet.');
        return;
      }
      
      await boostAd(adId);
      alert('Ad boosted successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseResume = async (ad) => {
    setActionLoading(ad.id);
    try {
      if (ad.status === 'active') {
        await pauseAd(ad.id);
      } else {
        await resumeAd(ad.id);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (adId) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      setActionLoading(adId);
      try {
        await deleteAd(adId);
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getAdStatus = (ad) => {
    if (ad.status !== 'active') return ad.status;
    
    const boostUntil = ad.boostUntil?.toDate();
    const now = new Date();
    
    if (boostUntil && boostUntil > now) {
      const daysLeft = Math.ceil((boostUntil - now) / (1000 * 60 * 60 * 24));
      return `active (${daysLeft}d left)`;
    }
    
    return 'expired';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Ads</h1>
            <p className="text-gray-600">Manage and boost your advertisements</p>
          </div>
          <Link
            href="/dashboard/provider/ads/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
          >
            + Create New Ad ($3)
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{ads.length}</div>
            <div className="text-gray-600">Total Ads</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {ads.filter(ad => ad.status === 'active').length}
            </div>
            <div className="text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {ads.reduce((sum, ad) => sum + (ad.views || 0), 0)}
            </div>
            <div className="text-gray-600">Total Views</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}
            </div>
            <div className="text-gray-600">Total Clicks</div>
          </div>
        </div>

        {/* Ads List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {ads.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ads yet</h3>
              <p className="text-gray-600 mb-4">Create your first ad to get started</p>
              <Link
                href="/dashboard/provider/ads/create"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Your First Ad
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ads.map((ad) => (
                <div key={ad.id} className="p-6 hover:bg-gray-50 transition duration-200">
                  <div className="flex items-start space-x-4">
                    <img
                      src={ad.selectedPhoto}
                      alt="Ad"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {ad.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ad.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : ad.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getAdStatus(ad)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {ad.bio}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 {ad.location}</span>
                        <span>👁️ {ad.views || 0} views</span>
                        <span>👆 {ad.clicks || 0} clicks</span>
                        <span>💰 ${ad.amountPaid}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBoost(ad.id)}
                        disabled={actionLoading === ad.id || balance < 3}
                        className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50 transition duration-200"
                      >
                        {actionLoading === ad.id ? '...' : 'Boost ($3)'}
                      </button>
                      
                      <button
                        onClick={() => handlePauseResume(ad)}
                        disabled={actionLoading === ad.id}
                        className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition duration-200"
                      >
                        {actionLoading === ad.id ? '...' : ad.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={actionLoading === ad.id}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}