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
      <div
        className="w-full flex justify-center py-6 border-b"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
        }}
      >
        <div className="w-full max-w-4xl px-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✨</span>
                <span
                    style={{
                    background: 'linear-gradient(90deg, #818cf8, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700,
                    fontSize: '18px',
                    letterSpacing: '0.05em',
                    }}
                >
                    AI SEARCH ASSISTANT
                </span>
            </div>

            {/* Chat History Box */}
            <div 
                className="w-full flex flex-col gap-3 overflow-y-auto rounded-xl p-4 shadow-inner"
                style={{
                    maxHeight: '350px',
                    minHeight: '120px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid #334155'
                }}
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
            <div className="flex gap-2 w-full mt-2">
                <input
                    type="text"
                    placeholder='Type your message...'
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiChatSubmit()}
                    style={{
                        background: '#1e293b',
                        border: '1px solid #475569',
                        color: '#f1f5f9',
                        borderRadius: '24px',
                        padding: '12px 20px',
                        fontSize: '15px',
                        flex: 1,
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    }}
                />
                <button
                    onClick={handleAiChatSubmit}
                    disabled={aiLoading}
                    style={{
                        background: aiLoading
                            ? '#4c1d95'
                            : 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '24px',
                        padding: '0 24px',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: aiLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.2s, opacity 0.2s',
                    }}
                    onMouseEnter={(e) => !aiLoading && (e.target.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => !aiLoading && (e.target.style.transform = 'scale(1)')}
                >
                    {aiLoading ? '⏳' : 'Send'}
                </button>
            </div>
            {aiError && (
                <p style={{ color: '#f87171', fontSize: '13px', margin: 0, paddingLeft: '10px' }}>
                    ⚠ {aiError}
                </p>
            )}
        </div>
      </div>

      {/* ── Sidebar + Results layout ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row">
        <div className="p-7 border-b-2 md:border-r-2 md:min-h-screen">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap font-semibold">
                Search Term:
              </label>
              <input
                type="text"
                id="searchTerm"
                placeholder="Search..."
                className="border rounded-lg p-3 w-full"
                value={sidebardata.searchTerm}
                onChange={handleChange}
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <label className="font-semibold">Type:</label>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="all"
                  className="w-5"
                  onChange={handleChange}
                  checked={sidebardata.type === 'all'}
                />
                <span>Rent &amp; Sale</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="rent"
                  className="w-5"
                  onChange={handleChange}
                  checked={sidebardata.type === 'rent'}
                />
                <span>Rent</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="sale"
                  className="w-5"
                  onChange={handleChange}
                  checked={sidebardata.type === 'sale'}
                />
                <span>Sale</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="offer"
                  className="w-5"
                  onChange={handleChange}
                  checked={sidebardata.offer}
                />
                <span>Offer</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <label className="font-semibold">Amenities:</label>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="parking"
                  className="w-5"
                  onChange={handleChange}
                  checked={sidebardata.parking}
                />
                <span>Parking</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="furnished"
                  className="w-5"
                  onChange={handleChange}
                  checked={sidebardata.furnished}
                />
                <span>Furnished</span>
              </div>
            </div>
            {/* Price Range */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold">Price Range (₹):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="minPrice"
                  placeholder="Min"
                  value={sidebardata.minPrice}
                  onChange={handleChange}
                  min="0"
                  className="border rounded-lg p-2 w-full"
                />
                <span className="text-gray-500">–</span>
                <input
                  type="number"
                  id="maxPrice"
                  placeholder="Max"
                  value={sidebardata.maxPrice}
                  onChange={handleChange}
                  min="0"
                  className="border rounded-lg p-2 w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold">Sort:</label>
              <select
                onChange={handleChange}
                defaultValue={'created_at_desc'}
                id="sort_order"
                className="border rounded-lg p-3"
              >
                <option value="regularPrice_desc">Price high to low</option>
                <option value="regularPrice_asc">Price low to hight</option>
                <option value="createdAt_desc">Latest</option>
                <option value="createdAt_asc">Oldest</option>
              </select>
            </div>
            <button className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95">
              Search
            </button>
          </form>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-semibold border-b p-3 text-slate-700 mt-5">
            Listing results:
          </h1>

          <div className="flex flex-col lg:flex-row gap-4 p-4">
            {/* LEFT — listing cards (scrollable) */}
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto max-h-screen pr-1">
              {!loading && listings.length === 0 && (
                <p className="text-xl text-slate-700">No listing found!</p>
              )}
              {loading && (
                <p className="text-xl text-slate-700 text-center w-full">
                  Loading...
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
                  className="text-green-700 hover:underline p-7 text-center w-full"
                >
                  Show more
                </button>
              )}
            </div>

            {/* RIGHT — sticky map */}
            {!loading && listings.length > 0 && (
              <div
                className="lg:w-[480px] lg:sticky lg:top-20 lg:self-start"
                style={{ height: '80vh', minHeight: '480px' }}
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
