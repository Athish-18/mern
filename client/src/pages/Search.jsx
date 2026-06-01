import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { recordSearchFilters } from '../redux/preferences/preferencesSlice'
import ListingItem from '../components/ListingItem'
import SearchMap from '../components/SearchMap'

export default function Search() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    type: 'all',
    parking: false,
    furnished: false,
    offer: false,
    minPrice: '',
    maxPrice: '',
    sort: 'created_at',
    order: 'desc',
  })

  const [loading, setLoading] = useState(false)
  const [listings, setListings] = useState([])
  const [showMore, setShowMore] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [aiExplanation, setAiExplanation] = useState(null)
  const [aiDidSearch, setAiDidSearch] = useState(false)
  const cardRefs = useRef({})

  // ── AI Chat Assistant ────────────────────────────────────────────────────────────
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [isContextAware, setIsContextAware] = useState(false)
  
  // The conversation history array holding objects { role: 'user' | 'assistant', content: string }
  const [conversation, setConversation] = useState([])
  const chatEndRef = useRef(null)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if(chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const searchTermFromUrl = urlParams.get('searchTerm')
    const typeFromUrl = urlParams.get('type')
    const parkingFromUrl = urlParams.get('parking')
    const furnishedFromUrl = urlParams.get('furnished')
    const offerFromUrl = urlParams.get('offer')
    const sortFromUrl = urlParams.get('sort')
    const orderFromUrl = urlParams.get('order')

    if (
      searchTermFromUrl ||
      typeFromUrl ||
      parkingFromUrl ||
      furnishedFromUrl ||
      offerFromUrl ||
      sortFromUrl ||
      orderFromUrl
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || '',
        type: typeFromUrl || 'all',
        parking: parkingFromUrl === 'true' ? true : false,
        furnished: furnishedFromUrl === 'true' ? true : false,
        offer: offerFromUrl === 'true' ? true : false,
        minPrice: urlParams.get('minPrice') || '',
        maxPrice: urlParams.get('maxPrice') || '',
        sort: sortFromUrl || 'created_at',
        order: orderFromUrl || 'desc',
      })
    }

    const fetchListings = async () => {
      setLoading(true)
      setShowMore(false)
      const searchQuery = urlParams.toString()
      const res = await fetch(`/api/listing/get?${searchQuery}`)
      const data = await res.json()
      if (data.length > 8) {
        setShowMore(true)
      } else {
        setShowMore(false)
      }
      setListings(data)
      setLoading(false)
    }

    fetchListings()
  }, [location.search])

  const handleChange = (e) => {
    if (
      e.target.id === 'all' ||
      e.target.id === 'rent' ||
      e.target.id === 'sale'
    ) {
      setSidebardata({ ...sidebardata, type: e.target.id })
    }

    if (e.target.id === 'searchTerm') {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value })
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setSidebardata({
        ...sidebardata,
        [e.target.id]:
          e.target.checked || e.target.checked === 'true' ? true : false,
      })
    }

    if (e.target.id === 'minPrice' || e.target.id === 'maxPrice') {
      setSidebardata({ ...sidebardata, [e.target.id]: e.target.value })
    }

    if (e.target.id === 'sort_order') {
      const sort = e.target.value.split('_')[0] || 'created_at'
      const order = e.target.value.split('_')[1] || 'desc'
      setSidebardata({ ...sidebardata, sort, order })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('[DEBUG] Triggering Manual Search. State before sync:', sidebardata)
    setAiExplanation(null)
    setAiDidSearch(false)
    setConversation([]) // Prevent stale AI context leaking into manual searches
    
    dispatch(recordSearchFilters({
      searchTerm: sidebardata.searchTerm,
      type: sidebardata.type,
      minPrice: sidebardata.minPrice,
      maxPrice: sidebardata.maxPrice
    }))
    
    const urlParams = new URLSearchParams()
    urlParams.set('searchTerm', sidebardata.searchTerm)
    urlParams.set('type', sidebardata.type)
    urlParams.set('parking', sidebardata.parking)
    urlParams.set('furnished', sidebardata.furnished)
    urlParams.set('offer', sidebardata.offer)
    urlParams.set('minPrice', sidebardata.minPrice)
    urlParams.set('maxPrice', sidebardata.maxPrice)
    urlParams.set('sort', sidebardata.sort)
    urlParams.set('order', sidebardata.order)
    const searchQuery = urlParams.toString()
    navigate(`/search?${searchQuery}`)
    setIsMobileFiltersOpen(false) // Close drawer on submit
  }

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length
    const startIndex = numberOfListings
    const urlParams = new URLSearchParams(location.search)
    urlParams.set('startIndex', startIndex)
    const searchQuery = urlParams.toString()
    const res = await fetch(`/api/listing/get?${searchQuery}`)
    const data = await res.json()
    if (data.length < 9) {
      setShowMore(false)
    }
    setListings([...listings, ...data])
  }

  // ── AI Chat handler ─────────────────────────────────────────────────────
  const handleAiChatSubmit = async () => {
    if (!aiQuery.trim()) return
    
    console.log('[DEBUG] Triggering AI Search. Context-Aware Mode:', isContextAware)
    
    const userMessage = { role: 'user', content: aiQuery }
    // If not in context-aware mode, start a fresh conversation array
    const updatedConversation = isContextAware ? [...conversation, userMessage] : [userMessage]
    
    setConversation(updatedConversation)
    setAiQuery('')
    setAiLoading(true)
    setAiError('')
    
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedConversation }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setAiError(data.message || 'AI chat failed')
        return
      }

      // Append assistant's reply
      setConversation(prev => [...prev, { role: 'assistant', content: data.reply }])

      // If AI determined this was a search, refresh listings
      if (data.isSearch && data.listings) {
        setListings(data.listings)
        setShowMore(false)
        setAiExplanation(data.explanation || [])
        setAiDidSearch(true)
        
        if (data.filters) {
           console.log('[DEBUG] AI Filters received. Syncing to React sidebardata:', data.filters)
           dispatch(recordSearchFilters(data.filters))
           // Critical Fix: Sync AI filters into React state to prevent stale state leaks on subsequent manual searches
           setSidebardata(prev => ({
             ...prev,
             searchTerm: data.filters.searchTerm ?? prev.searchTerm,
             type: data.filters.type || prev.type,
             minPrice: data.filters.minPrice || prev.minPrice,
             maxPrice: data.filters.maxPrice || prev.maxPrice,
             parking: data.filters.parking ?? prev.parking,
             furnished: data.filters.furnished ?? prev.furnished,
             offer: data.filters.offer ?? prev.offer
           }))
        }
      }
    } catch {
      setAiError('Network error — could not reach AI assistant.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleResetAiSearch = () => {
    setConversation([])
    setAiQuery('')
    setAiExplanation(null)
    setAiDidSearch(false)
  }

  return (
    <div className="flex flex-col animate-fade-in">
      {/* ── AI Chat Assistant ──────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center py-10 bg-slate-50 dark:bg-zinc-950/50 border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="w-full max-w-4xl px-4 flex flex-col gap-6">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">✨</span>
                    <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                        AI SEARCH ASSISTANT
                    </span>
                </div>
                {conversation.length > 0 && (
                    <button 
                        onClick={handleResetAiSearch}
                        className="text-xs font-bold uppercase tracking-wider bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-gray-300 py-2 px-4 rounded-full transition-colors flex items-center gap-1"
                    >
                        <span>⟳</span> Clear Context
                    </button>
                )}
            </div>

            {/* Chat History Box */}
            <div 
                className="w-full flex flex-col gap-4 overflow-y-auto rounded-3xl p-6 shadow-inner bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/5 backdrop-blur-md"
                style={{ maxHeight: '400px', minHeight: '150px' }}
            >
                {conversation.length === 0 && (
                    <div className="text-center text-slate-400 mt-6 italic">
                        Start chatting! Try "Find me cheap homes in BTM" or "Only show 2BHK".
                    </div>
                )}
                {conversation.map((msg, i) => (
                    <div 
                        key={i} 
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm flex-shrink-0 ${
                            msg.role === 'user' 
                            ? 'self-end bg-indigo-600 text-white rounded-br-none' 
                            : 'self-start bg-slate-700 text-slate-100 rounded-bl-none shadow-md'
                        }`}
                        style={{ lineHeight: '1.5' }}
                    >
                        {msg.content}
                    </div>
                ))}
                {aiLoading && (
                    <div className="self-start text-xs font-semibold text-slate-400 mt-1">
                       Analyzing requirements...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-3 w-full mt-2 relative">
                <input
                    type="text"
                    placeholder="Ask about properties... (e.g. 'Show me 2BHK in BTM...')"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiChatSubmit()}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-full pl-6 pr-24 sm:pr-32 py-4 text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all"
                />
                <button
                    onClick={handleAiChatSubmit}
                    disabled={aiLoading}
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-4 sm:px-8 font-bold tracking-wide hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center min-w-[60px] sm:min-w-[100px]"
                >
                    {aiLoading ? '⏳' : <><span className="hidden sm:inline">SEND</span><span className="sm:hidden text-lg font-normal">➤</span></>}
                </button>
            </div>
            {aiError && (
                <p className="text-red-500 text-sm pl-4 font-medium">
                    ⚠ {aiError}
                </p>
            )}
            <div className="pl-4 flex items-center gap-2 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-gray-400 font-medium">
                    <input 
                        type="checkbox" 
                        checked={isContextAware}
                        onChange={(e) => setIsContextAware(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                    Context-Aware Assistant (Remember previous messages)
                </label>
            </div>
        </div>
      </div>

      {/* ── Mobile Filters Button ── */}
      <div className="lg:hidden px-4 py-4 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-zinc-950">
        <h2 className="font-extrabold tracking-tight text-xl text-slate-800 dark:text-gray-100">Property Results</h2>
        <button 
          onClick={() => setIsMobileFiltersOpen(true)}
          className="bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 px-5 py-2 rounded-full font-bold text-sm tracking-wide border border-gray-200 dark:border-white/10 flex items-center gap-2 shadow-sm"
        >
          <span>Filters</span>
        </button>
      </div>

      {/* ── Sidebar + Results layout ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row max-w-[1500px] mx-auto w-full gap-0 lg:gap-8 p-4 sm:p-6 lg:p-8">
        
        {/* Mobile Overlay */}
        {isMobileFiltersOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          ></div>
        )}

        {/* Sidebar Container (Drawer on Mobile, Sidebar on Desktop) */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-full sm:w-[400px] bg-white dark:bg-zinc-950 shadow-2xl transform transition-transform duration-300 ease-in-out
          lg:relative lg:transform-none lg:w-[340px] lg:shrink-0 lg:bg-transparent lg:shadow-none lg:z-0
          ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full overflow-y-auto lg:overflow-visible">
            {/* Mobile Header for Drawer */}
            <div className="lg:hidden p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-10">
              <h2 className="font-extrabold text-xl text-slate-800 dark:text-gray-100">Filters</h2>
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-zinc-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/80 dark:bg-white/5 lg:backdrop-blur-xl lg:border border-gray-200 dark:border-white/10 lg:rounded-3xl lg:shadow-xl lg:dark:shadow-black/20 p-6 sm:p-8 lg:sticky lg:top-24">
              <form onSubmit={handleSubmit} className="flex flex-col gap-7 pb-20 lg:pb-0">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">
                  Search Term
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  placeholder="Location, property name..."
                  className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all shadow-sm placeholder:transition-opacity focus:placeholder:opacity-50"
                  value={sidebardata.searchTerm}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Property Type</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer group/cb">
                    <input type="checkbox" id="all" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer transition-transform group-hover/cb:scale-110 active:scale-90" onChange={handleChange} checked={sidebardata.type === 'all'} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium group-hover/cb:text-emerald-600 dark:group-hover/cb:text-emerald-400 transition-colors">Any</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group/cb">
                    <input type="checkbox" id="rent" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer transition-transform group-hover/cb:scale-110 active:scale-90" onChange={handleChange} checked={sidebardata.type === 'rent'} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium group-hover/cb:text-emerald-600 dark:group-hover/cb:text-emerald-400 transition-colors">Rent</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group/cb">
                    <input type="checkbox" id="sale" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer transition-transform group-hover/cb:scale-110 active:scale-90" onChange={handleChange} checked={sidebardata.type === 'sale'} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium group-hover/cb:text-emerald-600 dark:group-hover/cb:text-emerald-400 transition-colors">Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group/cb">
                    <input type="checkbox" id="offer" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer transition-transform group-hover/cb:scale-110 active:scale-90" onChange={handleChange} checked={sidebardata.offer} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium group-hover/cb:text-emerald-600 dark:group-hover/cb:text-emerald-400 transition-colors">Offer</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Amenities</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer group/cb">
                    <input type="checkbox" id="parking" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer transition-transform group-hover/cb:scale-110 active:scale-90" onChange={handleChange} checked={sidebardata.parking} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium group-hover/cb:text-emerald-600 dark:group-hover/cb:text-emerald-400 transition-colors">Parking</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group/cb">
                    <input type="checkbox" id="furnished" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer transition-transform group-hover/cb:scale-110 active:scale-90" onChange={handleChange} checked={sidebardata.furnished} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium group-hover/cb:text-emerald-600 dark:group-hover/cb:text-emerald-400 transition-colors">Furnished</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex flex-col gap-3">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Price Range (₹)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" id="minPrice" placeholder="Min" min="0"
                    className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all shadow-sm placeholder:transition-opacity focus:placeholder:opacity-50"
                    value={sidebardata.minPrice} onChange={handleChange}
                  />
                  <span className="text-gray-400 font-medium">–</span>
                  <input
                    type="number" id="maxPrice" placeholder="Max" min="0"
                    className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all shadow-sm placeholder:transition-opacity focus:placeholder:opacity-50"
                    value={sidebardata.maxPrice} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Sort By</label>
                <select
                  onChange={handleChange}
                  defaultValue={'created_at_desc'}
                  id="sort_order"
                  className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm cursor-pointer"
                >
                  <option value="regularPrice_desc">Price: High to Low</option>
                  <option value="regularPrice_asc">Price: Low to High</option>
                  <option value="createdAt_desc">Latest Additions</option>
                  <option value="createdAt_asc">Oldest First</option>
                </select>
              </div>

              <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-2">
                Search Properties
              </button>
            </form>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-6 lg:mt-0">
          <h1 className="hidden lg:block text-2xl font-extrabold tracking-tight text-slate-800 dark:text-gray-100 px-2 mt-2">
            Property Results
          </h1>

          {/* ── AI Reasoning Card ── */}
          {aiDidSearch && aiExplanation && (
            <div className="mx-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl shadow-black/20 p-6 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                
                {listings.length > 0 ? (
                    <>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                           <span className="text-2xl">✨</span> AI matched {listings.length} {listings.length === 1 ? 'property' : 'properties'}
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                           Active Search Criteria:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {aiExplanation.map((reason, idx) => (
                                <span key={idx} className="bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 dark:text-gray-200 flex items-center gap-1.5 shadow-sm">
                                   <span className="text-emerald-500 font-bold">✓</span> {reason}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                           <span className="text-2xl">✨</span> No properties matched your request.
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
                           We couldn't find any exact matches for these criteria:
                        </p>
                        <div className="flex flex-wrap gap-3 mb-5">
                            {aiExplanation.map((reason, idx) => (
                                <span key={idx} className="bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full text-sm text-slate-700 dark:text-gray-200 flex items-center gap-1">
                                   <span className="text-emerald-500 font-bold">✓</span> {reason}
                                </span>
                            ))}
                        </div>
                        <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                            <p className="font-semibold text-slate-700 dark:text-gray-300 mb-2">Try adjusting your search:</p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-gray-400 space-y-1">
                                <li>Increasing your budget limit</li>
                                <li>Expanding the location or searching a broader area</li>
                                <li>Reducing the number of specific filters (e.g. furnished, parking)</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-8">
            {/* LEFT — listing cards (scrollable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 xl:overflow-y-auto xl:max-h-[calc(100vh-120px)] pr-2 pb-10 content-start">
              {!loading && listings.length === 0 && (
                <p className="col-span-full text-xl text-slate-500 dark:text-gray-400 p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 text-center font-medium">No properties found matching your criteria.</p>
              )}
              {loading && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-full aspect-[4/3] sm:h-auto h-[350px] bg-slate-200 dark:bg-zinc-800/80 rounded-2xl animate-shimmer border border-transparent dark:border-white/5"></div>
                  ))}
                </>
              )}
              {!loading &&
                listings &&
                listings.map((listing) => (
                  <div
                    key={listing._id}
                    ref={(el) => {
                      cardRefs.current[listing._id] = el
                    }}
                    className={`transition-all duration-300 rounded-xl ${
                      activeId === listing._id
                        ? 'ring-2 ring-blue-500 shadow-lg scale-[1.01]'
                        : ''
                    }`}
                    onMouseEnter={() => setActiveId(listing._id)}
                    onMouseLeave={() => setActiveId(null)}
                  >
                    <ListingItem listing={listing} />
                  </div>
                ))}
              {showMore && (
                <button
                  onClick={onShowMoreClick}
                  className="col-span-full mt-2 bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700/80 p-4 font-bold text-center transition-all shadow-sm hover:shadow"
                >
                  Show More Properties
                </button>
              )}
            </div>

            {/* RIGHT — sticky map */}
            {!loading && listings.length > 0 && (
              <div
                className="w-full xl:w-[480px] 2xl:w-[540px] xl:sticky xl:top-24 xl:self-start drop-shadow-xl z-10 xl:h-[calc(100vh-120px)] h-[500px]"
              >
                <SearchMap
                  listings={listings}
                  activeId={activeId}
                  onMarkerClick={(id) => {
                    setActiveId(id)
                    const card = cardRefs.current[id]
                    if (card) {
                      card.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
