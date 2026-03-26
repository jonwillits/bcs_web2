/**
 * Zod validation schemas for Quiz V2 API routes
 */

import { z } from 'zod';

// ==================== Question Bank Schemas ====================

export const updateBankSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
});

// ==================== Question Set Schemas ====================

export const createSetSchema = z.object({
  title: z.string().min(1, 'Set title is required').max(200),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
});

export const updateSetSchema = createSetSchema.partial();

export const reorderSetsSchema = z.object({
  setIds: z.array(z.string()).min(1),
});

export const addQuestionsToSetSchema = z.object({
  question_ids: z.array(z.string()).min(1),
});

// ==================== Bank Question Schemas ====================

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  option_text: z.string().min(1, 'Option text is required'),
  is_correct: z.boolean().default(false),
  explanation: z.string().nullable().optional(),
  sort_order: z.number().int().min(0),
});

export const createQuestionSchema = z.object({
  question_type: z.enum(['multiple_choice', 'multiple_select', 'true_false']),
  question_text: z.string().min(1, 'Question text is required'),
  image_url: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  points: z.number().int().min(1).default(1),
  shuffle_answers: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  options: z.array(questionOptionSchema).min(2, 'At least 2 options required'),
});

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  options: z.array(questionOptionSchema).optional(),
});

// ==================== Quiz Schemas ====================

export const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().nullable().optional(),
  quiz_type: z.enum(['mastery_check', 'module_assessment']),
  status: z.enum(['draft', 'published']).default('draft'),
  xp_reward: z.number().int().min(0).max(10000).default(50),
  randomize_blocks: z.boolean().default(false),

  // Assessment-only settings
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  max_attempts: z.number().int().min(0).default(0),
  pass_threshold: z.number().int().min(0).max(100).default(70),
  scoring_procedure: z.enum(['best', 'last', 'average_drop_n']).default('best'),
  scoring_drop_count: z.number().int().min(0).default(0),
  feedback_timing: z.enum(['per_question', 'after_quiz']).default('after_quiz'),
  feedback_depth: z.enum(['score_only', 'which_wrong', 'full']).default('full'),

  // Mastery-only settings
  mastery_threshold: z.number().int().min(0).max(100).default(80),
});

export const updateQuizSchema = createQuizSchema.partial();

// ==================== Quiz Block Schemas ====================

export const createBlockSchema = z.object({
  set_id: z.string().min(1),
  title: z.string().min(1).max(200),
  show_title: z.boolean().default(false),
  questions_to_pull: z.number().int().min(1),
  randomize_within: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const updateBlockSchema = createBlockSchema.partial();

export const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string()).min(1),
});

// ==================== Attempt Schemas ====================

export const startAttemptSchema = z.object({
  course_id: z.string().optional(),
});

export const saveAnswersSchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string(),
      question_instance_id: z.string(),
      selected_option_ids: z.array(z.string()).default([]),
      response_time_ms: z.number().int().min(0).optional(),
    })
  ),
});

export const checkAnswerSchema = z.object({
  question_instance_id: z.string(),
  selected_option_ids: z.array(z.string()).min(1),
});

// ==================== Import/Export Schemas ====================

export const importBankSchema = z.object({
  schema_version: z.literal(1),
  bank: z.object({
    title: z.string().optional(),
    questions: z.array(z.object({
      type: z.enum(['multiple_choice', 'multiple_select', 'true_false']),
      text: z.string().min(1),
      image_url: z.string().nullable().optional(),
      shuffle_answers: z.boolean().default(false),
      points: z.number().int().min(1).default(1),
      tags: z.array(z.string()).default([]),
      options: z.array(z.object({
        text: z.string().min(1),
        is_correct: z.boolean(),
        explanation: z.string().nullable().optional(),
      })).min(2),
    })),
    sets: z.array(z.object({
      title: z.string().min(1),
      tags: z.array(z.string()).default([]),
      question_indexes: z.array(z.number().int().min(0)),
    })).default([]),
  }),
});

// ==================== Type Exports ====================

export type UpdateBankInput = z.infer<typeof updateBankSchema>;
export type CreateSetInput = z.infer<typeof createSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;
export type CheckAnswerInput = z.infer<typeof checkAnswerSchema>;
export type ImportBankInput = z.infer<typeof importBankSchema>;
