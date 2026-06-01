import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore from 'swiper'
import { useSelector, useDispatch } from 'react-redux'
import { Navigation } from 'swiper/modules'
import 'swiper/css/bundle'
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
} from 'react-icons/fa'
import Contact from '../components/Contact'
import ListingMap from '../components/ListingMap'
import MarketSnapshot from '../components/MarketSnapshot'
import { useCompare } from '../context/CompareContext'
import ListingItem from '../components/ListingItem'
import { recordInteraction } from '../redux/preferences/preferencesSlice'

// https://sabe.io/blog/javascript-format-numbers-commas#:~:text=The%20best%20way%20to%20format,format%20the%20number%20with%20commas.

export default function Listing() {
  SwiperCore.use([Navigation])
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contact, setContact] = useState(false)
  const params = useParams()
  const { currentUser } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const [insight, setInsight] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const { toggleCompare, compareListings } = useCompare()
  const isComparing = compareListings.some((l) => l._id === listing?._id)
  const [recommendations, setRecommendations] = useState([])
  const [recLoading, setRecLoading] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/listing/get/${params.listingId}`)
        const data = await res.json()
        if (data.success === false) {
          setError(true)
          setLoading(false)
          return
        }
        setListing(data)
        dispatch(recordInteraction({ listing: data, weight: 1 }))
        setLoading(false)
        setError(false)
      } catch (error) {
        setError(true)
        setLoading(false)
      }
    }
    fetchListing()
  }, [params.listingId])

  useEffect(() => {
    const fetchInsight = async () => {
      if (!listing) return
      try {
        setInsightLoading(true)
        const res = await fetch('/api/ai/insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: listing.name,
            address: listing.address,
            price: listing.offer ? listing.discountPrice : listing.regularPrice,
            type: listing.type,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            furnished: listing.furnished,
            parking: listing.parking,
          }),
        })
        const data = await res.json()
        setInsight(data.insight)
      } catch (err) {
        console.warn('Failed to fetch AI insight', err)
      } finally {
        setInsightLoading(false)
      }
    }
    fetchInsight()
  }, [listing])

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!listing) return
      try {
        setRecLoading(true)
        const res = await fetch(`/api/listing/recommendations/${listing._id}`)
        const data = await res.json()
        setRecommendations(data)
      } catch (err) {
        console.warn('Failed to fetch recommendations', err)
      } finally {
        setRecLoading(false)
      }
    }
    fetchRecommendations()
  }, [listing])

  return (
    <main>
      {loading && (
        <div className="animate-pulse w-full">
          {/* Main image skeleton */}
          <div className="h-[300px] sm:h-[400px] lg:h-[550px] w-full bg-slate-200 dark:bg-zinc-800"></div>
          
          <div className="flex flex-col max-w-4xl mx-auto w-full gap-4 p-3 mt-6">
            {/* Title & Price */}
            <div className="h-10 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-8 w-1/4 bg-slate-200 dark:bg-zinc-800 rounded-md mt-2"></div>
            
            {/* Address */}
            <div className="h-5 w-1/2 bg-slate-200 dark:bg-zinc-800 rounded mt-2"></div>
            
            {/* Amenities array */}
            <div className="flex gap-4 mt-4">
               <div className="h-6 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
               <div className="h-6 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
               <div className="h-6 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
            </div>
            
            {/* Description */}
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-full bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-4/5 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            </div>
            
            {/* Contact Section */}
            <div className="mt-8 h-12 w-full bg-slate-300 dark:bg-zinc-700 rounded-lg"></div>
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-4xl mx-auto p-8 mt-12 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-dashed border-red-300 dark:border-red-500/20 text-center animate-fade-in">
          <p className="text-2xl text-red-600 dark:text-red-400 font-medium">Failed to load property details.</p>
          <p className="text-base text-red-500/80 dark:text-red-300/80 mt-2">The property may have been removed, or there is a network issue.</p>
        </div>
      )}
      {listing && !loading && !error && (
        <div>
          <Swiper navigation>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <img
                  src={url}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/1200x600/png?text=Image+Not+Available';
                  }}
                  alt={listing.name}
                  className="w-full h-[300px] sm:h-[400px] lg:h-[550px] object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="fixed top-[13%] right-[3%] z-10 border dark:border-zinc-700 rounded-full w-12 h-12 flex justify-center items-center bg-slate-100 dark:bg-zinc-800 cursor-pointer">
            <FaShare
              className="text-slate-500 dark:text-gray-300"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                setTimeout(() => {
                  setCopied(false)
                }, 2000)
              }}
            />
          </div>
          {copied && (
            <p className="fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-100 dark:bg-zinc-800 dark:text-gray-200 p-2">
              Link copied!
            </p>
          )}
          <div className="flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-4 lg:my-7 gap-5">
            <p className="text-2xl font-semibold dark:text-gray-200">
              {listing.name} - ₹{' '}
              {listing.offer
                ? listing.discountPrice.toLocaleString('en-IN')
                : listing.regularPrice.toLocaleString('en-IN')}
              {listing.type === 'rent' && ' / month'}
            </p>
            <p className="flex items-center mt-6 gap-2 text-slate-600 dark:text-gray-400 text-sm">
              <FaMapMarkerAlt className="text-green-700" />
              {listing.address}
            </p>
            <div className="flex gap-4">
              <p className="bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md">
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
              {listing.offer && (
                <p className="bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md">
                  ₹{+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>
            
            {/* ── AI Insight Box ── */}
            <div className="bg-indigo-50 dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 rounded-lg p-4 mt-2 mb-2 shadow-sm flex gap-2 sm:gap-3 items-start relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                <div className="text-xl mt-0.5 shrink-0">✨</div>
                <div>
                   <p className="font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-2">
                       AI Property Insight 
                       {insightLoading && <span className="text-xs font-normal text-indigo-600 animate-pulse">Analyzing...</span>}
                   </p>
                   <p className="text-indigo-800 dark:text-gray-300 text-sm leading-relaxed">
                       {insight ? insight : (insightLoading ? 'Generating optimal insights for this listing...' : 'Insight unavailable.')}
                   </p>
                </div>
            </div>

            {/* ── AI Market Snapshot ── */}
            <MarketSnapshot listing={listing} />

            <p className="text-slate-800 dark:text-gray-300">
              <span className="font-semibold text-black dark:text-gray-200">Description - </span>
              {listing.description}
            </p>
            <ul className="text-green-900 dark:text-emerald-400 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6">
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaBed className="text-lg" />
                {listing.bedrooms > 1
                  ? `${listing.bedrooms} beds `
                  : `${listing.bedrooms} bed `}
              </li>
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaBath className="text-lg" />
                {listing.bathrooms > 1
                  ? `${listing.bathrooms} baths `
                  : `${listing.bathrooms} bath `}
              </li>
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaParking className="text-lg" />
                {listing.parking ? 'Parking spot' : 'No Parking'}
              </li>
              <li className="flex items-center gap-1 whitespace-nowrap ">
                <FaChair className="text-lg" />
                {listing.furnished ? 'Furnished' : 'Unfurnished'}
              </li>
            </ul>
            <div className="mt-6 rounded-lg overflow-hidden shadow">
              <ListingMap listing={listing} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full">
              {currentUser && listing.userRef !== currentUser._id && !contact && (
                <button
                  onClick={() => setContact(true)}
                  className="bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3 flex-1 font-semibold transition-opacity"
                >
                  Contact landlord
                </button>
              )}
              <button
                onClick={() => toggleCompare(listing)}
                className={`rounded-lg uppercase p-3 flex-1 font-bold transition-all border ${
                  isComparing
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                    : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-gray-200 border-gray-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-700'
                }`}
              >
                {isComparing ? '✓ Added to Compare' : '+ Compare Property'}
              </button>
            </div>
            {contact && <Contact listing={listing} />}

            {/* ── Recommendations Section ── */}
            {(recLoading || recommendations.length > 0) && (
              <div className="mt-12 mb-4 border-t border-gray-200 dark:border-white/10 pt-8 animate-fade-in">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-gray-100 mb-1">
                  You May Also Like
                </h2>
                <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm font-medium">
                  Similar properties based on this listing
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="w-full aspect-[4/3] sm:h-auto h-[300px] bg-slate-200 dark:bg-zinc-800/80 rounded-2xl animate-shimmer border border-transparent dark:border-white/5"></div>
                    ))
                  ) : (
                    recommendations.map(rec => (
                      <div key={rec._id} className="w-full">
                        <ListingItem listing={rec} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
