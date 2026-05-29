import { createContext, useState, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { recordInteraction } from '../redux/preferences/preferencesSlice';

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compareListings, setCompareListings] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const dispatch = useDispatch();

  const toggleCompare = (listing) => {
    setCompareListings((prev) => {
      const exists = prev.find((l) => l._id === listing._id);
      if (exists) {
        return prev.filter((l) => l._id !== listing._id);
      }
      
      dispatch(recordInteraction({ listing, weight: 2 }));
      
      if (prev.length >= 2) {
        // Replace the second one if already 2, or just ignore. 
        // Let's replace the last one to allow swapping easily.
        return [prev[0], listing];
      }
      return [...prev, listing];
    });
  };

  const removeCompare = (id) => {
    setCompareListings((prev) => prev.filter((l) => l._id !== id));
    if (compareListings.length <= 1) {
       setIsComparing(false);
    }
  };

  const clearCompare = () => {
    setCompareListings([]);
    setIsComparing(false);
  };

  return (
    <CompareContext.Provider
      value={{
        compareListings,
        toggleCompare,
        removeCompare,
        clearCompare,
        isComparing,
        setIsComparing,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);
