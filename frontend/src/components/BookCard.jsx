import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function BookCard({ book, onBorrow, onReturn, onReserve, userRecords }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const resetMouse = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const myRecord = userRecords.find((r) => r.bookId === book.id && r.status === "BORROWED");
  const isBorrowedByMe = !!myRecord;
  const isAvailable = book.availableCopies > 0;

  const handleAction = async () => {
    setIsProcessing(true);
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
    try {
      if (isBorrowedByMe) {
        await onReturn(myRecord.id, idempotencyKey);
      } else if (isAvailable) {
        await onBorrow(book.id, idempotencyKey);
      } else {
        if(onReserve) await onReserve(book.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformPerspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={resetMouse}
      className="bg-white border border-slate-200 group relative overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 rounded-sm"
    >
      <div className="aspect-[2/3] w-full bg-slate-100 relative overflow-hidden border-b border-slate-100">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-sm">No cover image</div>
        )}
        
        <div className="absolute top-2 right-2 bg-white/90 border border-slate-200 rounded-sm px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm uppercase tracking-tight">
          {book.availableCopies} available
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between bg-white bg-opacity-50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-0.5 line-clamp-1 h3 font-serif group-hover:text-archive-blue transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-3">{book.author}</p>
        </div>

        <button
          onClick={handleAction}
          disabled={isProcessing}
          className={`w-full py-2 px-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center rounded-sm ${
            isBorrowedByMe
              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              : isAvailable
              ? "bg-white text-archive-blue border border-archive-blue hover:bg-archive-blue hover:text-white"
              : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          {isProcessing ? (
             <Loader2 className="w-4 h-4 animate-spin" />
          ) : isBorrowedByMe ? (
            "Return Item"
          ) : isAvailable ? (
            "Borrow Item"
          ) : (
            "Interested / Notify"
          )}
        </button>  
      </div>
    </motion.div>
  );
}
