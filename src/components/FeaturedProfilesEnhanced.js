// src/components/FeaturedProfilesEnhanced.js
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function FeaturedProfilesEnhanced() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [filter, setFilter] = useState('all'); // all, promoted, verified, recent

  useEffect(() => {
    loadProfiles();
  }, [filter]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      let usersQuery;

      switch (filter) {
        case 'promoted':
          // Get profiles with active ads
          const adsQuery = query(collection(db, 'ads'), where('status', '==', 'active'));
          const adsSnapshot = await getDocs(adsQuery);
          const adUserIds = adsSnapshot.docs.map(doc => doc.data().userId);
          
          const promotedProfiles = [];
          for (const userId of adUserIds.slice(0, 20)) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists() && userDoc.data().profileActive) {
              promotedProfiles.push({ id: userDoc.id, ...userDoc.data(), isAd: true });
            }
          }
          setProfiles(promotedProfiles);
          break;

        case 'verified':
          usersQuery = query(
            collection(db, 'users'),
            where('profileActive', '==', true),
            where('verified', '==', true),
            orderBy('lastUpdated', 'desc'),
            limit(20)
          );
          break;

        case 'recent':
          usersQuery = query(
            collection(db, 'users'),
            where('profileActive', '==', true),
            orderBy('lastUpdated', 'desc'),
            limit(20)
          );
          break;

        default: // all
          usersQuery = query(
            collection(db, 'users'),
            where('profileActive', '==', true),
            orderBy('lastUpdated', 'desc'),
            limit(20)
          );
      }

      if (usersQuery) {
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isAd: false
        }));
        setProfiles(usersData);
      }

    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedProfiles = profiles.slice(0, visibleCount);
  const canShowMore = visibleCount < profiles.length;

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-purple-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-pink-500/20 text-pink-300 px-6 py-3 rounded-full text-sm font-medium border border-pink-500/30 mb-6">
            <span>✨</span>
            <span>Premium Selection</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-4">
            Featured <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Elite Profiles</span>
          </h2>
          <p className="text-xl text-pink-200/80 max-w-3xl mx-auto leading-relaxed">
            Handpicked selection of our most exclusive and verified professionals. 
            Each profile is carefully curated for your premium experience.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-black/30 rounded-2xl p-2 border border-pink-500/20">
            {['all', 'promoted', 'verified', 'recent'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setFilter(tab);
                  setVisibleCount(8);
                }}
                className={`px-6 py-3 rounded-xl font-medium capitalize transition duration-300 ${
                  filter === tab
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-pink-200 hover:text-white hover:bg-pink-500/10'
                }`}
              >
                {tab === 'all' ? 'All Profiles' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* 5x5 Grid Layout */}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12 transition-all duration-500 ${
          visibleCount > 8 ? 'max-h-full' : 'max-h-[1000px]'
        }`}>
          {displayedProfiles.map((profile, index) => (
            <EnhancedProfileCard key={profile.id} profile={profile} index={index} />
          ))}
        </div>

        {/* Load More Button */}
        {canShowMore && (
          <div className="text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 8)}
              className="group bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 px-8 py-4 rounded-2xl font-semibold hover:from-pink-500/30 hover:to-purple-500/30 border-2 border-pink-500/30 hover:border-pink-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
            >
              <span className="flex items-center justify-center gap-3 text-lg">
                Load More Profiles 
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatCard number={profiles.length} label="Total Profiles" color="pink" />
          <StatCard number={profiles.filter(p => p.isAd).length} label="Promoted" color="purple" />
          <StatCard number={profiles.filter(p => p.verified).length} label="Verified" color="green" />
          <StatCard number={profiles.filter(p => p.incallPrice).length} label="Available Now" color="blue" />
        </div>
      </div>
    </section>
  );
}

// Enhanced Profile Card
function EnhancedProfileCard({ profile, index }) {
  return (
    <Link href={`/profile/${profile.id}`}>
      <div className="group relative bg-gradient-to-br from-black/40 to-purple-900/20 rounded-3xl border-2 border-pink-500/20 hover:border-pink-500/50 transition-all duration-500 transform hover:scale-105 hover:rotate-1 hover:shadow-2xl hover:shadow-pink-500/30 overflow-hidden cursor-pointer h-full">
        {/* Enhanced Badges */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
          {profile.isAd && (
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              🔥 PROMO
            </span>
          )}
          {profile.verified && (
            <span className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>

        {/* Profile Image with Enhanced Effects */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={profile.photos?.[0]?.url || '/default-avatar.jpg'}
            alt={profile.displayName}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>

        {/* Enhanced Info Section */}
        <div className="p-4 relative z-10">
          <h3 className="font-bold text-white text-sm mb-1 truncate">{profile.displayName}</h3>
          <p className="text-pink-200 text-xs mb-2 truncate">📍 {profile.location}</p>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-green-400 font-bold">{profile.incallPrice ? `$${profile.incallPrice}` : 'Contact'}</span>
            <span className="text-pink-300 text-xs bg-pink-500/20 px-2 py-1 rounded">{profile.age}</span>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap gap-1">
            {profile.gender && (
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">{profile.gender}</span>
            )}
            {profile.ethnicity && (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs">{profile.ethnicity}</span>
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition duration-500" />
      </div>
    </Link>
  );
}

// Stat Card Component
function StatCard({ number, label, color }) {
  const colorClasses = {
    pink: 'text-pink-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    blue: 'text-blue-400'
  };

  return (
    <div className="bg-black/20 rounded-2xl p-6 border border-pink-500/10 hover:border-pink-500/30 transition duration-300">
      <div className={`text-3xl font-bold ${colorClasses[color]} mb-2`}>{number}</div>
      <div className="text-pink-200 text-sm">{label}</div>
    </div>
  );
}