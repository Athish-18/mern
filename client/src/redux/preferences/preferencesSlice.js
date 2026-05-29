import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  locations: {},
  types: {},
  bedrooms: {},
  prices: [],
};

const incrementCounter = (obj, key, weight = 1) => {
  if (key === undefined || key === null || key === '') return;
  const safeKey = String(key).toLowerCase();
  obj[safeKey] = (obj[safeKey] || 0) + weight;
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    recordInteraction: (state, action) => {
      const { listing, weight = 1 } = action.payload;
      if (!listing) return;
      
      // Increment type
      if (listing.type) {
        incrementCounter(state.types, listing.type, weight);
      }
      
      // Increment bedrooms
      if (listing.bedrooms !== undefined) {
        incrementCounter(state.bedrooms, listing.bedrooms, weight);
      }
      
      // Increment location
      if (listing.address) {
        const parts = listing.address.split(',');
        const mainArea = parts[parts.length - 1].trim();
        incrementCounter(state.locations, mainArea, weight);
      }
      
      // Record price
      const price = listing.offer ? listing.discountPrice : listing.regularPrice;
      if (price) {
         state.prices.push(price);
         if (state.prices.length > 20) state.prices.shift(); // Keep last 20 for moving average
      }
    },
    recordSearchFilters: (state, action) => {
      const { searchTerm, type, bedrooms, minPrice, maxPrice } = action.payload;
      if (searchTerm) incrementCounter(state.locations, searchTerm, 2);
      if (type && type !== 'all') incrementCounter(state.types, type, 2);
      if (bedrooms) incrementCounter(state.bedrooms, bedrooms, 2);
      
      // Approximate price interest
      if (minPrice && maxPrice) {
          state.prices.push((Number(minPrice) + Number(maxPrice)) / 2);
          if (state.prices.length > 20) state.prices.shift();
      } else if (maxPrice) {
          state.prices.push(Number(maxPrice));
          if (state.prices.length > 20) state.prices.shift();
      }
    },
    clearPreferences: () => initialState
  }
});

export const { recordInteraction, recordSearchFilters, clearPreferences } = preferencesSlice.actions;

export default preferencesSlice.reducer;
