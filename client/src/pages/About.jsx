import { FaSearch, FaRobot, FaBalanceScale, FaChartBar, FaMapMarkedAlt, FaMagic, FaReact, FaNodeJs, FaDatabase, FaCloud } from 'react-icons/fa';
import { SiTailwindcss, SiLeaflet, SiExpress } from 'react-icons/si';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-gray-200 transition-colors duration-500 pb-20">
      
      {/* Hero Section */}
      <div className="bg-white dark:bg-zinc-900/50 border-b border-gray-200 dark:border-white/5 pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
            About Dwell Base
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
            Dwell Base is an AI-powered real estate platform designed to simplify property discovery and decision-making. 
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-16 flex flex-col gap-24">
        
        {/* Introduction */}
        <section className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-lg leading-relaxed text-slate-700 dark:text-gray-300">
            The platform combines intelligent search, personalized recommendations, market insights, and interactive maps to help users find properties that match their exact needs.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-gray-300">
            Users can browse listings, compare properties side-by-side, analyze local market conditions, and receive highly tailored recommendations through a conversational AI assistant.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-gray-300">
            Built from the ground up using the modern MERN stack and advanced AI technologies, Dwell Base aims to create a smarter, more transparent, and frictionless real estate experience. Whether you are searching for a rental property, buying a new home, or exploring long-term investment opportunities, Dwell Base provides the intelligent tools necessary to support informed decisions.
          </p>
        </section>

        {/* Platform Highlights */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Platform Highlights</h2>
            <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <FaSearch className="text-3xl text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Property Discovery</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Advanced filtering and natural language processing to find exactly what you're looking for.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <FaRobot className="text-3xl text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">AI Search Assistant</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">A context-aware conversational assistant that remembers your preferences across queries.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <FaBalanceScale className="text-3xl text-purple-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Property Comparison</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Side-by-side analysis of listings with an AI-generated breakdown of strengths and weaknesses.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <FaChartBar className="text-3xl text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Market Insights</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Real-time AI market snapshots evaluating demand, rental appeal, and investment potential.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <FaMapMarkedAlt className="text-3xl text-amber-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Interactive Maps</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">Visual property exploration across the city using integrated geographic mapping.</p>
            </div>
            <div className="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <FaMagic className="text-3xl text-rose-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Personalization</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">A recommendation engine that learns from your views, comparisons, and wishlist activity.</p>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Technology Stack</h2>
            <div className="w-16 h-1 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <FaReact className="text-4xl text-[#61DAFB]" />
              <span className="font-semibold text-sm">React.js & Redux</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <SiTailwindcss className="text-4xl text-[#38B2AC]" />
              <span className="font-semibold text-sm">Tailwind CSS</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <FaNodeJs className="text-4xl text-[#339933]" />
              <span className="font-semibold text-sm">Node.js</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <SiExpress className="text-4xl text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm">Express.js</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <FaDatabase className="text-4xl text-[#47A248]" />
              <span className="font-semibold text-sm">MongoDB</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <FaCloud className="text-4xl text-blue-500" />
              <span className="font-semibold text-sm">Cloudinary</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <FaRobot className="text-4xl text-indigo-500" />
              <span className="font-semibold text-sm">Groq LLM</span>
            </div>
            <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <SiLeaflet className="text-4xl text-[#199900]" />
              <span className="font-semibold text-sm">Leaflet Maps</span>
            </div>
          </div>
        </section>

        {/* Project Vision */}
        <section className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-900/20 dark:to-emerald-900/20 border border-indigo-100 dark:border-indigo-500/20 p-8 sm:p-12 rounded-3xl text-center mb-10 shadow-lg shadow-indigo-500/5 dark:shadow-none">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">Why Dwell Base?</h2>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-gray-300 mb-4">
            The vision behind Dwell Base is to combine artificial intelligence and modern web technologies to make real estate discovery more accessible, personalized, and data-driven.
          </p>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-gray-300">
            Instead of relying solely on traditional checkboxes and sliders, users can interact naturally with the platform. You tell us your lifestyle needs, and Dwell Base delivers intelligent recommendations, explainable insights, and the deep market intelligence required to find your perfect place.
          </p>
        </section>

      </div>
    </div>
  );
}
