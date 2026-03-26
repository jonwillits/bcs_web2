'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuizQuestion } from './QuizQuestion';
import { MasteryFeedbackInline } from './MasteryFeedbackInline';
import { QuizTimer } from './QuizTimer';
import { QuizResults } from './QuizResults';
import { QuizReview } from './QuizReview';
import { QuizAttemptHistory } from './QuizAttemptHistory';
import { showAchievementsSequence } from '@/components/achievements/AchievementToast';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Brain, ClipboardCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuizTakerV2Props {
  quizId: string;
  quizType: string;
  moduleId: string;
  courseId?: string;
  onQuizComplete?: () => void;
}

type View = 'start' | 'taking' | 'results' | 'review' | 'history';

interface AnswerState {
  selected_option_ids: string[];
  question_instance_id: string;
  response_time_ms?: number;
  feedback?: {
    is_correct: boolean;
    explanations: Array<{
      optionText: string;
      isCorrect: boolean;
      explanation: string | null;
      wasSelected: boolean;
    }>;
  };
}

export function QuizTakerV2({ quizId, quizType, moduleId, courseId, onQuizComplete }: QuizTakerV2Props) {
  const [view, setView] = useState<View>('start');
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [attempts, setAttempts] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const isMastery = quizType === 'mastery_check';

  // Load quiz metadata + attempts
  useEffect(() => {
    async function load() {
      try {
        const [quizRes, attemptsRes] = await Promise.all([
          fetch(`/api/modules/${moduleId}/quiz?type=${quizType}`),
          fetch(`/api/quizzes/${quizId}/attempts`),
        ]);

        if (quizRes.ok) {
          const data = await quizRes.json();
          const q = data.quizzes?.find((q: any) => q.id === quizId);
          setQuiz(q);
        }

        if (attemptsRes.ok) {
          const data = await attemptsRes.json();
          setAttempts(data.attempts || []);
        }
      } catch {
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId, quizId, quizType]);

  // Auto-save every 30 seconds (assessment mode only)
  useEffect(() => {
    if (view !== 'taking' || !attempt || isMastery) return;

    autoSaveRef.current = setInterval(() => {
      saveAnswers();
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, attempt, isMastery]);

  // beforeunload save
  useEffect(() => {
    if (view !== 'taking' || !attempt) return;

    const handleBeforeUnload = () => { saveAnswers(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, attempt, answers]);

  const saveAnswers = useCallback(async () => {
    if (!attempt) return;
    const answerList = Object.entries(answers).map(([question_id, a]) => ({
      question_id,
      question_instance_id: a.question_instance_id,
      selected_option_ids: a.selected_option_ids,
      response_time_ms: a.response_time_ms,
    }));
    if (answerList.length === 0) return;

    try {
      await fetch(`/api/quizzes/${quizId}/attempts/${attempt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerList }),
      });
    } catch {
      // Silent fail for auto-save
    }
  }, [attempt, answers, quizId]);

  const startAttempt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to start quiz');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setAttempt(data.attempt);

      // Restore saved answers if resuming
      if (data.resumed && data.attempt.answers) {
        const restored: Record<string, AnswerState> = {};
        for (const a of data.attempt.answers) {
          restored[a.question_id] = {
            selected_option_ids: a.selected_option_ids || [],
            question_instance_id: a.question_instance_id,
          };
        }
        setAnswers(restored);
      }

      setCurrentStep(0);
      setView('taking');
    } catch {
      setError('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!attempt) return;
    await saveAnswers();

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/attempts/${attempt.id}/submit`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit quiz');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setResult(data);
      setView('results');
      onQuizComplete?.();

      if (data.xpAwarded > 0) {
        toast.success(`+${data.xpAwarded} XP earned!`);
      }

      if (data.achievements?.length > 0) {
        setTimeout(() => {
          showAchievementsSequence(data.achievements);
        }, 500);
      }
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    toast.warning('Time is up! Submitting your quiz...');
    submitQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const handleSelectOption = (questionId: string, instanceId: string, optionIds: string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selected_option_ids: optionIds,
        question_instance_id: instanceId,
      },
    }));
  };

  const handleResponseTime = (questionId: string, instanceId: string, timeMs: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        response_time_ms: timeMs,
        question_instance_id: instanceId,
      },
    }));
  };

  // Mastery: check answer via server-side endpoint for accurate grading
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const checkMasteryAnswer = async () => {
    if (!attempt) return;
    const instances = attempt.question_instances || [];
    const current = instances[currentStep];
    if (!current) return;

    const answer = answers[current.question_id];
    if (!answer || answer.selected_option_ids.length === 0) {
      toast.error('Please select an answer');
      return;
    }

    setCheckingAnswer(true);
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/attempts/${attempt.id}/check-answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_instance_id: current.id,
            selected_option_ids: answer.selected_option_ids,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to check answer');
        return;
      }

      const data = await res.json();

      setAnswers(prev => ({
        ...prev,
        [current.question_id]: {
          ...prev[current.question_id],
          feedback: {
            is_correct: data.is_correct,
            explanations: data.explanations.map((e: any) => ({
              optionText: e.optionText,
              isCorrect: e.isCorrect,
              explanation: e.explanation,
              wasSelected: e.wasSelected,
            })),
          },
        },
      }));
    } catch {
      toast.error('Failed to check answer');
    } finally {
      setCheckingAnswer(false);
    }
  };

  const loadAttemptReview = async (attemptId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setReviewData(data.attempt);
        setView('review');
      }
    } catch {
      toast.error('Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-neural-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quiz) return null;

  // ===== START VIEW =====
  if (view === 'start') {
    const completedAttempts = attempts.filter(a => a.status === 'submitted');
    const bestScore = completedAttempts.length > 0
      ? Math.max(...completedAttempts.filter(a => a.score != null).map(a => a.score), 0)
      : null;
    const hasPassed = completedAttempts.some(a => a.passed);
    const hasInProgress = attempts.some(a => a.status === 'in_progress');
    const maxReached = !isMastery && quiz.max_attempts > 0 && completedAttempts.length >= quiz.max_attempts && !hasInProgress;

    const totalQuestions = (quiz.blocks || []).reduce((sum: number, b: any) => sum + b.questions_to_pull, 0);

    return (
      <Card className="cognitive-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            {isMastery ? <Brain className="h-5 w-5 text-neural-primary" /> : <ClipboardCheck className="h-5 w-5 text-neural-primary" />}
            <CardTitle>{quiz.title}</CardTitle>
          </div>
          {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              {isMastery ? 'Mastery Check' : 'Assessment'}
            </Badge>
            <Badge variant="outline">~{totalQuestions} questions</Badge>
            {!isMastery && quiz.time_limit_minutes && (
              <Badge variant="outline">{quiz.time_limit_minutes} min</Badge>
            )}
            <Badge variant="outline">
              Pass: {isMastery ? quiz.mastery_threshold : quiz.pass_threshold}%
            </Badge>
            {!isMastery && quiz.max_attempts > 0 && (
              <Badge variant="outline">
                {completedAttempts.length}/{quiz.max_attempts} attempts
              </Badge>
            )}
          </div>

          {bestScore !== null && (
            <div className="text-sm">
              Best score: <span className={`font-bold ${hasPassed ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(bestScore)}%
              </span>
              {hasPassed && <span className="text-green-600 ml-1">
                ({isMastery ? 'Mastered' : 'Passed'})
              </span>}
            </div>
          )}

          <div className="flex gap-2">
            {!maxReached && (
              <NeuralButton variant="neural" onClick={startAttempt}>
                {hasInProgress ? 'Resume' : completedAttempts.length > 0 ? 'Retake' : 'Start'}
              </NeuralButton>
            )}
            {completedAttempts.length > 0 && (
              <NeuralButton variant="outline" onClick={() => setView('history')}>
                View History
              </NeuralButton>
            )}
          </div>

          {maxReached && (
            <p className="text-sm text-muted-foreground">Maximum attempts reached.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ===== TAKING VIEW =====
  if (view === 'taking' && attempt) {
    const instances = attempt.question_instances || [];

    if (isMastery) {
      // Step-by-step mastery mode
      const current = instances[currentStep];
      if (!current) return null;

      const currentAnswer = answers[current.question_id];
      const hasFeedback = !!currentAnswer?.feedback;
      const isLastQuestion = currentStep >= instances.length - 1;

      return (
        <Card className="cognitive-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-neural-primary" />
                <CardTitle className="text-base">{quiz.title}</CardTitle>
              </div>
              <Badge variant="outline">{currentStep + 1} / {instances.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuizQuestion
              instance={current}
              index={currentStep}
              questionType={current.question_type || 'multiple_choice'}
              selectedOptionIds={currentAnswer?.selected_option_ids || []}
              onSelectOption={handleSelectOption}
              onResponseTime={handleResponseTime}
              disabled={hasFeedback}
              showFeedback={hasFeedback}
            />

            {hasFeedback && currentAnswer.feedback && (
              <MasteryFeedbackInline
                isCorrect={currentAnswer.feedback.is_correct}
                explanations={currentAnswer.feedback.explanations}
              />
            )}

            <div className="flex justify-between pt-4 border-t">
              {!hasFeedback ? (
                <NeuralButton variant="neural" onClick={checkMasteryAnswer} disabled={checkingAnswer}>
                  {checkingAnswer ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Checking...</> : 'Check Answer'}
                </NeuralButton>
              ) : isLastQuestion ? (
                <NeuralButton variant="neural" onClick={submitQuiz} disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting...</> : 'Finish & Submit'}
                </NeuralButton>
              ) : (
                <NeuralButton variant="neural" onClick={() => setCurrentStep(s => s + 1)}>
                  Next Question
                </NeuralButton>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Assessment mode: show all questions at once
    const answeredCount = Object.keys(answers).filter(
      qid => answers[qid]?.selected_option_ids.length > 0
    ).length;

    return (
      <Card className="cognitive-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-neural-primary" />
              <CardTitle className="text-base">{quiz.title}</CardTitle>
            </div>
            {quiz.time_limit_minutes && attempt && (
              <QuizTimer
                timeLimitMinutes={quiz.time_limit_minutes}
                startedAt={attempt.started_at}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {answeredCount}/{instances.length} answered
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {instances.map((inst: any, i: number) => (
            <QuizQuestion
              key={inst.id}
              instance={inst}
              index={i}
              questionType={inst.question_type || 'multiple_choice'}
              selectedOptionIds={answers[inst.question_id]?.selected_option_ids || []}
              onSelectOption={handleSelectOption}
              onResponseTime={handleResponseTime}
            />
          ))}

          <div className="pt-4 border-t flex justify-end">
            <NeuralButton
              variant="neural"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Submit Quiz'}
            </NeuralButton>
          </div>

          <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Quiz?</DialogTitle>
                <DialogDescription>
                  Are you sure? You cannot change your answers after submission.
                  {answeredCount < instances.length && (
                    <span className="block mt-1 text-orange-600">
                      Warning: {instances.length - answeredCount} question(s) unanswered.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <NeuralButton variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</NeuralButton>
                <NeuralButton variant="neural" onClick={() => { setShowSubmitConfirm(false); submitQuiz(); }}>
                  Submit
                </NeuralButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // ===== RESULTS VIEW =====
  if (view === 'results' && result) {
    const canRetake = isMastery || quiz.max_attempts === 0 || attempts.length < quiz.max_attempts;
    const threshold = isMastery ? quiz.mastery_threshold : quiz.pass_threshold;

    return (
      <QuizResults
        score={result.score}
        pointsEarned={result.pointsEarned}
        pointsPossible={result.pointsPossible}
        passed={result.passed}
        passThreshold={threshold}
        xpAwarded={result.xpAwarded}
        hasUngraded={false}
        onReview={() => { if (attempt) loadAttemptReview(attempt.id); }}
        onRetake={canRetake ? () => {
          setAttempt(null);
          setAnswers({});
          setResult(null);
          setCurrentStep(0);
          setView('start');
          fetch(`/api/quizzes/${quizId}/attempts`)
            .then(r => r.json())
            .then(d => setAttempts(d.attempts || []));
        } : undefined}
      />
    );
  }

  // ===== REVIEW VIEW =====
  if (view === 'review' && reviewData) {
    const showCorrect = isMastery || quiz.feedback_depth !== 'score_only';

    // Build review answers from question instances + answers
    const reviewAnswers = (reviewData.question_instances || []).map((inst: any) => {
      const answer = (reviewData.answers || []).find((a: any) => a.question_id === inst.question_id);
      const options = (inst.options_snapshot as any[]).map((opt: any) => ({
        id: opt.id,
        option_text: opt.text,
        is_correct: showCorrect ? opt.is_correct : undefined,
      }));

      return {
        question_id: inst.question_id,
        selected_option_ids: answer?.selected_option_ids || [],
        is_correct: answer?.is_correct ?? null,
        points_earned: answer?.points_earned || 0,
        question: {
          question_text: inst.question_text_snapshot,
          question_type: 'multiple_choice',
          points: 1,
          explanation: quiz.feedback_depth === 'full'
            ? (inst.options_snapshot as any[])
                .filter((o: any) => o.is_correct && o.explanation)
                .map((o: any) => o.explanation)
                .join('; ') || null
            : null,
          options,
        },
      };
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Attempt {reviewData.attempt_number} Review
          </h3>
          <NeuralButton variant="outline" size="sm" onClick={() => setView('start')}>
            Back
          </NeuralButton>
        </div>
        <QuizReview answers={reviewAnswers} showCorrectAnswers={showCorrect} />
      </div>
    );
  }

  // ===== HISTORY VIEW =====
  if (view === 'history') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Attempt History</h3>
          <NeuralButton variant="outline" size="sm" onClick={() => setView('start')}>
            Back
          </NeuralButton>
        </div>
        <QuizAttemptHistory
          attempts={attempts}
          onSelectAttempt={loadAttemptReview}
        />
      </div>
    );
  }

  return null;
}
