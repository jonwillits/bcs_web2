'use client';

import { toast } from 'sonner';
import { AchievementBadge } from './AchievementBadge';
import { Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  badge_color: 'gray' | 'bronze' | 'silver' | 'gold';
}

/**
 * Show achievement unlocked toast notification
 */
export function showAchievementToast(achievement: Achievement) {
  toast.custom(
    (t) => (
      <div
        className="bg-gradient-to-r from-neural-primary to-synapse-primary text-white rounded-lg shadow-2xl p-4 max-w-md w-full cursor-pointer transform transition-all duration-300 hover:scale-105"
        onClick={() => toast.dismiss(t)}
      >
        <div className="flex items-start gap-4">
          {/* Badge */}
          <div className="flex-shrink-0">
            <div className="relative">
              <AchievementBadge
                icon={achievement.icon}
                title={achievement.title}
                badgeColor={achievement.badge_color}
                isEarned={true}
                size="lg"
              />
              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 animate-bounce">
                <Sparkles className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                Achievement Unlocked!
              </span>
            </div>
            <h4 className="font-bold text-lg mb-1">{achievement.title}</h4>
            <p className="text-sm opacity-90 mb-2">{achievement.description}</p>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                <Sparkles className="inline h-3 w-3 mr-1" />
                +{achievement.xp_reward} XP
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 6000,
      position: 'top-center'
    }
  );
}

/**
 * Show multiple achievements in sequence
 */
export function showAchievementsSequence(achievements: Achievement[]) {
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      showAchievementToast(achievement);
    }, index * 1000); // Stagger by 1 second
  });
}

/**
 * Show level up notification
 */
export function showLevelUpToast(newLevel: number, xpRequired: number) {
  toast.custom(
    (t) => (
      <div
        className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white rounded-lg shadow-2xl p-4 max-w-md w-full cursor-pointer transform transition-all duration-300 hover:scale-105"
        onClick={() => toast.dismiss(t)}
      >
        <div className="text-center">
          <div className="text-6xl font-bold mb-2 animate-bounce">
            {newLevel}
          </div>
          <div className="text-2xl font-bold uppercase tracking-wider mb-1">
            Level Up!
          </div>
          <p className="text-sm opacity-90">
            You&apos;ve reached Level {newLevel}! Next level at {xpRequired} XP
          </p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center'
    }
  );
}
