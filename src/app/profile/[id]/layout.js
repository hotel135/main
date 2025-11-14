// src/app/profile/[id]/layout.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function generateMetadata({ params }) {
  try {
    const profileDoc = await getDoc(doc(db, 'users', params.id));
    
    if (!profileDoc.exists()) {
      return {
        title: 'Profile Not Found',
        description: 'The profile you are looking for does not exist.',
      };
    }

    const profile = profileDoc.data();
    
    return {
      title: `${profile.displayName} - Premium Dating Profile`,
      description: `Connect with ${profile.displayName} in ${profile.location}. ${profile.age} • ${profile.gender} • Verified professional.`,
      openGraph: {
        title: `${profile.displayName} - Premium Dating Profile`,
        description: `Discover ${profile.displayName}'s profile in ${profile.location}.`,
        images: profile.photos?.[0]?.url ? [profile.photos[0].url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Profile',
      description: 'Premium dating profile',
    };
  }
}

export default function ProfileLayout({ children }) {
  return children;
}