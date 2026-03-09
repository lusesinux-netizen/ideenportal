import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'primary' | 'success' | 'accent';
}

const variantStyles = {
  default: 'bg-card shadow-card',
  primary: 'gradient-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  accent: 'gradient-accent text-accent-foreground',
};

const iconStyles = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
  accent: 'bg-accent-foreground/10 text-accent-foreground',
};

export default function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-5 ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>
            {title}
          </p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {description && (
            <p className={`mt-1 text-xs ${variant === 'default' ? 'text-muted-foreground' : 'opacity-70'}`}>
              {description}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
