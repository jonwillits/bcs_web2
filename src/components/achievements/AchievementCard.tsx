import { Card, CardContent } from '@/components/ui/card';
import { AchievementBadge } from './AchievementBadge';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'speed' | 'consistency' | 'mastery';
  xpReward: number;
  badgeColor: 'gray' | 'bronze' | 'silver' | 'gold';
  isEarned: boolean;
  earnedAt?: string | null;
  progress?: number;
}

const categoryLabels = {
  completion: 'Completion',
  speed: 'Speed',
  consistency: 'Consistency',
  mastery: 'Mastery'
};

const categoryColors = {
  completion: 'bg-blue-100 text-blue-800 border-blue-200',
  speed: 'bg-purple-100 text-purple-800 border-purple-200',
  consistency: 'bg-green-100 text-green-800 border-green-200',
  mastery: 'bg-amber-100 text-amber-800 border-amber-200'
};

export function AchievementCard({
  title,
  description,
  icon,
  category,
  xpReward,
  badgeColor,
  isEarned,
  earnedAt,
  progress = 0
}: AchievementCardProps) {
  const formattedDate = earnedAt ? new Date(earnedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : null;

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
      isEarned ? 'border-2 border-neural-primary/20' : 'opacity-70'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Badge */}
          <AchievementBadge
            icon={icon}
            title={title}
            badgeColor={badgeColor}
            isEarned={isEarned}
            size="lg"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className={cn(
                  'font-semibold text-lg',
                  isEarned ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Badge
                variant="outline"
                className={cn('text-xs', categoryColors[category])}
              >
                {categoryLabels[category]}
              </Badge>

              <Badge
                variant="outline"
                className="text-xs bg-purple-50 text-purple-700 border-purple-200"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                +{xpReward} XP
              </Badge>

              {isEarned && formattedDate && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {formattedDate}
                </Badge>
              )}
            </div>

            {/* Progress bar for partially completed achievements */}
            {!isEarned && progress > 0 && progress < 100 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neural-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Earned indicator */}
        {isEarned && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              EARNED
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
