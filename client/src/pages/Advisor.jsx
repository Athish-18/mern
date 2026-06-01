import { useState } from 'react';
import { FaCheck, FaMagic, FaBuilding } from 'react-icons/fa';
import ListingItem from '../components/ListingItem';

export default function Advisor() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to get advice');
      
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fallback Messaging Logic
  let headerText = "Recommended Properties";
  let subText = null;

  if (results && results.listings && results.recommendedArea) {
    const recommendedLocality = results.recommendedArea.toLowerCase();
    const exactLocalityCount = results.listings.filter(l => l.address.toLowerCase().includes(recommendedLocality)).length;
    const totalCount = results.listings.length;
    
    if (totalCount > 0) {
      if (exactLocalityCount >= Math.ceil(totalCount / 2)) {
        headerText = `Properties in ${results.recommendedArea}`;
        if (exactLocalityCount < totalCount) {
          subText = `Some properties are shown from nearby areas because limited listings matched all constraints in ${results.recommendedArea}.`;
        }
      } else if (exactLocalityCount === 0) {
        headerText = "Alternative Matches";
        subText = `No properties in ${results.recommendedArea} matched your requirements. Showing the closest matches based on your budget and preferences.`;
      } else {
        headerText = "Best Matching Properties";
        subText = `Some properties are shown from nearby areas because limited listings matched all constraints in ${results.recommendedArea}.`;
      }
    } else {
      headerText = `Properties in ${results.recommendedArea}`;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-3">
            <span className="text-indigo-500">✨</span> AI Property Advisor
          </h1>
          <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Tell us about your lifestyle, work location, family needs, and budget. Our AI will analyze the market and recommend the perfect locality and properties for you.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="query" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Describe your situation
            </label>
            <textarea
              id="query"
              rows="4"
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="e.g. I work in Electronic City and have a budget of 40k. I have two children and need a family-friendly area..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            ></textarea>
            
            <button
              disabled={loading || !query.trim()}
              type="submit"
              className="mt-2 w-full md:w-auto self-end bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                 <span className="animate-pulse">Analyzing Market...</span>
              ) : (
                 <>Get Recommendations <FaMagic /></>
              )}
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
           <div className="flex flex-col items-center justify-center py-12 gap-6 animate-fade-in">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xl font-semibold text-slate-600 dark:text-gray-300 animate-pulse">
                Analyzing your requirements and matching localities...
              </p>
           </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-12 animate-slide-up">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Recommended Area */}
               <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-center">
                 <p className="text-indigo-100 font-medium uppercase tracking-wider mb-2">Recommended Locality</p>
                 <h2 className="text-4xl md:text-5xl font-extrabold">{results.recommendedArea}</h2>
                 
                 <div className="mt-8 flex flex-wrap gap-2">
                   {results.suggestedPropertyTypes?.map((type, i) => (
                     <span key={i} className="bg-white/20 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                       <FaBuilding /> {type}
                     </span>
                   ))}
                 </div>
               </div>
               
               {/* Reasoning */}
               <div className="bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-lg">
                 <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mb-6">Why this area?</h3>
                 <ul className="space-y-4">
                   {results.reasoning?.map((reason, i) => (
                     <li key={i} className="flex items-start gap-3">
                       <div className="mt-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1 rounded-full shrink-0">
                         <FaCheck size={12} />
                       </div>
                       <span className="text-slate-700 dark:text-gray-300">{reason}</span>
                     </li>
                   ))}
                 </ul>
               </div>
            </div>

            {/* Recommended Listings */}
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                  {headerText}
                </h3>
                {subText && (
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-2 border-l-4 border-indigo-400 pl-3">
                    {subText}
                  </p>
                )}
              </div>
              
              {results.listings?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {results.listings.map((listing) => (
                    <div key={listing._id} className="w-full">
                       <ListingItem listing={listing} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-zinc-900/50 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
                   <p className="text-slate-600 dark:text-gray-400">No properties currently available in our database that perfectly match all generated filters for this area, but keep an eye out!</p>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
