import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import SwiperCore from 'swiper'
import 'swiper/css/bundle'
import ListingItem from '../components/ListingItem'
import { useSelector } from 'react-redux'
import { usePersonalizedRecommendations } from '../hooks/usePersonalizedRecommendations'
import { FaHome, FaRobot, FaBalanceScale, FaChartLine, FaMapMarkedAlt, FaMagic, FaSearch, FaArrowRight } from 'react-icons/fa'

export default function Home() {
  const [offerListings, setOfferListings] = useState([])
  const [saleListings, setSaleListings] = useState([])
  const [rentListings, setRentListings] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useSelector((state) => state.user)
  const { recommendations, loading: recLoading } = usePersonalizedRecommendations()
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
      {/* top / hero */}
      <div className="dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#090e17] dark:to-[#111827] transition-colors duration-500 border-b border-transparent dark:border-white/5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col gap-8 pt-16 sm:pt-24 pb-24 sm:pb-32 px-4 sm:px-6 max-w-[1500px] mx-auto relative z-10 text-center sm:text-left">
          <h1 className="text-slate-900 dark:text-white font-extrabold text-4xl sm:text-5xl lg:text-7xl tracking-tight leading-[1.15] transition-colors animate-slide-up">
            Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 drop-shadow-sm">perfect</span>
            <br className="hidden sm:block" /> place with ease
          </h1>
          <div className="text-slate-600 dark:text-gray-400 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed font-medium animate-slide-up mx-auto sm:mx-0" style={{ animationDelay: '100ms' }}>
            Dwell Base is an AI-powered real estate platform designed to simplify property discovery, offering personalized recommendations and deep market insights.
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center sm:justify-start animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link
              to={'/search'}
              className="text-base text-white bg-slate-900 dark:bg-emerald-500/90 dark:hover:bg-emerald-400 hover:bg-slate-800 font-semibold px-8 py-4 rounded-xl w-full sm:w-auto text-center shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
              Browse Properties <FaArrowRight className="text-sm" />
            </Link>
            <Link
              to={'/advisor'}
              className="text-base text-slate-700 dark:text-gray-200 bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 font-semibold px-8 py-4 rounded-xl w-full sm:w-auto text-center shadow-md border border-gray-200 dark:border-white/10 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            >
              <FaRobot className="text-indigo-500" /> Try AI Advisor
            </Link>
          </div>
        </div>
      </div>

      {/* Section 2: Why Choose Dwell Base */}
      <div className="bg-slate-50 dark:bg-[#0b1120] py-20 px-4 transition-colors duration-500">
        <div className="max-w-[1500px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Why Choose Dwell Base</h2>
            <p className="text-slate-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">A smarter, data-driven approach to finding your next home.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cards */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaHome className="text-2xl text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">Smart Discovery</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">Search properties using traditional filters or advanced natural language queries.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group">
              <div className="bg-indigo-100 dark:bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaRobot className="text-2xl text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">AI Property Assistant</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">Receive intelligent recommendations and guidance through conversational AI.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group">
              <div className="bg-purple-100 dark:bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaBalanceScale className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">AI Comparison</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">Compare properties side-by-side and receive AI-backed analytical insights.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group">
              <div className="bg-blue-100 dark:bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaChartLine className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">Market Intelligence</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">Understand pricing and market positioning with instant AI market snapshots.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group">
              <div className="bg-amber-100 dark:bg-amber-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaMapMarkedAlt className="text-2xl text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">Interactive Maps</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">Explore listings visually across interactive geographic maps.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-lg border border-gray-200 dark:border-white/5 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-black/20 transition-all group">
              <div className="bg-rose-100 dark:bg-rose-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaMagic className="text-2xl text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-3">Personalization</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">Discover properties continuously tailored to your viewing and searching habits.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Platform Statistics */}
      <div className="border-y border-gray-200 dark:border-white/5 bg-white dark:bg-black/20 py-12 px-4">
        <div className="max-w-[1500px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-transparent md:divide-gray-200 dark:md:divide-white/10 text-center">
          <div>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">500+</p>
            <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Properties</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">50+</p>
            <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Localities</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">1000+</p>
            <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Searches</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-2">AI</p>
            <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Powered</p>
          </div>
        </div>
      </div>

      {/* Section 4: AI Capabilities Showcase */}
      <div className="bg-slate-50 dark:bg-[#0b1120] py-20 px-4 transition-colors duration-500">
        <div className="max-w-[1500px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Powered by Intelligence</h2>
              <p className="text-slate-600 dark:text-gray-400 max-w-2xl font-medium">Experience the next generation of real estate discovery with our suite of AI tools.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:-translate-y-1 transition-transform shadow-sm">
              <FaSearch className="text-emerald-500 text-2xl mb-4" />
              <h4 className="font-bold text-lg text-slate-800 dark:text-gray-100 mb-2">AI Search</h4>
              <p className="text-sm text-slate-500 dark:text-gray-400">Describe your ideal home in plain English. The AI understands complex requests instantly.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:-translate-y-1 transition-transform shadow-sm">
              <FaRobot className="text-indigo-500 text-2xl mb-4" />
              <h4 className="font-bold text-lg text-slate-800 dark:text-gray-100 mb-2">AI Advisor</h4>
              <p className="text-sm text-slate-500 dark:text-gray-400">Not sure where to live? Get personalized neighborhood recommendations based on your lifestyle.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:-translate-y-1 transition-transform shadow-sm">
              <FaBalanceScale className="text-purple-500 text-2xl mb-4" />
              <h4 className="font-bold text-lg text-slate-800 dark:text-gray-100 mb-2">AI Comparison</h4>
              <p className="text-sm text-slate-500 dark:text-gray-400">Select properties and let the AI generate a side-by-side analysis of strengths and weaknesses.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 p-6 rounded-2xl hover:-translate-y-1 transition-transform shadow-sm">
              <FaChartLine className="text-blue-500 text-2xl mb-4" />
              <h4 className="font-bold text-lg text-slate-800 dark:text-gray-100 mb-2">Market Snapshot</h4>
              <p className="text-sm text-slate-500 dark:text-gray-400">Every listing includes real-time AI market analysis checking price positioning and demand.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: CTA */}
      <div className="py-24 px-4 bg-white dark:bg-[#0f172a]">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-10 md:p-16 text-center shadow-lg dark:shadow-none">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6">Ready to find your next home?</h2>
          <p className="text-lg text-slate-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
            Join Dwell Base today and explore properties with the power of artificial intelligence and personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/search" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md hover:shadow-lg">
              Browse Properties
            </Link>
            <Link to="/advisor" className="bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 font-bold py-3 px-8 rounded-xl transition-colors shadow-sm hover:shadow-md">
              Try AI Advisor
            </Link>
          </div>
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

      <div className="max-w-7xl mx-auto p-4 flex flex-col gap-12 my-10 sm:my-20">
        
        {/* Personalized Recommendations Section */}
        {currentUser && (
          <div className="mb-8">
             <div className="my-3">
               <h2 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                  <span className="text-emerald-500">✨</span> Recommended For You
               </h2>
               <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 font-medium">
                  Based on your searches, wishlist, and browsing activity.
               </p>
             </div>
             
             {recLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-full aspect-[4/3] bg-slate-200 dark:bg-zinc-800/80 rounded-2xl animate-shimmer border border-transparent dark:border-white/5"></div>
                  ))}
                </div>
             ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                  {recommendations.map((listing) => (
                    <ListingItem listing={listing} key={listing._id} />
                  ))}
                </div>
             ) : (
                <div className="mt-4 p-8 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5">
                   <p className="text-slate-600 dark:text-gray-300 font-semibold mb-2">No recommendations yet</p>
                   <p className="text-slate-500 dark:text-gray-400 text-sm">Explore properties, save favorites, and run searches to receive personalized recommendations!</p>
                </div>
             )}
          </div>
        )}
        
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
