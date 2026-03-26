'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { CheckCircle, XCircle, Trophy, Zap } from 'lucide-react';

interface QuizResultsProps {
  score: number;
  pointsEarned: number;
  pointsPossible: number;
  passed: boolean;
  passThreshold: number;
  xpAwarded: number;
  hasUngraded: boolean;
  onReview: () => void;
  onRetake?: () => void;
}

export function QuizResults({
  score,
  pointsEarned,
  pointsPossible,
  passed,
  passThreshold,
  xpAwarded,
  hasUngraded,
  onReview,
  onRetake,
}: QuizResultsProps) {
  return (
    <Card className="cognitive-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          {passed ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        <CardTitle className="text-2xl">
          {passed ? (hasUngraded ? 'Submitted' : 'Passed!') : 'Not Passed'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="text-center">
          <div className="text-4xl font-bold">
            {Math.round(score)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {pointsEarned} / {pointsPossible} points
          </p>
          <p className="text-xs text-muted-foreground">
            Pass threshold: {passThreshold}%
          </p>
        </div>

        {/* XP */}
        {xpAwarded > 0 && (
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-yellow-700">
              +{xpAwarded} XP
            </span>
          </div>
        )}

        {/* Ungraded notice */}
        {hasUngraded && (
          <div className="text-center">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Some answers pending manual review
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <NeuralButton variant="outline" onClick={onReview} className="flex-1">
            Review Answers
          </NeuralButton>
          {onRetake && (
            <NeuralButton variant="neural" onClick={onRetake} className="flex-1">
              Retake Quiz
            </NeuralButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
