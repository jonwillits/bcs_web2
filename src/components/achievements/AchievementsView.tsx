'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementCard } from './AchievementCard';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Zap,
  Calendar,
  Target,
  Sparkles,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AchievementsViewProps {
  userId: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'speed' | 'consistency' | 'mastery';
  xpReward: number;
  badgeColor: 'gray' | 'bronze' | 'silver' | 'gold';
  isEarned: boolean;
  earnedAt: string | null;
  progress: number;
}

interface AchievementsData {
  userId: string;
  stats: {
    totalAchievements: number;
    earnedCount: number;
    completionPct: number;
    achievementXP: number;
    totalXP: number;
    level: number;
    currentStreak: number;
  };
  achievements: {
    completion: Achievement[];
    speed: Achievement[];
    consistency: Achievement[];
    mastery: Achievement[];
  };
  recentlyEarned: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    badgeColor: string;
    earnedAt: string;
  }>;
}

export function AchievementsView({ userId }: AchievementsViewProps) {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'completion' | 'speed' | 'consistency' | 'mastery'>('completion');

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const response = await fetch(`/api/achievements/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch achievements');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neural-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const categoryIcons = {
    completion: Target,
    speed: Zap,
    consistency: Calendar,
    mastery: Trophy
  };

  const categoryDescriptions = {
    completion: 'Complete modules and courses to earn these achievements',
    speed: 'Complete multiple modules quickly to unlock speed achievements',
    consistency: 'Learn consistently to build streaks and earn these badges',
    mastery: 'Master advanced content and reach milestones'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neural-primary mb-2">Achievements</h1>
        <p className="text-muted-foreground">
          Track your learning journey and unlock achievements as you progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">
                  {data.stats.earnedCount}/{data.stats.totalAchievements}
                </p>
              </div>
              <Award className="h-8 w-8 text-neural-primary" />
            </div>
            <Progress value={data.stats.completionPct} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {data.stats.completionPct}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold">{data.stats.totalXP.toLocaleString()}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.stats.achievementXP} XP from achievements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{data.stats.level}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Next level: {Math.pow(data.stats.level + 1, 2) * 100} XP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{data.stats.currentStreak} days</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep learning daily!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recently Earned */}
      {data.recentlyEarned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neural-primary" />
              Recently Earned
            </CardTitle>
            <CardDescription>
              Your latest achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recentlyEarned.map(achievement => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-neural-primary/50 transition-colors"
                >
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    +{achievement.xpReward} XP
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Categories - Underline Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto">
          {(Object.keys(categoryIcons) as Array<keyof typeof categoryIcons>).map(category => {
            const Icon = categoryIcons[category];
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category as any)}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeCategory === category
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active Category Content */}
      {(() => {
        const Icon = categoryIcons[activeCategory];
        const achievements = data.achievements[activeCategory];
        const earnedCount = achievements.filter(a => a.isEarned).length;

        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-neural-primary" />
                  {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Achievements
                </CardTitle>
                <CardDescription>
                  {categoryDescriptions[activeCategory]} • {earnedCount}/{achievements.length} earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map(achievement => (
                    <AchievementCard key={achievement.id} {...achievement} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
