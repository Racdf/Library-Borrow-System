import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, BookOpen, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar({ search, setSearch }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) return null;

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-[#003366] text-white py-3 px-6 shadow-md sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <BookOpen className="w-6 h-6 text-white" />
          <span className="font-bold text-xl tracking-tight">MyLib</span>
        </Link>

        <div className="flex-1 max-w-2xl relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400" />
          <input
            type="text"
            placeholder="Search the library..."
            value={search || ""}
            onChange={(e) => setSearch && setSearch(e.target.value)}
            className="w-full bg-[#002244] border border-[#004488] rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 transition-all"
          />
        </div>

        {user && (
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-300 hidden md:block">
                {user.name}
              </span>
              <button 
                onClick={logout}
                className="text-white hover:text-red-300 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
