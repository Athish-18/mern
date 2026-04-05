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

  // ── AI Search ────────────────────────────────────────────────────────────
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

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

  // ── AI Search handler ─────────────────────────────────────────────────────
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.message || 'AI search failed')
        return
      }
      setListings(data.listings)
      setShowMore(false)
    } catch {
      setAiError('Network error — could not reach AI search.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* ── AI Search Bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
        }}
        className="w-full px-6 py-4 flex flex-col gap-2"
      >
        <div className="flex items-center gap-1 mb-1">
          <span style={{ fontSize: '18px' }}>✨</span>
          <span
            style={{
              background: 'linear-gradient(90deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.05em',
            }}
          >
            AI SEARCH
          </span>
        </div>
        <div className="flex gap-2 w-full">
          <input
            id="ai-search-input"
            type="text"
            placeholder='e.g. "2BHK under 20k in BTM with parking"'
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              color: '#f1f5f9',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '14px',
              flex: 1,
              outline: 'none',
            }}
          />
          <button
            id="ai-search-btn"
            onClick={handleAiSearch}
            disabled={aiLoading}
            style={{
              background: aiLoading
                ? '#4c1d95'
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s',
            }}
          >
            {aiLoading ? '⏳ Searching…' : '🔮 AI Search'}
          </button>
        </div>
        {aiError && (
          <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>
            ⚠ {aiError}
          </p>
        )}
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
