import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glow' | 'minimal';
  className?: string;
  showText?: boolean;
}

const AIBadge = ({ size = 'md', variant = 'default', className, showText = true }: AIBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    default: 'bg-primary/20 border-primary/40 text-primary',
    glow: 'bg-gradient-to-r from-primary/30 to-accent/30 border-primary/50 text-primary shadow-lg shadow-primary/20',
    minimal: 'bg-transparent border-transparent text-primary/80',
  };

  return (
    <motion.div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Sparkles className={iconSizes[size]} />
      </motion.div>
      {showText && <span>AI</span>}
    </motion.div>
  );
};

export default AIBadge;
