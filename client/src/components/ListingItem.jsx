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
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px] relative">
      {/* Heart button */}
      {currentUser && (
        <button
          onClick={handleFavorite}
          disabled={loading}
          className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 rounded-full p-1.5 shadow hover:scale-110 transition-transform"
          title={favorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          {favorited ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-gray-500 text-lg" />
          )}
        </button>
      )}

      <Link to={`/listing/${listing._id}`}>
        <img
          src={
            listing.imageUrls[0] ||
            'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg'
          }
          alt="listing cover"
          className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-scale duration-300"
        />
        <div className="p-3 flex flex-col gap-2 w-full">
          <p className="truncate text-lg font-semibold text-slate-700">
            {listing.name}
          </p>
          <div className="flex items-center gap-1">
            <MdLocationOn className="h-4 w-4 text-green-700" />
            <p className="text-sm text-gray-600 truncate w-full">
              {listing.address}
            </p>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>
          <p className="text-slate-500 mt-2 font-semibold ">
            ₹
            {listing.offer
              ? listing.discountPrice.toLocaleString('en-IN')
              : listing.regularPrice.toLocaleString('en-IN')}
            {listing.type === 'rent' && ' / month'}
          </p>
          <div className="text-slate-700 flex gap-4">
            <div className="font-bold text-xs">
              {listing.bedrooms > 1
                ? `${listing.bedrooms} beds `
                : `${listing.bedrooms} bed `}
            </div>
            <div className="font-bold text-xs">
              {listing.bathrooms > 1
                ? `${listing.bathrooms} baths `
                : `${listing.bathrooms} bath `}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
