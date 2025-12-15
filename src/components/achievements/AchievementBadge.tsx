import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface AchievementBadgeProps {
  icon: string;
  title: string;
  badgeColor: 'gray' | 'bronze' | 'silver' | 'gold';
  isEarned: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeColorClasses = {
  gray: {
    border: 'border-gray-300',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    glow: ''
  },
  bronze: {
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    glow: 'shadow-orange-200'
  },
  silver: {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    glow: 'shadow-slate-200'
  },
  gold: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    glow: 'shadow-yellow-200'
  }
};

const sizeClasses = {
  sm: {
    container: 'w-12 h-12',
    icon: 'text-xl',
    lock: 'h-4 w-4'
  },
  md: {
    container: 'w-16 h-16',
    icon: 'text-2xl',
    lock: 'h-5 w-5'
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'text-3xl',
    lock: 'h-6 w-6'
  }
};

export function AchievementBadge({
  icon,
  title,
  badgeColor,
  isEarned,
  size = 'md',
  className
}: AchievementBadgeProps) {
  const colorClasses = badgeColorClasses[badgeColor];
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={cn(
        'relative rounded-full border-2 flex items-center justify-center transition-all duration-300',
        sizeClass.container,
        isEarned ? [
          colorClasses.border,
          colorClasses.bg,
          'shadow-lg',
          colorClasses.glow
        ] : [
          'border-gray-200',
          'bg-gray-100',
          'opacity-40',
          'grayscale'
        ],
        className
      )}
      title={title}
    >
      {isEarned ? (
        <span className={cn('font-bold', sizeClass.icon)}>
          {icon}
        </span>
      ) : (
        <Lock className={cn('text-gray-400', sizeClass.lock)} />
      )}
    </div>
  );
}
