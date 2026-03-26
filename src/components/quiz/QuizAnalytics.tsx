'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { Loader2, Users, Target, Clock, BarChart3 } from 'lucide-react';
import { ItemAnalysisDashboard } from './ItemAnalysisDashboard';

interface QuizAnalyticsProps {
  quizId: string;
}

export function QuizAnalytics({ quizId }: QuizAnalyticsProps) {
  const [showItemAnalysis, setShowItemAnalysis] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-analytics', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/faculty/analytics/quiz/${quizId}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-neural-primary" />
      </div>
    );
  }

  if (!data) return null;

  const distributionLabels = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];
  const maxDistribution = Math.max(...(data.scoreDistribution || [1]));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="cognitive-card">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-neural-primary mb-1" />
            <div className="text-2xl font-bold">{data.uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card className="cognitive-card">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold">{data.avgScore}%</div>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
        <Card className="cognitive-card">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{data.passRate}%</div>
            <p className="text-xs text-muted-foreground">Pass Rate</p>
          </CardContent>
        </Card>
        <Card className="cognitive-card">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <div className="text-2xl font-bold">
              {data.avgTimeSeconds ? `${Math.round(data.avgTimeSeconds / 60)}m` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle className="text-sm">Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {distributionLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-neural-primary rounded-full transition-all"
                    style={{
                      width: maxDistribution > 0
                        ? `${((data.scoreDistribution?.[i] || 0) / maxDistribution) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {data.scoreDistribution?.[i] || 0}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Question Analysis */}
      <Card className="cognitive-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Question Analysis</CardTitle>
            <NeuralButton
              variant="outline"
              size="sm"
              onClick={() => setShowItemAnalysis(!showItemAnalysis)}
            >
              {showItemAnalysis ? 'Simple View' : 'Item Analysis'}
            </NeuralButton>
          </div>
        </CardHeader>
        <CardContent>
          {showItemAnalysis ? (
            <ItemAnalysisDashboard quizId={quizId} />
          ) : (
            <div className="space-y-3">
              {data.questionAnalysis?.map((q: any, i: number) => (
                <div key={q.questionId} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6">Q{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{q.questionText}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      q.correctRate >= 70
                        ? 'bg-green-50 text-green-700'
                        : q.correctRate >= 40
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-red-50 text-red-700'
                    }
                  >
                    {q.correctRate}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
