import { motion } from 'framer-motion';
import Header from '@/components/Header';
import MoviePicker from '@/components/MoviePicker';

export default function MoviesPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen"
    >
      <Header />
      <MoviePicker />
    </motion.main>
  );
} 