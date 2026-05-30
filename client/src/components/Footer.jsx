import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaBuilding } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0b1120] border-t border-gray-200 dark:border-white/5 pt-16 pb-8 transition-colors duration-500">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <FaBuilding className="text-emerald-600 dark:text-emerald-500 text-2xl" />
              <h1 className="font-bold text-xl sm:text-2xl flex flex-wrap">
                <span className="text-slate-500 dark:text-gray-400 tracking-tight">Dwell</span>
                <span className="text-slate-800 dark:text-gray-100 tracking-tight">Base</span>
              </h1>
            </Link>
            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
              AI-powered real estate discovery platform. Smarter searches, intelligent insights, and personalized property matches.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <FaGithub size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-gray-200 mb-6 uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="/" className="text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">Home</Link>
              </li>
              <li>
                <Link to="/search" className="text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">Search</Link>
              </li>
              <li>
                <Link to="/advisor" className="text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">AI Advisor</Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">About</Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">Profile</Link>
              </li>
            </ul>
          </div>

          {/* AI Features */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-gray-200 mb-6 uppercase tracking-wider text-sm">AI Features</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Natural Language Search</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">AI Property Advisor</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Intelligent Comparison</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Market Insights</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Personalized Recommendations</span>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-gray-200 mb-6 uppercase tracking-wider text-sm">Technology</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">React & Tailwind CSS</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Node.js & Express</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">MongoDB</span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Groq LLM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-gray-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Dwell Base. All Rights Reserved.
          </p>
          <p className="text-slate-400 dark:text-gray-600 text-xs font-medium tracking-wide">
            Built with React, Node.js, MongoDB and AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
