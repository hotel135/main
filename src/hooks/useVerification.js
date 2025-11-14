// src/hooks/useVerification.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useVerification(redirectIfVerified = true) {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userData) {
      // If user hasn't uploaded vDoc, redirect to verification page
      if (!userData.vDoc) {
        router.push('/dashboard/provider/verification');
        return;
      }
      
      // If user is not verified, redirect to pending page
      if (!userData.verified && redirectIfVerified) {
        router.push('/dashboard/provider/pending-verification');
        return;
      }

      // If user is verified but we're on verification pages, redirect to dashboard
      if (userData.verified && !redirectIfVerified) {
        router.push('/dashboard/provider');
        return;
      }
    }
  }, [userData, loading, router, redirectIfVerified]);

  return {
    isVerified: userData?.verified || false,
    hasVDoc: userData?.vDoc || false,
    isLoading: loading,
    userData
  };
}