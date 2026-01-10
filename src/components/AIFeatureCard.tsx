import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  className?: string;
}

const AIFeatureCard = ({ icon: Icon, title, description, delay = 0, className }: AIFeatureCardProps) => {
  return (
    <motion.div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </motion.div>
  );
};

export default AIFeatureCard;
