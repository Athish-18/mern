import { FaSearch, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { toggleTheme } from '../redux/theme/themeSlice'

export default function Header() {
  const { currentUser } = useSelector((state) => state.user)
  const { theme } = useSelector((state) => state.theme)
  const dispatch = useDispatch()
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = (e) => {
    e.preventDefault()
    const urlParams = new URLSearchParams(location.search)
    urlParams.set('searchTerm', searchTerm)
    const searchQuery = urlParams.toString()
    navigate(`/search?${searchQuery}`)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const searchTermFromUrl = urlParams.get('searchTerm')
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl)
    }
  }, [location.search])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/35 border-b border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center max-w-6xl mx-auto px-4 sm:px-6 h-16">
        
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-1 group">
          <h1 className="font-bold text-xl sm:text-2xl tracking-tight flex flex-wrap">
            <span className="text-slate-600 dark:text-emerald-500 group-hover:text-emerald-400 drop-shadow-sm group-hover:drop-shadow-md transition-all">DWELL</span>
            <span className="text-slate-900 dark:text-gray-100">BASE</span>
          </h1>
        </Link>

        {/* Desktop Navigation & Search */}
        <div className="hidden sm:flex items-center gap-8 flex-1 justify-center">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-100/80 dark:bg-zinc-900/80 border border-transparent focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/10 px-4 py-2 rounded-full flex items-center transition-all duration-300 w-full max-w-[420px] group"
          >
            <input
              type="text"
              placeholder="Search properties..."
              className="bg-transparent focus:outline-none w-full text-slate-800 dark:text-gray-100 placeholder-slate-500 dark:placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="p-1 rounded-full text-slate-500 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">
              <FaSearch />
            </button>
          </form>

          <nav className="flex items-center gap-6">
            <Link to="/">
              <span className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</span>
            </Link>
            <Link to="/about">
              <span className="text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</span>
            </Link>
          </nav>
        </div>

        {/* Right Section: Theme Toggle & Profile */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all duration-200"
            onClick={() => dispatch(toggleTheme())}
            aria-label="Toggle Dark Mode"
          >
            {theme === 'light' ? <FaMoon size={16} /> : <FaSun size={18} className="text-yellow-400" />}
          </button>

          <div className="hidden sm:block">
            <Link to="/profile">
              {currentUser ? (
                <div className="p-1 rounded-full border-2 border-transparent hover:border-emerald-500 transition-all duration-300">
                  <img
                    className="rounded-full h-8 w-8 object-cover"
                    src={currentUser.avatar}
                    alt="profile"
                  />
                </div>
              ) : (
                <span className="text-sm font-medium bg-slate-900 dark:bg-emerald-500 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-emerald-600 transition-colors shadow-sm">
                  Sign in
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden text-slate-600 dark:text-gray-300 hover:text-emerald-500 transition-colors p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-80 border-b border-gray-200 dark:border-white/5' : 'max-h-0'
        }`}
      >
        <div className="px-4 pt-2 pb-6 flex flex-col gap-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-100 dark:bg-zinc-900 border border-transparent focus-within:border-emerald-500/50 px-4 py-3 rounded-full flex items-center transition-all duration-300 w-full"
          >
            <input
              type="text"
              placeholder="Search properties..."
              className="bg-transparent focus:outline-none w-full text-slate-800 dark:text-gray-100 placeholder-slate-500 dark:placeholder-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="text-slate-500 dark:text-gray-400">
              <FaSearch />
            </button>
          </form>
          
          <div className="flex flex-col gap-1 mt-2">
            <Link to="/" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-slate-700 dark:text-gray-200 font-medium transition-colors">
              Home
            </Link>
            <Link to="/about" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-slate-700 dark:text-gray-200 font-medium transition-colors">
              About
            </Link>
            <Link to="/profile" className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-slate-700 dark:text-gray-200 font-medium transition-colors flex items-center gap-3">
              {currentUser ? (
                <>
                  <img src={currentUser.avatar} alt="profile" className="w-6 h-6 rounded-full" />
                  Profile
                </>
              ) : (
                'Sign in'
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
