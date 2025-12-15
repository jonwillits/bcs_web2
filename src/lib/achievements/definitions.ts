/**
 * Achievement Definitions
 *
 * This file contains all achievement definitions for the gamification system.
 * Achievements are organized by category and automatically checked when users
 * complete modules or reach milestones.
 */

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or lucide icon name
  category: 'completion' | 'speed' | 'consistency' | 'mastery';
  xp_reward: number;
  badge_color: 'gray' | 'bronze' | 'silver' | 'gold';
  criteria: {
    type: string;
    [key: string]: any;
  };
}

/**
 * All achievement definitions
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ============ COMPLETION ACHIEVEMENTS ============
  {
    id: 'first-module',
    title: 'First Steps',
    description: 'Complete your first module',
    icon: '🎯',
    category: 'completion',
    xp_reward: 50,
    badge_color: 'bronze',
    criteria: {
      type: 'modules_completed',
      count: 1
    }
  },
  {
    id: 'five-modules',
    title: 'On a Roll',
    description: 'Complete 5 modules',
    icon: '🔥',
    category: 'completion',
    xp_reward: 100,
    badge_color: 'bronze',
    criteria: {
      type: 'modules_completed',
      count: 5
    }
  },
  {
    id: 'ten-modules',
    title: 'Double Digits',
    description: 'Complete 10 modules',
    icon: '🌟',
    category: 'completion',
    xp_reward: 200,
    badge_color: 'silver',
    criteria: {
      type: 'modules_completed',
      count: 10
    }
  },
  {
    id: 'twenty-five-modules',
    title: 'Quarter Century',
    description: 'Complete 25 modules',
    icon: '💎',
    category: 'completion',
    xp_reward: 500,
    badge_color: 'gold',
    criteria: {
      type: 'modules_completed',
      count: 25
    }
  },
  {
    id: 'fifty-modules',
    title: 'Half Century',
    description: 'Complete 50 modules',
    icon: '👑',
    category: 'completion',
    xp_reward: 1000,
    badge_color: 'gold',
    criteria: {
      type: 'modules_completed',
      count: 50
    }
  },

  // ============ COURSE COMPLETION ============
  {
    id: 'first-course',
    title: 'Course Champion',
    description: 'Complete your first course',
    icon: '🏆',
    category: 'completion',
    xp_reward: 250,
    badge_color: 'silver',
    criteria: {
      type: 'courses_completed',
      count: 1
    }
  },
  {
    id: 'three-courses',
    title: 'Triple Threat',
    description: 'Complete 3 courses',
    icon: '🎖️',
    category: 'completion',
    xp_reward: 500,
    badge_color: 'gold',
    criteria: {
      type: 'courses_completed',
      count: 3
    }
  },
  {
    id: 'five-courses',
    title: 'Academic Achiever',
    description: 'Complete 5 courses',
    icon: '🏅',
    category: 'completion',
    xp_reward: 1000,
    badge_color: 'gold',
    criteria: {
      type: 'courses_completed',
      count: 5
    }
  },

  // ============ CONSISTENCY ACHIEVEMENTS ============
  {
    id: 'three-day-streak',
    title: 'Getting Consistent',
    description: 'Learn for 3 days in a row',
    icon: '📅',
    category: 'consistency',
    xp_reward: 100,
    badge_color: 'bronze',
    criteria: {
      type: 'streak',
      days: 3
    }
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Learn for 7 days in a row',
    icon: '🔥',
    category: 'consistency',
    xp_reward: 250,
    badge_color: 'silver',
    criteria: {
      type: 'streak',
      days: 7
    }
  },
  {
    id: 'two-week-streak',
    title: 'Fortnight Focus',
    description: 'Learn for 14 days in a row',
    icon: '⚡',
    category: 'consistency',
    xp_reward: 500,
    badge_color: 'gold',
    criteria: {
      type: 'streak',
      days: 14
    }
  },
  {
    id: 'month-streak',
    title: 'Monthly Dedication',
    description: 'Learn for 30 days in a row',
    icon: '💪',
    category: 'consistency',
    xp_reward: 1000,
    badge_color: 'gold',
    criteria: {
      type: 'streak',
      days: 30
    }
  },

  // ============ MASTERY ACHIEVEMENTS ============
  {
    id: 'perfect-course',
    title: 'Perfectionist',
    description: 'Complete a course with 100% completion',
    icon: '✨',
    category: 'mastery',
    xp_reward: 300,
    badge_color: 'silver',
    criteria: {
      type: 'perfect_course',
      completion_pct: 100
    }
  },
  {
    id: 'boss-slayer',
    title: 'Boss Slayer',
    description: 'Complete a boss-level module',
    icon: '⚔️',
    category: 'mastery',
    xp_reward: 200,
    badge_color: 'silver',
    criteria: {
      type: 'module_difficulty',
      difficulty: 'boss'
    }
  },
  {
    id: 'challenge-accepted',
    title: 'Challenge Accepted',
    description: 'Complete 5 challenge modules',
    icon: '🎯',
    category: 'mastery',
    xp_reward: 300,
    badge_color: 'gold',
    criteria: {
      type: 'challenge_modules_completed',
      count: 5
    }
  },

  // ============ SPEED ACHIEVEMENTS ============
  {
    id: 'quick-learner',
    title: 'Quick Learner',
    description: 'Complete 3 modules in one day',
    icon: '⏱️',
    category: 'speed',
    xp_reward: 150,
    badge_color: 'bronze',
    criteria: {
      type: 'modules_per_day',
      count: 3
    }
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 5 modules in one day',
    icon: '🚀',
    category: 'speed',
    xp_reward: 300,
    badge_color: 'silver',
    criteria: {
      type: 'modules_per_day',
      count: 5
    }
  },

  // ============ LEARNING PATH ACHIEVEMENTS ============
  {
    id: 'first-path',
    title: 'Path Walker',
    description: 'Complete your first learning path',
    icon: '🛤️',
    category: 'completion',
    xp_reward: 300,
    badge_color: 'silver',
    criteria: {
      type: 'learning_paths_completed',
      count: 1
    }
  },
  {
    id: 'three-paths',
    title: 'Path Master',
    description: 'Complete 3 learning paths',
    icon: '🗺️',
    category: 'completion',
    xp_reward: 750,
    badge_color: 'gold',
    criteria: {
      type: 'learning_paths_completed',
      count: 3
    }
  },

  // ============ CURRICULUM MAP ACHIEVEMENTS ============
  {
    id: 'prerequisite-chain',
    title: 'Chain Breaker',
    description: 'Complete a course with prerequisites',
    icon: '⛓️',
    category: 'mastery',
    xp_reward: 200,
    badge_color: 'silver',
    criteria: {
      type: 'prerequisite_chain_completed',
      min_prerequisites: 1
    }
  },
  {
    id: 'foundation-scholar',
    title: 'Foundation Scholar',
    description: 'Complete all foundation courses',
    icon: '🏛️',
    category: 'mastery',
    xp_reward: 500,
    badge_color: 'gold',
    criteria: {
      type: 'foundation_courses_completed'
    }
  },

  // ============ LEVEL MILESTONES ============
  {
    id: 'level-5',
    title: 'Level 5',
    description: 'Reach Level 5',
    icon: '5️⃣',
    category: 'mastery',
    xp_reward: 100,
    badge_color: 'bronze',
    criteria: {
      type: 'level_reached',
      level: 5
    }
  },
  {
    id: 'level-10',
    title: 'Level 10',
    description: 'Reach Level 10',
    icon: '🔟',
    category: 'mastery',
    xp_reward: 250,
    badge_color: 'silver',
    criteria: {
      type: 'level_reached',
      level: 10
    }
  },
  {
    id: 'level-25',
    title: 'Level 25',
    description: 'Reach Level 25',
    icon: '🌟',
    category: 'mastery',
    xp_reward: 500,
    badge_color: 'gold',
    criteria: {
      type: 'level_reached',
      level: 25
    }
  },
  {
    id: 'level-50',
    title: 'Level 50',
    description: 'Reach Level 50',
    icon: '👑',
    category: 'mastery',
    xp_reward: 1000,
    badge_color: 'gold',
    criteria: {
      type: 'level_reached',
      level: 50
    }
  }
];

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
}

/**
 * Get all achievements by category
 */
export function getAchievementsByCategory(category: AchievementDefinition['category']): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}
