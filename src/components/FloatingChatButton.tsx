import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

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
            <div className="bg-card border border-border/50 rounded-lg px-3 py-2 shadow-lg">
              <p className="text-sm text-foreground font-medium">Cần hướng dẫn đo?</p>
              <p className="text-xs text-muted-foreground">Chat với trợ lý AI</p>
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-forest shadow-lg flex items-center justify-center border-2 border-primary/50 hover:scale-110 transition-transform"
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      </motion.button>
    </div>
  );
};

export default FloatingChatButton;
