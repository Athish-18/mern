import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const usePersonalizedRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const preferences = useSelector((state) => state.preferences);

  useEffect(() => {
    if (!currentUser) return; // Only for logged-in users

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        // 1. Extract Top Profile from Redux State
        const getTopKey = (obj) => {
          const keys = Object.keys(obj);
          if (keys.length === 0) return null;
          return keys.reduce((a, b) => obj[a] > obj[b] ? a : b);
        };

        const preferredType = getTopKey(preferences.types);
        const preferredBedrooms = getTopKey(preferences.bedrooms);
        const preferredLocations = getTopKey(preferences.locations) ? [getTopKey(preferences.locations)] : [];
        
        let preferredPriceRange = null;
        if (preferences.prices.length > 0) {
           const avg = preferences.prices.reduce((a, b) => a + b, 0) / preferences.prices.length;
           preferredPriceRange = { min: avg * 0.7, max: avg * 1.3 }; // +/- 30% of their average interacted price
        }

        const profile = {
           preferredType,
           preferredBedrooms: preferredBedrooms ? Number(preferredBedrooms) : undefined,
           preferredLocations,
           preferredPriceRange
        };

        // 2. Fetch from Backend
        const res = await fetch('/api/listing/recommend/personalized', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profile, userId: currentUser._id }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
           setRecommendations(data);
        }
      } catch (error) {
        console.error('Failed to fetch personalized recommendations', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser, preferences]); // Re-run if preferences or user changes

  return { recommendations, loading };
};
