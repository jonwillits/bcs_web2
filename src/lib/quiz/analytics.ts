/**
 * Quiz V2 Analytics — Point-biserial correlation and item analysis
 */

interface ItemResponse {
  is_correct: boolean;
  total_score: number; // Overall quiz score for this attempt
}

/**
 * Point-biserial correlation coefficient
 * r_pbi = (M_correct - M_total) / S_total × √(p × q)
 *
 * Where:
 * - M_correct = mean total score of respondents who answered correctly
 * - M_total = mean total score of all respondents
 * - S_total = standard deviation of total scores
 * - p = proportion correct, q = 1 - p
 */
function pointBiserialCorrelation(responses: ItemResponse[]): number | null {
  if (responses.length < 30) return null;

  const totalScores = responses.map(r => r.total_score);
  const n = totalScores.length;

  // Mean total score
  const mTotal = totalScores.reduce((s, v) => s + v, 0) / n;

  // Standard deviation of total scores
  const variance = totalScores.reduce((s, v) => s + Math.pow(v - mTotal, 2), 0) / n;
  const sTotal = Math.sqrt(variance);

  if (sTotal === 0) return null;

  // Proportion correct
  const correctResponses = responses.filter(r => r.is_correct);
  const p = correctResponses.length / n;
  const q = 1 - p;

  if (p === 0 || p === 1) return null;

  // Mean total score of correct respondents
  const mCorrect = correctResponses.reduce((s, r) => s + r.total_score, 0) / correctResponses.length;

  const rpbi = ((mCorrect - mTotal) / sTotal) * Math.sqrt(p * q);
  return Math.round(rpbi * 1000) / 1000;
}

export interface ItemAnalysis {
  question_id: string;
  question_text: string;
  total_responses: number;
  correct_count: number;
  correct_rate: number;
  avg_response_time_ms: number | null;
  point_biserial: number | null;
  option_distribution: Array<{
    option_id: string;
    option_text: string;
    is_correct: boolean;
    selected_count: number;
    selected_pct: number;
  }>;
}

/**
 * Compute item analysis for a set of question responses
 */
export function computeItemAnalysis(
  questionId: string,
  questionText: string,
  responses: Array<{
    is_correct: boolean;
    total_score: number;
    response_time_ms: number | null;
    selected_option_ids: string[];
  }>,
  options: Array<{
    id: string;
    text: string;
    is_correct: boolean;
  }>
): ItemAnalysis {
  const totalResponses = responses.length;
  const correctCount = responses.filter(r => r.is_correct).length;
  const correctRate = totalResponses > 0 ? Math.round((correctCount / totalResponses) * 100) : 0;

  const responseTimes = responses
    .map(r => r.response_time_ms)
    .filter((t): t is number => t !== null);
  const avgResponseTimeMs = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
    : null;

  const pbResponses: ItemResponse[] = responses.map(r => ({
    is_correct: r.is_correct,
    total_score: r.total_score,
  }));
  const pbCorrelation = pointBiserialCorrelation(pbResponses);

  const optionDistribution = options.map(opt => {
    const selectedCount = responses.filter(r =>
      r.selected_option_ids.includes(opt.id)
    ).length;
    return {
      option_id: opt.id,
      option_text: opt.text,
      is_correct: opt.is_correct,
      selected_count: selectedCount,
      selected_pct: totalResponses > 0 ? Math.round((selectedCount / totalResponses) * 100) : 0,
    };
  });

  return {
    question_id: questionId,
    question_text: questionText,
    total_responses: totalResponses,
    correct_count: correctCount,
    correct_rate: correctRate,
    avg_response_time_ms: avgResponseTimeMs,
    point_biserial: pbCorrelation,
    option_distribution: optionDistribution,
  };
}
