import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Enjoy free shipping on orders above ₦75,000",
  "Lagos delivery in 1 to 3 days",
  "Pieces designed to work perfectly together"
];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]); // Reset timer when manually changed

  const next = () => setCurrentIndex((prev) => (prev + 1) % messages.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);

  return (
    <div className="bg-brand-charcoal text-brand-offwhite text-xs md:text-sm font-medium tracking-wide text-center py-2 px-4 md:px-8 relative overflow-hidden flex items-center justify-between">
      <button 
        onClick={prev} 
        className="p-1 hover:text-brand-taupe transition-colors focus:outline-none z-10"
        aria-label="Previous announcement"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex-1 relative h-5 overflow-hidden flex justify-center items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute whitespace-nowrap text-center w-full"
          >
            {messages[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <button 
        onClick={next} 
        className="p-1 hover:text-brand-taupe transition-colors focus:outline-none z-10"
        aria-label="Next announcement"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
