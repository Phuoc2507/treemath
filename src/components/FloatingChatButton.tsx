import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't show on chat screen itself
  if (location.pathname === '/chat') return null;

  const handleClick = () => {
    navigate('/chat');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-2 whitespace-nowrap"
          >
            <div className="bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-lg shadow-primary/10">
              <p className="text-sm text-foreground font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI Assistant
              </p>
              <p className="text-xs text-muted-foreground">Hỏi cách đo cây thông minh</p>
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-card border-r border-b border-primary/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-forest shadow-lg shadow-primary/30 flex items-center justify-center border-2 border-primary/50 hover:scale-110 transition-transform"
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
      >
        <Bot className="w-6 h-6 text-primary-foreground" />
        
        {/* AI Badge */}
        <motion.span 
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground border border-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.8 }}
        >
          AI
        </motion.span>
        
        {/* Subtle pulse ring - only animate once */}
        <motion.span 
          className="absolute inset-0 rounded-full bg-primary/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
      </motion.button>
    </div>
  );
};

export default FloatingChatButton;
