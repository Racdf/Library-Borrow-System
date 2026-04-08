import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Loader2, BookOpen } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-archive-bg">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border border-slate-300 p-10 w-full max-w-md shadow-sm rounded-sm"
      >
        <div className="flex justify-center mb-6">
          <BookOpen className="w-12 h-12 text-archive-navy" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-center text-slate-900 h1">
          Sign In to MyLib
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          Please enter your credentials to access the archive.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-sm mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-sm px-4 py-2 text-slate-900 focus:outline-none focus:border-archive-blue transition-all"
              placeholder="reader@archive.org"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-sm px-4 py-2 text-slate-900 focus:outline-none focus:border-archive-blue transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full btn-primary py-3 font-bold text-base shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "LOG IN"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Not a member yet? <Link to="/signup" className="text-archive-blue hover:underline font-semibold">Join the library</Link>
        </p>
      </motion.div>
    </div>
  );
}
