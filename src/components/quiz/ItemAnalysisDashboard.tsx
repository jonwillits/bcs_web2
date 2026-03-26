'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ItemAnalysisDashboardProps {
  quizId: string;
}

export function ItemAnalysisDashboard({ quizId }: ItemAnalysisDashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-item-analysis', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/faculty/analytics/quiz/${quizId}/item-analysis`);
      if (!res.ok) throw new Error('Failed to fetch item analysis');
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

  if (!data?.items?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Not enough data for item analysis (minimum 30 responses needed)
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.items.map((item: any, i: number) => {
        const rpbi = item.point_biserial;
        const discriminationLabel = rpbi === null
          ? 'Insufficient data'
          : rpbi >= 0.3
          ? 'Good discrimination'
          : rpbi >= 0.1
          ? 'Fair discrimination'
          : 'Poor discrimination';

        const discriminationColor = rpbi === null
          ? 'text-gray-500'
          : rpbi >= 0.3
          ? 'text-green-600'
          : rpbi >= 0.1
          ? 'text-orange-600'
          : 'text-red-600';

        return (
          <Card key={item.question_id} className="cognitive-card">
            <CardContent className="p-4 space-y-3">
              {/* Question header */}
              <div className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground">Q{i + 1}</span>
                <p className="text-sm flex-1">{item.question_text}</p>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs">
                <div className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={
                      item.correct_rate >= 70
                        ? 'bg-green-50 text-green-700'
                        : item.correct_rate >= 40
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-red-50 text-red-700'
                    }
                  >
                    {item.correct_rate}% correct
                  </Badge>
                </div>
                <span className="text-muted-foreground">
                  {item.total_responses} responses
                </span>
                {item.avg_response_time_ms && (
                  <span className="text-muted-foreground">
                    Avg: {(item.avg_response_time_ms / 1000).toFixed(1)}s
                  </span>
                )}
                <span className={`flex items-center gap-1 ${discriminationColor}`}>
                  {rpbi !== null && rpbi >= 0.3 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : rpbi !== null && rpbi < 0.1 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {rpbi !== null ? `r=${rpbi.toFixed(3)}` : 'N/A'} - {discriminationLabel}
                </span>
              </div>

              {/* Option distribution */}
              <div className="space-y-1">
                {item.option_distribution?.map((opt: any) => (
                  <div key={opt.option_id} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      opt.is_correct ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0 truncate">{opt.option_text}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            opt.is_correct ? 'bg-green-400' : 'bg-gray-400'
                          }`}
                          style={{ width: `${opt.selected_pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right">{opt.selected_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
