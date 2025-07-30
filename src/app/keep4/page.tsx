import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Keep4Cut4 from '@/components/Keep4Cut4';

export default function Keep4Page() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen"
    >
      <Header />
      <Keep4Cut4 />
    </motion.main>
  );
} 