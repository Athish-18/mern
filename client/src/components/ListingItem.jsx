import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MdLocationOn } from 'react-icons/md'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { useSelector } from 'react-redux'

export default function ListingItem({ listing, initialFavorited = false }) {
  const { currentUser } = useSelector((state) => state.user)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  // Check actual favorite status from server on mount (survives refresh)
  useEffect(() => {
    if (!currentUser) return
    fetch(`/api/user/favorite/check/${listing._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.favorited !== undefined) setFavorited(data.favorited)
      })
      .catch(() => {})
  }, [listing._id, currentUser])

  const handleFavorite = async (e) => {
    e.preventDefault()   // stop the Link from navigating
    e.stopPropagation()
    if (!currentUser) return
    setLoading(true)
    try {
      const method = favorited ? 'DELETE' : 'POST'
      await fetch(`/api/user/favorite/${listing._id}`, { method })
      setFavorited(!favorited)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-800/90 shadow-md hover:shadow-xl dark:shadow-black/20 dark:hover:shadow-black/40 transition-all duration-300 overflow-hidden rounded-2xl w-full sm:w-[330px] relative group border border-transparent dark:border-white/5 hover:-translate-y-1">
      {/* Heart button */}
      {currentUser && (
        <button
          onClick={handleFavorite}
          disabled={loading}
          className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm dark:bg-zinc-900/80 rounded-full p-2 shadow-sm hover:scale-110 transition-transform border border-transparent dark:border-white/10"
          title={favorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          {favorited ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-gray-500 dark:text-gray-300 text-lg" />
          )}
        </button>
      )}

      <Link to={`/listing/${listing._id}`} className="block">
        <div className="relative overflow-hidden">
          <img
            src={
              listing.imageUrls[0] ||
              'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg'
            }
            alt="listing cover"
            className="h-[320px] sm:h-[220px] w-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-5 flex flex-col gap-3 w-full">
          <p className="truncate text-lg font-bold text-slate-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {listing.name}
          </p>
          <div className="flex items-center gap-1.5 mt-[-4px]">
            <MdLocationOn className="h-4 w-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 truncate w-full">
              {listing.address}
            </p>
          </div>
          <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
          <p className="text-slate-700 dark:text-emerald-400 mt-1 text-lg font-bold">
            ₹
            {listing.offer
              ? listing.discountPrice.toLocaleString('en-IN')
              : listing.regularPrice.toLocaleString('en-IN')}
            {listing.type === 'rent' && <span className="text-sm font-medium text-slate-500 dark:text-gray-400"> / month</span>}
          </p>
          <div className="text-slate-600 dark:text-gray-300 flex gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="font-semibold text-xs tracking-wide">
              {listing.bedrooms > 1
                ? `${listing.bedrooms} BEDS `
                : `${listing.bedrooms} BED `}
            </div>
            <div className="font-semibold text-xs tracking-wide">
              {listing.bathrooms > 1
                ? `${listing.bathrooms} BATHS `
                : `${listing.bathrooms} BATH `}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
