'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface ReviewAnswer {
  question_id: string;
  selected_option_ids: string[];
  is_correct: boolean | null;
  points_earned: number;
  question: {
    question_text: string;
    question_type: string;
    points: number;
    explanation: string | null;
    options: Array<{
      id: string;
      option_text: string;
      is_correct?: boolean;
    }>;
  };
}

interface QuizReviewProps {
  answers: ReviewAnswer[];
  showCorrectAnswers: boolean;
}

export function QuizReview({ answers, showCorrectAnswers }: QuizReviewProps) {
  return (
    <div className="space-y-4">
      {answers.map((answer, i) => {
        const q = answer.question;
        const icon =
          answer.is_correct === true ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          ) : answer.is_correct === false ? (
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          ) : (
            <MinusCircle className="h-5 w-5 text-orange-500 shrink-0" />
          );

        return (
          <Card key={answer.question_id} className="cognitive-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                {icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Q{i + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {answer.points_earned}/{q.points} pts
                    </Badge>
                    {answer.is_correct === null && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                        Pending review
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium mt-1">{q.question_text}</p>
                </div>
              </div>

              {/* Options with highlights */}
              <div className="ml-7 space-y-1.5">
                {q.options.map(opt => {
                  const wasSelected = answer.selected_option_ids.includes(opt.id);
                  const isCorrect = showCorrectAnswers && opt.is_correct;

                  let borderClass = 'border-gray-200';
                  if (wasSelected && answer.is_correct) {
                    borderClass = 'border-green-400 bg-green-50';
                  } else if (wasSelected && !answer.is_correct) {
                    borderClass = 'border-red-400 bg-red-50';
                  } else if (isCorrect) {
                    borderClass = 'border-green-400 bg-green-50/50';
                  }

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div
                        className={`flex items-center gap-2 p-2 rounded border text-sm ${borderClass}`}
                      >
                        {wasSelected ? (
                          answer.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )
                        ) : isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <span>{opt.option_text}</span>
                        {wasSelected && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            Your answer
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {showCorrectAnswers && q.explanation && (
                <div className="ml-7 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
