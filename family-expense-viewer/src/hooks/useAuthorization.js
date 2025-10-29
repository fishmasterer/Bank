import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useAuthorization(user) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.email) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const checkAuthorization = async () => {
      try {
        const q = query(
          collection(db, 'authorizedUsers'),
          where('email', '==', user.email.toLowerCase())
        );

        const querySnapshot = await getDocs(q);
        setIsAuthorized(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [user]);

  return { isAuthorized, loading };
}
