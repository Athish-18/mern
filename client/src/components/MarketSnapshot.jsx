import { useEffect, useState } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function MarketSnapshot({ listing }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ai/market-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to fetch market snapshot');
        
        setSnapshot(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (listing) {
      fetchSnapshot();
    }
  }, [listing]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 my-8 flex items-center gap-3">
        <FaExclamationCircle className="text-red-500 text-xl shrink-0" />
        <p className="text-red-700 dark:text-red-400 text-sm">Market analysis unavailable for this property.</p>
      </div>
    );
  }

  if (loading || !snapshot) {
    return (
      <div className="my-8 bg-slate-50 dark:bg-zinc-900/50 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl shadow-black/5 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 dark:text-gray-300 font-medium animate-pulse">Analyzing local market conditions...</p>
      </div>
    );
  }

  const getMetricColor = (value) => {
    const v = value?.toLowerCase() || '';
    if (v.includes('high') || v.includes('strong') || v.includes('excellent')) return 'text-emerald-600 dark:text-emerald-400';
    if (v.includes('weak') || v.includes('poor')) return 'text-red-600 dark:text-red-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="my-10 bg-white/5 dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20 animate-fade-in overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-lg">
          <FaChartLine size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">AI Market Snapshot</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Real-time insights based on Dwell Base property data.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold mb-1">Price Position</p>
          <p className="text-lg font-bold text-slate-800 dark:text-gray-100 flex items-center gap-1">
            {snapshot.pricePosition.includes('Above') && <FaArrowUp className="text-red-500 text-sm" />}
            {snapshot.pricePosition.includes('Below') && <FaArrowDown className="text-emerald-500 text-sm" />}
            {snapshot.pricePosition}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold mb-1">Demand Level</p>
          <p className={`text-lg font-bold ${getMetricColor(snapshot.demandLevel)}`}>{snapshot.demandLevel}</p>
        </div>
        <div className="bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold mb-1">Rental Appeal</p>
          <p className={`text-lg font-bold ${getMetricColor(snapshot.rentalAppeal)}`}>{snapshot.rentalAppeal}</p>
        </div>
        <div className="bg-slate-50 dark:bg-zinc-800/80 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-transform hover:-translate-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold mb-1">Investment</p>
          <p className={`text-lg font-bold ${getMetricColor(snapshot.investmentPotential)}`}>{snapshot.investmentPotential}</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-4 uppercase tracking-wider">AI Summary</h3>
        <ul className="space-y-3 mb-6">
          {snapshot.summaryBullets?.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" size={14} />
              <span className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <span className="text-indigo-500">💡</span> Overall Assessment:
          </p>
          <p className="text-indigo-800 dark:text-indigo-300 text-sm mt-1 ml-6">{snapshot.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
