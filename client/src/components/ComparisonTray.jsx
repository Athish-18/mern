import { useCompare } from '../context/CompareContext';
import { FaTimes } from 'react-icons/fa';

export default function ComparisonTray() {
  const { compareListings, removeCompare, clearCompare, setIsComparing, isComparing } = useCompare();

  if (compareListings.length === 0 || isComparing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-[320px] flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-gray-100">
            Compare ({compareListings.length}/2)
          </h3>
          <button onClick={clearCompare} className="text-slate-500 hover:text-red-500 text-sm font-semibold">
            Clear
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          {compareListings.map((listing) => (
            <div key={listing._id} className="flex items-center gap-3 bg-white/50 dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5">
              <img src={listing.imageUrls[0]} alt="Property" className="w-12 h-12 rounded-md object-cover" />
              <p className="flex-1 text-sm font-semibold truncate text-slate-700 dark:text-gray-300">
                {listing.name}
              </p>
              <button onClick={() => removeCompare(listing._id)} className="text-slate-400 hover:text-red-500 p-1">
                <FaTimes size={12} />
              </button>
            </div>
          ))}
          
          {compareListings.length === 1 && (
            <div className="flex items-center justify-center gap-3 border border-dashed border-gray-300 dark:border-white/10 p-2 rounded-lg h-[66px] bg-slate-50/50 dark:bg-white/5">
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Select another property</p>
            </div>
          )}
        </div>

        <button
          disabled={compareListings.length < 2}
          onClick={() => setIsComparing(true)}
          className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Compare Properties
        </button>
      </div>
    </div>
  );
}
