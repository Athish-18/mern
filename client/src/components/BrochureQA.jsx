import { useState, useEffect } from 'react';

export default function BrochureQA({ listingId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [hasBrochure, setHasBrochure] = useState(null);
  const [brochureTitle, setBrochureTitle] = useState('');

  const suggestedQuestions = [
    "What amenities are available?",
    "Does this project have a clubhouse?",
    "What sports facilities are available?",
    "What outdoor amenities are available?",
    "What security features are provided?"
  ];

  useEffect(() => {
    const checkBrochure = async () => {
      try {
        const res = await fetch(`/api/brochure/check/${listingId}`);
        const data = await res.json();
        if (data.hasBrochure) {
          setHasBrochure(true);
          setBrochureTitle(data.brochureTitle);
        } else {
          setHasBrochure(false);
        }
      } catch (err) {
        console.error("Failed to check brochure:", err);
        setHasBrochure(false);
      }
    };
    checkBrochure();
  }, [listingId]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);

    try {
      const res = await fetch('/api/brochure/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          listingRef: listingId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to get answer');
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render newlines and preserve spacing cleanly
  const renderFormattedAnswer = (text) => {
    return text.split('\n').map((line, idx) => {
      if (!line.trim()) return <br key={idx} />;
      return (
        <p key={idx} className="mb-2 last:mb-0 text-slate-800 dark:text-gray-200 leading-relaxed font-medium">
          {line}
        </p>
      );
    });
  };

  if (hasBrochure === null) return null; // loading state

  if (!hasBrochure) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 rounded-lg p-6 mt-6 text-center shadow-sm">
        <span className="text-4xl mb-3 block">📄</span>
        <p className="text-slate-600 dark:text-gray-400 font-medium">
          AI brochure assistant is unavailable for this property because no brochure has been uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 rounded-lg p-6 mt-6 shadow-sm">
      <div className="flex flex-col mb-6">
        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
          <span>🤖</span> Ask AI About This Property
        </h3>
        {brochureTitle && (
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
            AI Assistant powered by: {brochureTitle}
          </p>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Suggested Questions</h4>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuestion(sq)}
              className="bg-indigo-50 dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-100 dark:hover:bg-zinc-600 transition-colors border border-indigo-200 dark:border-zinc-600 text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleAsk} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="e.g., Does this project have a clubhouse?"
          className="border p-3 rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          disabled={loading || !question.trim()}
          className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-opacity uppercase font-semibold flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </>
          ) : 'Ask Question'}
        </button>
      </form>

      {error && <p className="text-red-600 dark:text-red-400 mt-4 text-sm font-medium">{error}</p>}

      {answer && (
        <div className="mt-6 p-5 bg-indigo-50/50 dark:bg-zinc-900/50 rounded-lg border border-indigo-100 dark:border-zinc-700/50 animate-fade-in shadow-inner">
          <div className="mb-4">
            {renderFormattedAnswer(answer)}
          </div>
          {sources.length > 0 && (
            <div className="mt-5 text-xs text-slate-500 dark:text-gray-400 border-t border-indigo-200 dark:border-zinc-700 pt-3 flex flex-col gap-2">
              <span className="font-semibold text-indigo-800 dark:text-indigo-400 text-sm mb-1 uppercase tracking-wider">Sources Used</span>
              {sources.map(s => (
                <span key={s.chunkIndex} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500"></span> Chunk {s.chunkIndex}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
