import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import SwiperCore from 'swiper'
import 'swiper/css/bundle'
import ListingItem from '../components/ListingItem'

export default function Home() {
  const [offerListings, setOfferListings] = useState([])
  const [saleListings, setSaleListings] = useState([])
  const [rentListings, setRentListings] = useState([])
  const [loading, setLoading] = useState(true)
  SwiperCore.use([Navigation])
  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=8')
        const data = await res.json()
        setOfferListings(data)
        fetchRentListings()
      } catch (error) {
        console.log(error)
      }
    }
    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=8')
        const data = await res.json()
        setRentListings(data)
        fetchSaleListings()
      } catch (error) {
        console.log(error)
      }
    }

    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=8')
        const data = await res.json()
        setSaleListings(data)
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
    fetchOfferListings()
  }, [])
  return (
    <div className="animate-fade-in">
      {/* top */}
      <div className="dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-black dark:to-[#111827] transition-colors duration-500 border-b border-transparent dark:border-white/5">
        <div className="flex flex-col gap-8 pt-12 sm:pt-20 pb-20 sm:pb-28 px-4 sm:px-6 max-w-[1500px] mx-auto">
          <h1 className="text-slate-800 dark:text-gray-100 font-bold text-3xl sm:text-4xl lg:text-7xl tracking-tight leading-[1.15] transition-colors animate-slide-up">
            Find your next <span className="text-emerald-600 dark:text-emerald-400/90 drop-shadow-sm">perfect</span>
            <br />
            place with ease
          </h1>
          <div className="text-slate-500 dark:text-gray-400 text-sm sm:text-lg max-w-2xl leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '100ms' }}>
            Dwell Base by Strawhats is the premier platform to discover your ideal living space.
            <br className="hidden sm:block" />
            Explore our curated selection of properties and find a place that feels like home.
          </div>
          <Link
            to={'/search'}
            className="mt-2 text-sm sm:text-base text-white bg-slate-900 dark:bg-emerald-500/90 dark:hover:bg-emerald-400 hover:bg-slate-800 font-semibold px-8 py-3.5 rounded-full w-fit shadow-md hover:shadow-[0_8px_30px_rgba(16,185,129,0.25)] dark:hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 animate-slide-up" style={{ animationDelay: '200ms' }}
          >
            Let's get started
          </Link>
        </div>
      </div>

      {/* swiper */}
      <Swiper navigation>
        {offerListings &&
          offerListings.length > 0 &&
          offerListings.map((listing) => (
            <SwiperSlide>
              <div
                style={{
                  background: `url(${listing.imageUrls[0]}) center no-repeat`,
                  backgroundSize: 'cover',
                }}
                className="h-[300px] sm:h-[400px] md:h-[500px]"
                key={listing._id}
              ></div>
            </SwiperSlide>
          ))}
      </Swiper>

      {/* listing results for offer, sale and rent */}

      <div className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-16 my-8">
        {loading && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800/80 rounded animate-shimmer"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full aspect-[4/3] bg-slate-200 dark:bg-zinc-800/80 rounded-2xl animate-shimmer"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && offerListings && offerListings.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600 dark:text-gray-200">
                Recent offers
              </h2>
              <Link
                className="text-sm text-blue-800 dark:text-blue-400 hover:underline"
                to={'/search?offer=true'}
              >
                Show more offers
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {!loading && rentListings && rentListings.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600 dark:text-gray-200">
                Recent places for rent
              </h2>
              <Link
                className="text-sm text-blue-800 dark:text-blue-400 hover:underline"
                to={'/search?type=rent'}
              >
                Show more places for rent
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {!loading && saleListings && saleListings.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600 dark:text-gray-200">
                Recent places for sale
              </h2>
              <Link
                className="text-sm text-blue-800 dark:text-blue-400 hover:underline"
                to={'/search?type=sale'}
              >
                Show more places for sale
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
