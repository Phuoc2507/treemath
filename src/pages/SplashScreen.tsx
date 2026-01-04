import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Hand } from 'lucide-react';
import { useMeasurementStore } from '@/store/measurementStore';

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
      
      {/* Stars/particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          ĐO ĐẠC CÂY XANH
        </h1>

        <p className="text-muted-foreground text-lg mb-8 text-center">
          Chạm vào vòng tròn ở giữa để bắt đầu
        </p>

        {/* Tree SVG */}
        <div className="relative">
          <svg
            viewBox="0 0 200 300"
            className="w-48 h-72 md:w-64 md:h-96 animate-float"
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
                       w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm
                       flex items-center justify-center cursor-pointer
                       border-2 border-primary/50 hover:bg-primary/30 transition-colors"
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
            <Hand className="w-8 h-8 text-primary" />
          </motion.button>
        </div>

        {/* Instruction text */}
        <p className="text-muted-foreground mt-8 text-center animate-pulse">
          Chạm vào cây để bắt đầu
        </p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
