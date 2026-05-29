import { useCompare } from '../context/CompareContext';
import { useEffect, useState } from 'react';
import { FaTimes, FaCheck, FaInfoCircle } from 'react-icons/fa';

export default function ComparisonModal() {
  const { compareListings, isComparing, setIsComparing, clearCompare } = useCompare();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isComparing && compareListings.length === 2 && !analysis) {
      const fetchAnalysis = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/ai/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyA: compareListings[0],
              propertyB: compareListings[1],
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setAnalysis(data);
          }
        } catch (error) {
          console.error("Comparison failed", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [isComparing, compareListings, analysis]);

  if (!isComparing) return null;

  const [propA, propB] = compareListings;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-6xl min-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-white/10 my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/5 sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <span className="text-3xl">⚖️</span> Property Comparison
          </h2>
          <button 
            onClick={() => setIsComparing(false)}
            className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[propA, propB].map((prop, idx) => (
              <div key={prop._id} className="flex flex-col gap-4 bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-gray-200 dark:border-white/5">
                <img src={prop.imageUrls[0]} alt={prop.name} className="w-full h-64 object-cover rounded-xl shadow-sm" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{prop.name}</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-2xl">
                    ₹{prop.offer ? prop.discountPrice.toLocaleString('en-IN') : prop.regularPrice.toLocaleString('en-IN')}
                    {prop.type === 'rent' && ' / month'}
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="text-slate-500 dark:text-gray-400">Location</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200 text-right max-w-[60%] line-clamp-1" title={prop.address}>{prop.address}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="text-slate-500 dark:text-gray-400">Type</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200 uppercase">{prop.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="text-slate-500 dark:text-gray-400">Bedrooms</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{prop.bedrooms}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="text-slate-500 dark:text-gray-400">Bathrooms</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{prop.bathrooms}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="text-slate-500 dark:text-gray-400">Furnished</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{prop.furnished ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Parking</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{prop.parking ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-800 border border-indigo-100 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-gray-100 mb-6 flex items-center gap-3">
              <span className="text-3xl">✨</span> AI Comparison Analysis
            </h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                 <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                 <p className="text-slate-600 dark:text-gray-300 font-semibold animate-pulse">Analyzing both properties...</p>
              </div>
            ) : analysis ? (
              <div className="flex flex-col gap-8">
                {/* Strengths */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-lg text-slate-700 dark:text-gray-200 mb-3 border-b border-indigo-200 dark:border-zinc-700 pb-2">
                      Property A Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysis.propertyAStrengths?.map((str, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-gray-300">
                          <FaCheck className="text-emerald-500 mt-1 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-700 dark:text-gray-200 mb-3 border-b border-indigo-200 dark:border-zinc-700 pb-2">
                      Property B Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysis.propertyBStrengths?.map((str, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-gray-300">
                          <FaCheck className="text-emerald-500 mt-1 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white dark:bg-black/20 rounded-2xl p-6 border border-indigo-100 dark:border-white/5">
                   <h4 className="font-extrabold text-xl text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                     <FaInfoCircle className="text-indigo-500" /> Final Recommendation
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-indigo-50/50 dark:bg-white/5 p-4 rounded-xl">
                         <p className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Choose Property A if:</p>
                         <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-gray-300 text-sm">
                           {analysis.recommendation?.chooseAIf?.map((rec, i) => <li key={i}>{rec}</li>)}
                         </ul>
                      </div>
                      <div className="bg-purple-50/50 dark:bg-white/5 p-4 rounded-xl">
                         <p className="font-bold text-purple-900 dark:text-purple-300 mb-2">Choose Property B if:</p>
                         <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-gray-300 text-sm">
                           {analysis.recommendation?.chooseBIf?.map((rec, i) => <li key={i}>{rec}</li>)}
                         </ul>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">Failed to load analysis.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
