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
  SwiperCore.use([Navigation])
  console.log(offerListings)
  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=6')
        const data = await res.json()
        setOfferListings(data)
        fetchRentListings()
      } catch (error) {
        console.log(error)
      }
    }
    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=6')
        const data = await res.json()
        setRentListings(data)
        fetchSaleListings()
      } catch (error) {
        console.log(error)
      }
    }

    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=6')
        const data = await res.json()
        setSaleListings(data)
      } catch (error) {
        log(error)
      }
    }
    fetchOfferListings()
  }, [])
  return (
    <div>
      {/* top */}
      <div className="dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-black dark:to-[#111827] transition-colors duration-300 border-b border-transparent dark:border-white/5">
        <div className="flex flex-col gap-8 pt-20 pb-28 px-4 sm:px-6 max-w-6xl mx-auto">
          <h1 className="text-slate-800 dark:text-gray-100 font-bold text-4xl lg:text-7xl tracking-tight leading-[1.15] transition-colors">
            Find your next <span className="text-emerald-600 dark:text-emerald-400/90 drop-shadow-sm">perfect</span>
            <br />
            place with ease
          </h1>
          <div className="text-slate-500 dark:text-gray-400 text-sm sm:text-lg max-w-2xl leading-relaxed font-medium">
            Dwell Base by Strawhats is the premier platform to discover your ideal living space.
            <br className="hidden sm:block" />
            Explore our curated selection of properties and find a place that feels like home.
          </div>
          <Link
            to={'/search'}
            className="mt-2 text-sm sm:text-base text-white bg-slate-900 dark:bg-emerald-500/90 dark:hover:bg-emerald-400 hover:bg-slate-800 font-semibold px-8 py-3.5 rounded-full w-fit shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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
                className="h-[500px]"
                key={listing._id}
              ></div>
            </SwiperSlide>
          ))}
      </Swiper>

      {/* listing results for offer, sale and rent */}

      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
        {offerListings && offerListings.length > 0 && (
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
            <div className="flex flex-wrap gap-4">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {rentListings && rentListings.length > 0 && (
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
            <div className="flex flex-wrap gap-4">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {saleListings && saleListings.length > 0 && (
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
            <div className="flex flex-wrap gap-4">
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
