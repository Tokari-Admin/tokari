
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const TALLY_FORM_ID = 'w8RVyO';

declare global {
  interface Window {
    Tally: {
      openPopup: (formId: string, options?: any) => void;
      closePopup: (formId: string) => void;
    };
  }
}

export function TallyProfilePopupHandler() {
  const { user, loading } = useAuth();
  // Tracks if we've already attempted to show the popup for the current user session
  const [popupCheckAttemptedForUser, setPopupCheckAttemptedForUser] = useState<string | null>(null);

  const showPopup = useCallback(async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().hasCompletedTallyProfile === true) {
        return; // User has already completed the profile
      }

      // Check if Tally is loaded
      if (typeof window.Tally !== 'undefined' && window.Tally.openPopup) {
        window.Tally.openPopup(TALLY_FORM_ID, {
          layout: 'modal', // Opens as a centered modal
          width: 700,      // Example width, adjust as needed
          emoji: { text: "👋", animation: "wave" },
          hiddenFields: {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
          },
          onClose: () => {
            // User closed the popup without submitting.
            // For MVP, we'll allow it to try again on the next app load if not submitted.
            // More advanced: set a session flag or a temporary Firestore field.
          },
          onSubmit: async (payload: any) => {
            try {
              await setDoc(userDocRef, { hasCompletedTallyProfile: true }, { merge: true });
            } catch (error) {
              console.error("Error updating Tally profile completion status:", error);
              // Tally submission succeeded, but Firestore update failed.
              // May need manual reconciliation or a retry mechanism if critical.
            }
          },
        });
      } else {
        // Tally not loaded yet. This might happen if the script is slow or blocked.
        // Retry once after a bit more delay, then give up for this session.
        setTimeout(() => {
          if (typeof window.Tally !== 'undefined' && window.Tally.openPopup) {
             showPopup(); // Retry the call to showPopup
          } else {
            console.warn("Tally widget still not loaded. Profile popup cannot be shown.");
          }
        }, 2000); // Additional delay for retry
      }
    } catch (error) {
      console.error("Error checking or showing Tally profile popup:", error);
    }
  }, [user]);


  useEffect(() => {
    if (loading || !user) {
      setPopupCheckAttemptedForUser(null); // Reset if user logs out or changes
      return;
    }

    // Only attempt to show the popup once per user load/login
    if (user.uid === popupCheckAttemptedForUser) {
      return;
    }
    
    setPopupCheckAttemptedForUser(user.uid);

    // Initial delay to allow Tally script to load from lazyOnload strategy
    const timer = setTimeout(showPopup, 1500); 

    return () => clearTimeout(timer);

  }, [user, loading, showPopup, popupCheckAttemptedForUser]);

  return null; // This component does not render anything visible
}
