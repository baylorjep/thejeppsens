import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BracketBuilder from '@/components/BracketBuilder';

export default function BracketPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen"
    >
      <Header />
      <BracketBuilder />
    </motion.main>
  );
} 