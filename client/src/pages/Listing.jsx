import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore from 'swiper'
import { useSelector } from 'react-redux'
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
  const [insight, setInsight] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)

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

  return (
    <main>
      {loading && <p className="text-center my-7 text-2xl">Loading...</p>}
      {error && (
        <p className="text-center my-7 text-2xl">Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          <Swiper navigation>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <div
                  className="h-[300px] sm:h-[400px] lg:h-[550px]"
                  style={{
                    background: `url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                ></div>
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
            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <button
                onClick={() => setContact(true)}
                className="bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3"
              >
                Contact landlord
              </button>
            )}
            {contact && <Contact listing={listing} />}
          </div>
        </div>
      )}
    </main>
  )
}
