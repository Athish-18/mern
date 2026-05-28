import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListingItem from '../components/ListingItem'
import SearchMap from '../components/SearchMap'

export default function Search() {
  const navigate = useNavigate()
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
  const cardRefs = useRef({})

  // ── AI Chat Assistant ────────────────────────────────────────────────────────────
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  
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
    const userMessage = { role: 'user', content: aiQuery }
    const updatedConversation = [...conversation, userMessage]
    
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
      }
    } catch {
      setAiError('Network error — could not reach AI assistant.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* ── AI Chat Assistant ──────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center py-10 bg-slate-50 dark:bg-zinc-950/50 border-b border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="w-full max-w-4xl px-4 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">✨</span>
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                    AI SEARCH ASSISTANT
                </span>
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
                       Assistant is thinking...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-3 w-full mt-2 relative">
                <input
                    type="text"
                    placeholder="Ask about properties... (e.g. 'Show me 2BHK in BTM Layout under 20k')"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiChatSubmit()}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-full pl-6 pr-32 py-4 text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm transition-all"
                />
                <button
                    onClick={handleAiChatSubmit}
                    disabled={aiLoading}
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-8 font-bold tracking-wide hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center min-w-[100px]"
                >
                    {aiLoading ? '⏳' : 'SEND'}
                </button>
            </div>
            {aiError && (
                <p className="text-red-500 text-sm pl-4 font-medium">
                    ⚠ {aiError}
                </p>
            )}
        </div>
      </div>

      {/* ── Sidebar + Results layout ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row max-w-[1500px] mx-auto w-full gap-8 p-4 sm:p-6 lg:p-8">
        {/* Floating Sidebar */}
        <div className="lg:w-[340px] shrink-0">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-black/20 p-6 sm:p-8 lg:sticky lg:top-24">
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">
                  Search Term
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  placeholder="Location, property name..."
                  className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                  value={sidebardata.searchTerm}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Property Type</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="all" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" onChange={handleChange} checked={sidebardata.type === 'all'} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Any</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="rent" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" onChange={handleChange} checked={sidebardata.type === 'rent'} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Rent</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="sale" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" onChange={handleChange} checked={sidebardata.type === 'sale'} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="offer" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" onChange={handleChange} checked={sidebardata.offer} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Offer</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Amenities</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="parking" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" onChange={handleChange} checked={sidebardata.parking} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Parking</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="furnished" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" onChange={handleChange} checked={sidebardata.furnished} />
                    <span className="text-slate-600 dark:text-gray-300 font-medium">Furnished</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex flex-col gap-3">
                <label className="font-bold text-slate-700 dark:text-gray-200 tracking-wide text-sm uppercase">Price Range (₹)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" id="minPrice" placeholder="Min" min="0"
                    className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                    value={sidebardata.minPrice} onChange={handleChange}
                  />
                  <span className="text-gray-400 font-medium">–</span>
                  <input
                    type="number" id="maxPrice" placeholder="Max" min="0"
                    className="border border-gray-300 dark:border-white/10 rounded-xl p-3 w-full bg-white dark:bg-zinc-900/50 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
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

              <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-xl font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2">
                Search Properties
              </button>
            </form>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-gray-100 px-2 mt-2">
            Property Results
          </h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT — listing cards (scrollable) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 overflow-y-auto max-h-screen pr-2 pb-10 content-start">
              {!loading && listings.length === 0 && (
                <p className="col-span-full text-xl text-slate-500 dark:text-gray-400 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center">No properties found matching your criteria.</p>
              )}
              {loading && (
                <p className="col-span-full text-xl text-slate-500 dark:text-gray-400 text-center p-4">
                  Loading properties...
                </p>
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
                className="lg:w-[480px] xl:w-[540px] lg:sticky lg:top-24 lg:self-start drop-shadow-xl"
                style={{ height: 'calc(100vh - 120px)', minHeight: '480px' }}
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
