/**
 * Quiz V2 Grading Logic
 *
 * Question types: multiple_choice, multiple_select, true_false only.
 * All grading is all-or-nothing per question.
 * Supports weighted scoring and scoring procedures.
 */

interface OptionSnapshot {
  id: string;
  text: string;
  is_correct: boolean;
  explanation?: string | null;
}

interface QuestionInstance {
  id: string;
  question_id: string;
  weight: number;
  question_text_snapshot: string;
  options_snapshot: OptionSnapshot[];
}

interface AnswerInput {
  question_id: string;
  question_instance_id: string;
  selected_option_ids: string[];
}

export interface GradedAnswer {
  question_id: string;
  question_instance_id: string;
  is_correct: boolean;
  points_earned: number;
  weight: number;
}

/**
 * Grade a single answer against a question instance snapshot
 */
export function gradeAnswer(
  instance: QuestionInstance,
  answer: AnswerInput,
  points: number
): GradedAnswer {
  const options = instance.options_snapshot as OptionSnapshot[];
  const correctIds = new Set(options.filter(o => o.is_correct).map(o => o.id));
  const selectedIds = new Set(answer.selected_option_ids);

  // All-or-nothing: exact set match
  const isCorrect =
    correctIds.size === selectedIds.size &&
    [...correctIds].every(id => selectedIds.has(id));

  return {
    question_id: instance.question_id,
    question_instance_id: instance.id,
    is_correct: isCorrect,
    points_earned: isCorrect ? points : 0,
    weight: instance.weight,
  };
}

/**
 * Grade all answers for a quiz attempt using weighted scoring
 */
export function gradeAttempt(
  instances: QuestionInstance[],
  answers: AnswerInput[],
  questionPoints: Map<string, number> // question_id -> points
): {
  gradedAnswers: GradedAnswer[];
  pointsEarned: number;
  pointsPossible: number;
  rawScore: number;
  weightedScore: number;
} {
  const answerMap = new Map(answers.map(a => [a.question_id, a]));

  const gradedAnswers = instances.map(instance => {
    const answer = answerMap.get(instance.question_id);
    const pts = questionPoints.get(instance.question_id) || 1;
    if (!answer) {
      return {
        question_id: instance.question_id,
        question_instance_id: instance.id,
        is_correct: false,
        points_earned: 0,
        weight: instance.weight,
      };
    }
    return gradeAnswer(instance, answer, pts);
  });

  const pointsPossible = gradedAnswers.reduce(
    (sum, a) => sum + (questionPoints.get(a.question_id) || 1),
    0
  );
  const pointsEarned = gradedAnswers.reduce(
    (sum, a) => sum + a.points_earned,
    0
  );

  // Raw score (unweighted)
  const rawScore = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;

  // Weighted score: Σ(weight × points_earned) / Σ(weight × points_possible) × 100
  const weightedNumerator = gradedAnswers.reduce(
    (sum, a) => sum + a.weight * a.points_earned,
    0
  );
  const weightedDenominator = gradedAnswers.reduce(
    (sum, a) => sum + a.weight * (questionPoints.get(a.question_id) || 1),
    0
  );
  const weightedScore = weightedDenominator > 0
    ? (weightedNumerator / weightedDenominator) * 100
    : 0;

  return {
    gradedAnswers,
    pointsEarned,
    pointsPossible,
    rawScore: Math.round(rawScore * 100) / 100,
    weightedScore: Math.round(weightedScore * 100) / 100,
  };
}

/**
 * Apply scoring procedure across multiple attempt scores
 */
export function applyScoringProcedure(
  scores: number[],
  procedure: 'best' | 'last' | 'average_drop_n',
  dropCount: number = 0
): number {
  if (scores.length === 0) return 0;

  switch (procedure) {
    case 'best':
      return Math.max(...scores);

    case 'last':
      return scores[scores.length - 1];

    case 'average_drop_n': {
      if (scores.length <= dropCount) return 0;
      const sorted = [...scores].sort((a, b) => a - b);
      const kept = sorted.slice(dropCount);
      const avg = kept.reduce((sum, s) => sum + s, 0) / kept.length;
      return Math.round(avg * 100) / 100;
    }

    default:
      return Math.max(...scores);
  }
}

/**
 * Calculate XP for mastery check.
 * Award xp_reward on first mastery only. No XP on retakes.
 */
export function calculateMasteryXP(params: {
  baseXP: number;
  isMastered: boolean;
  previouslyMastered: boolean;
}): number {
  const { baseXP, isMastered, previouslyMastered } = params;
  if (!isMastered || previouslyMastered) return 0;
  return baseXP;
}

/**
 * Calculate XP for assessment.
 * Delta-only: only awards max(0, newXP - previousBestXP).
 */
export function calculateAssessmentXP(params: {
  baseXP: number;
  score: number;
  attemptNumber: number;
  previousBestXP: number;
}): number {
  const { baseXP, score, attemptNumber, previousBestXP } = params;

  let xp = Math.round((baseXP * score) / 100);

  // Perfect score bonus (1.5x)
  if (score === 100) {
    xp = Math.round(baseXP * 1.5);
  }

  // First attempt bonus (1.25x)
  if (attemptNumber === 1) {
    xp = Math.round(xp * 1.25);
  }

  // Delta-only
  return Math.max(0, xp - previousBestXP);
}
