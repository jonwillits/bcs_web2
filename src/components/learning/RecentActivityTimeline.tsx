'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Activity {
  moduleId: string;
  moduleTitle: string;
  moduleSlug: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  completedAt: string | null;
}

interface RecentActivityTimelineProps {
  activities: Activity[];
}

export function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  const groupActivitiesByDate = (activities: Activity[]) => {
    const groups: { [key: string]: Activity[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    activities.forEach((activity) => {
      if (!activity.completedAt) return;

      const date = new Date(activity.completedAt);
      date.setHours(0, 0, 0, 0);

      let label: string;
      if (date.getTime() === today.getTime()) {
        label = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else if (date >= weekAgo) {
        label = 'This Week';
      } else {
        label = 'Earlier';
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(activity);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);
  const orderedLabels = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="cognitive-card">
      <CardContent className="p-6">
        <div className="space-y-6">
          {orderedLabels.map((label) => {
            const activitiesForLabel = groupedActivities[label];
            if (!activitiesForLabel || activitiesForLabel.length === 0) return null;

            return (
              <div key={label}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{label}</h3>
                <div className="space-y-3">
                  {activitiesForLabel.map((activity, index) => (
                    <div
                      key={`${activity.moduleId}-${index}`}
                      className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Completed{' '}
                          <Link
                            href={`/courses/${activity.courseSlug}/${activity.moduleSlug}`}
                            className="text-purple-600 hover:text-purple-700 hover:underline"
                          >
                            {activity.moduleTitle}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          in{' '}
                          <Link
                            href={`/courses/${activity.courseSlug}`}
                            className="text-muted-foreground hover:text-neural-primary hover:underline"
                          >
                            {activity.courseTitle}
                          </Link>
                        </p>
                        {activity.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(activity.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity yet</p>
            <p className="text-sm">Complete modules to see your progress here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
