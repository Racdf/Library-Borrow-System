import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import BookCard from "../components/BookCard";
import { Loader2, BookOpen } from "lucide-react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard({ globalSearch = "" }) {
  const { user, API_URL } = useAuth();
  const [books, setBooks] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("catalog");
  
  const gridRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [booksRes, recordsRes] = await Promise.all([
        axios.get(`${API_URL}/books?q=${encodeURIComponent(globalSearch)}`),
        user ? axios.get(`${API_URL}/books/my-records`) : Promise.resolve({ data: [] })
      ]);
      setBooks(booksRes.data);
      setRecords(recordsRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, user, globalSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "catalog" && !loading && books.length > 0 && gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.6, ease: "power3.out", clearProps: "all" }
      );
    }
  }, [books, loading, activeTab]);

  const handleBorrow = async (bookId, idempotencyKey) => {
    try {
      await axios.post(`${API_URL}/books/borrow`, { bookId }, { headers: { "Idempotency-Key": idempotencyKey } });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to borrow book");
    }
  };

  const handleReturn = async (recordId, idempotencyKey) => {
    try {
      await axios.post(`${API_URL}/books/return`, { recordId }, { headers: { "Idempotency-Key": idempotencyKey } });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to return book");
    }
  };

  const handleReserve = async (bookId) => {
    try {
      await axios.post(`${API_URL}/books/reserve`, { bookId });
      alert("Successfully waitlisted! You'll be notified when it returns.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to join waitlist");
    }
  };

  if (loading && books.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const totalFines = records.reduce((acc, r) => acc + (r.fineAmount || 0), 0);
  const activeLoans = records.filter(r => r.status === "BORROWED");

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      
      <div className="flex border-b border-slate-300 mb-10">
        <button 
          className={`px-8 py-3 font-semibold transition-all border-b-4 ${activeTab === 'catalog' ? 'border-archive-blue text-archive-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('catalog')}
        >
          COLLECTION
        </button>
        <button 
          className={`px-8 py-3 font-semibold transition-all border-b-4 ${activeTab === 'dashboard' ? 'border-archive-blue text-archive-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          My RECORDS
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "catalog" && (
          <motion.div 
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {books.map((book) => (
                <div key={book.id}>
                  <BookCard 
                    book={book} 
                    onBorrow={handleBorrow} 
                    onReturn={handleReturn}
                    onReserve={handleReserve}
                    userRecords={records}
                  />
                </div>
              ))}
            </div>

            {books.length === 0 && !loading && (
              <div className="text-center text-slate-500 py-20 bg-white border border-slate-200 rounded-sm">
                No items found matching your search in the MyLib collection.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Loans</p>
                <div className="text-3xl font-bold text-slate-900 mt-2">{activeLoans.length} <span className="text-sm font-normal text-slate-400">/ 5 limit</span></div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                <p className="text-xs text-archive-blue font-bold uppercase tracking-widest">Library Credit</p>
                <div className="text-3xl font-bold text-slate-900 mt-2">₹{totalFines} <span className="text-sm font-normal text-slate-400">due</span></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-archive-navy" />
                 <h2 className="text-lg font-bold text-slate-900 h2">Your Lending History</h2>
               </div>
               
               {records.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">You have no active or past loans in your account.</div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-600">
                     <thead className="text-xs uppercase bg-slate-100/50 text-slate-500 border-b border-slate-200">
                       <tr>
                         <th className="px-6 py-4 font-bold">Item Title</th>
                         <th className="px-6 py-4 font-bold">Loan Date</th>
                         <th className="px-6 py-4 font-bold">Due Date</th>
                         <th className="px-6 py-4 font-bold">Status</th>
                         <th className="px-6 py-4 font-bold">Fines</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {records.map(record => {
                          const isOverdue = record.status === 'BORROWED' && new Date(record.dueDate) < new Date();
                          return (
                           <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4 font-semibold text-slate-900">{record.title}</td>
                             <td className="px-6 py-4">{new Date(record.borrowDate).toLocaleDateString()}</td>
                             <td className={`px-6 py-4 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                               {new Date(record.dueDate).toLocaleDateString()}
                             </td>
                             <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-tight ${
                                 record.status === 'RETURNED' ? 'bg-green-100 text-green-700' 
                                 : isOverdue ? 'bg-red-100 text-red-700' 
                                 : 'bg-blue-100 text-blue-700'
                               }`}>
                                 {isOverdue ? 'OVERDUE' : record.status}
                               </span>
                             </td>
                             <td className="px-6 py-4">
                               {record.fineAmount > 0 ? (
                                 <span className="text-red-600 font-bold">₹{record.fineAmount}</span>
                               ) : (
                                 <span className="text-slate-400">-</span>
                               )}
                             </td>
                           </tr>
                          )
                       })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
