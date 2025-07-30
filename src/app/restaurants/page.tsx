import { motion } from 'framer-motion';
import Header from '@/components/Header';
import RestaurantPicker from '@/components/RestaurantPicker';

export default function RestaurantsPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen"
    >
      <Header />
      <RestaurantPicker />
    </motion.main>
  );
} 