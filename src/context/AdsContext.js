// src/context/AdsContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSimpleWallet } from './SimpleWalletContext';
import { 
  collection, addDoc, updateDoc, doc, 
  query, where, orderBy, onSnapshot, deleteDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AdsContext = createContext();

export function useAds() {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
}

export function AdsProvider({ children }) {
  const { user } = useAuth();
  const { balance, payForAd } = useSimpleWallet();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Load user's ads with safe user check
  const loadAds = async (userId) => {
    try {
      if (!userId) {
        setAds([]);
        setLoading(false);
        return;
      }

      const adsQuery = query(
        collection(db, 'ads'),
        where('userId', '==', userId),
        orderBy('lastPaymentDate', 'desc')
      );

      // Clear previous listener
      if (unsubscribe) {
        unsubscribe();
      }

      const newUnsubscribe = onSnapshot(adsQuery, 
        (snapshot) => {
          const adsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAds(adsData);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading ads:', error);
          setLoading(false);
        }
      );

      setUnsubscribe(() => newUnsubscribe);
      return newUnsubscribe;

    } catch (error) {
      console.error('Error setting up ads listener:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAds(user.uid);
    } else {
      setAds([]);
      setLoading(false);
    }

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Safe create ad function
  const createAd = async (adData) => {
    if (!user) {
      throw new Error('User not authenticated. Please log in.');
    }

    if (!payForAd) {
      throw new Error('Wallet service not available. Please try again.');
    }
    
    // Pay for ad
    const paymentResult = await payForAd(3.00, {
      type: 'ad_creation',
      adData: adData
    });

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    // Create ad document
    const adDoc = {
      userId: user.uid,
      ...adData,
      status: 'active',
      amountPaid: 3.00,
      lastPaymentDate: new Date(),
      boostUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      priority: Math.floor(Date.now() / 1000), // Use timestamp for ranking
      views: 0,
      clicks: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const adRef = await addDoc(collection(db, 'ads'), adDoc);
      return { success: true, adId: adRef.id };
    } catch (error) {
      throw new Error(`Failed to create ad: ${error.message}`);
    }
  };

  // Boost existing ad
  const boostAd = async (adId) => {
    if (!user) {
      throw new Error('User not authenticated. Please log in.');
    }

    if (!payForAd) {
      throw new Error('Wallet service not available. Please try again.');
    }

    // Pay for boost
    const paymentResult = await payForAd(3.00, {
      type: 'ad_boost',
      adId: adId
    });

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    // Update ad with boost
    try {
      await updateDoc(doc(db, 'ads', adId), {
        lastPaymentDate: new Date(),
        boostUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: Math.floor(Date.now() / 1000), // Use timestamp for ranking
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to boost ad: ${error.message}`);
    }
  };

  // Pause ad
  const pauseAd = async (adId) => {
    try {
      await updateDoc(doc(db, 'ads', adId), {
        status: 'paused',
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to pause ad: ${error.message}`);
    }
  };

  // Resume ad
  const resumeAd = async (adId) => {
    try {
      await updateDoc(doc(db, 'ads', adId), {
        status: 'active',
        updatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Failed to resume ad: ${error.message}`);
    }
  };

  // Delete ad
  const deleteAd = async (adId) => {
    try {
      await deleteDoc(doc(db, 'ads', adId));
    } catch (error) {
      throw new Error(`Failed to delete ad: ${error.message}`);
    }
  };

  const value = {
    ads,
    loading,
    createAd,
    boostAd,
    pauseAd,
    resumeAd,
    deleteAd
  };

  return (
    <AdsContext.Provider value={value}>
      {children}
    </AdsContext.Provider>
  );
}