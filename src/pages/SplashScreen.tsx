import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Hand, Sparkles, ScanEye, Bot } from 'lucide-react';
import { useMeasurementStore } from '@/store/measurementStore';
import AIBadge from '@/components/AIBadge';
import AIFeatureCard from '@/components/AIFeatureCard';

const SplashScreen = () => {
  const navigate = useNavigate();
  const reset = useMeasurementStore((state) => state.reset);

  const handleClick = () => {
    reset(); // Clear all previous data when starting new flow
    navigate('/map');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-tree-green-dark/20" />
      
      {/* AI Neural network effect - floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.8, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Connection lines between particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              width: `${50 + Math.random() * 100}px`,
              rotate: `${Math.random() * 180}deg`,
            }}
            animate={{
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-4"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* AI Badge - top */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3"
        >
          <AIBadge size="lg" variant="glow" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          ĐO ĐẠC CÂY XANH
        </h1>
        
        {/* AI Tagline */}
        <motion.p 
          className="text-primary font-medium text-sm sm:text-base mb-2 flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          Ứng dụng AI đo cây thông minh
        </motion.p>

        <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 text-center">
          Chạm vào vòng tròn ở giữa để bắt đầu
        </p>

        {/* Tree SVG */}
        <div className="relative">
          {/* AI Glow ring around tree */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          <svg
            viewBox="0 0 200 300"
            className="w-44 h-64 sm:w-56 sm:h-80 md:w-64 md:h-96 animate-float relative z-10"
            aria-label="Minh hoạ cây xanh"
            role="img"
          >
            {/* Tree trunk */}
            <rect
              x="85"
              y="200"
              width="30"
              height="80"
              rx="5"
              className="fill-amber-800"
            />

            {/* Tree crown layers */}
            <ellipse
              cx="100"
              cy="180"
              rx="60"
              ry="40"
              className="fill-tree-green-dark"
            />
            <ellipse
              cx="100"
              cy="140"
              rx="50"
              ry="35"
              className="fill-primary"
            />
            <ellipse
              cx="100"
              cy="105"
              rx="40"
              ry="30"
              className="fill-tree-green-light"
            />
            <ellipse
              cx="100"
              cy="75"
              rx="25"
              ry="20"
              className="fill-primary"
            />
          </svg>

          {/* Clickable hand indicator */}
          <motion.button
            onClick={handleClick}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-primary/20 backdrop-blur-sm
                       flex items-center justify-center cursor-pointer
                       border-2 border-primary/50 hover:bg-primary/30 transition-colors z-20"
            style={{ width: '72px', height: '72px' }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Hand className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </motion.button>
        </div>

        {/* Instruction text */}
        <p className="text-muted-foreground mt-6 sm:mt-8 text-center text-sm sm:text-base animate-pulse">
          Chạm vào cây để bắt đầu
        </p>

        {/* AI Feature Cards */}
        <div className="mt-6 sm:mt-8 w-full max-w-sm sm:max-w-md space-y-3 sm:space-y-4">
          <AIFeatureCard
            icon={ScanEye}
            title="AI Vision"
            description="Nhận diện & đo cây từ ảnh"
            delay={0.4}
          />
          <AIFeatureCard
            icon={Bot}
            title="AI Assistant"
            description="Hướng dẫn đo cây thông minh"
            delay={0.5}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
