import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'
import { z } from 'zod'
import { hasFacultyAccess } from '@/lib/auth/utils'

const cloneModuleSchema = z.object({
  cloneMedia: z.boolean().optional().default(true),
  cloneCollaborators: z.boolean().optional().default(false),
  cloneQuiz: z.boolean().optional().default(true),
  newTitle: z.string().min(1).max(200).optional(),
})

// Generate unique slug for cloned module
async function generateUniqueSlug(originalSlug: string, authorId: string): Promise<string> {
  let candidateSlug = `${originalSlug}-copy`
  let counter = 1

  while (true) {
    const exists = await prisma.modules.findFirst({
      where: {
        slug: candidateSlug,
        author_id: authorId,
      },
    })

    if (!exists) {
      return candidateSlug
    }

    candidateSlug = `${originalSlug}-copy-${counter}`
    counter++
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: originalModuleId } = await params

    // Validate request body
    const body = await request.json()
    const { cloneMedia, cloneCollaborators, cloneQuiz, newTitle } = cloneModuleSchema.parse(body)

    // Fetch the original module with all related data
    const originalModule = await withDatabaseRetry(async () => {
      return prisma.modules.findFirst({
        where: {
          id: originalModuleId,
          OR: [
            { visibility: 'public' },
            { author_id: session.user.id },
            {
              collaborators: {
                some: {
                  user_id: session.user.id,
                },
              },
            },
          ],
        },
        include: {
          module_media: {
            include: {
              media_files: true,
            },
          },
          collaborators: {
            include: {
              collaborator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          question_bank: {
            include: {
              questions: {
                orderBy: { sort_order: 'asc' },
                include: {
                  options: { orderBy: { sort_order: 'asc' } },
                },
              },
              sets: {
                orderBy: { sort_order: 'asc' },
                include: {
                  memberships: { orderBy: { sort_order: 'asc' } },
                },
              },
            },
          },
          quizzes: {
            include: {
              blocks: { orderBy: { sort_order: 'asc' } },
            },
          },
        },
      })
    })

    if (!originalModule) {
      return NextResponse.json(
        { error: 'Module not found or you do not have permission to clone it' },
        { status: 404 }
      )
    }

    // Generate unique slug for the clone
    const clonedSlug = await generateUniqueSlug(originalModule.slug, session.user.id)

    // Generate new module ID
    const clonedModuleId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the cloned module
    const clonedModule = await withDatabaseRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // 1. Create the new module
        const newModule = await tx.modules.create({
          data: {
            id: clonedModuleId,
            title: newTitle || `${originalModule.title} (Copy)`,
            slug: clonedSlug,
            content: originalModule.content,
            description: originalModule.description,
            author_id: session.user.id,
            parent_module_id: null, // Clones are always root modules
            sort_order: 0,
            module_number: null,
            status: 'draft', // Clones start as drafts
            visibility: 'private', // Clones start as private
            cloned_from: originalModuleId,
            clone_count: 0,
            tags: originalModule.tags,
            unlock_condition: originalModule.unlock_condition,
            xp_reward: originalModule.xp_reward,
            difficulty_level: originalModule.difficulty_level,
            estimated_minutes: originalModule.estimated_minutes,
            quest_type: originalModule.quest_type,
          },
          include: {
            users: {
              select: {
                name: true,
                email: true,
              },
            },
            modules: {
              select: {
                id: true,
                title: true,
              },
            },
            other_modules: {
              select: {
                id: true,
                title: true,
                status: true,
                created_at: true,
              },
            },
            module_media: {
              include: {
                media_files: true,
              },
            },
            original_module: {
              select: {
                id: true,
                title: true,
                slug: true,
                author_id: true,
                users: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                other_modules: true,
                course_modules: true,
              },
            },
          },
        })

        // 2. Clone media associations if requested
        if (cloneMedia && originalModule.module_media.length > 0) {
          const mediaAssociations = originalModule.module_media.map((mm) => ({
            id: `module_media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            module_id: clonedModuleId,
            media_file_id: mm.media_file_id,
          }))

          await tx.module_media.createMany({
            data: mediaAssociations,
          })
        }

        // 3. Clone collaborators if requested
        if (cloneCollaborators && originalModule.collaborators.length > 0) {
          const collaboratorAssociations = originalModule.collaborators
            .filter((c) => c.user_id !== session.user.id) // Don't add yourself as collaborator
            .map((c) => ({
              id: `module_collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              module_id: clonedModuleId,
              user_id: c.user_id,
              added_by: session.user.id,
            }))

          if (collaboratorAssociations.length > 0) {
            await tx.module_collaborators.createMany({
              data: collaboratorAssociations,
            })
          }
        }

        // 4. Clone quiz data if requested
        if (cloneQuiz && originalModule.question_bank) {
          const originalBank = originalModule.question_bank

          // 4a. Create the new question bank
          const newBank = await tx.question_banks.create({
            data: {
              module_id: clonedModuleId,
              title: originalBank.title,
              description: originalBank.description,
            },
          })

          // 4b. Clone questions with options, building old->new ID map
          const questionIdMap = new Map<string, string>()

          for (const question of originalBank.questions) {
            const newQuestion = await tx.bank_questions.create({
              data: {
                bank_id: newBank.id,
                question_type: question.question_type,
                question_text: question.question_text,
                image_url: question.image_url,
                sort_order: question.sort_order,
                points: question.points,
                shuffle_answers: question.shuffle_answers,
                version: 1,
                cloned_from: null,
                tags: question.tags,
                options: {
                  create: question.options.map((opt) => ({
                    option_text: opt.option_text,
                    is_correct: opt.is_correct,
                    explanation: opt.explanation,
                    sort_order: opt.sort_order,
                  })),
                },
              },
            })
            questionIdMap.set(question.id, newQuestion.id)
          }

          // 4c. Clone question sets with memberships, building old->new set ID map
          const setIdMap = new Map<string, string>()

          for (const set of originalBank.sets) {
            const membershipData = set.memberships
              .filter((m) => questionIdMap.has(m.question_id))
              .map((m) => ({
                question_id: questionIdMap.get(m.question_id)!,
                sort_order: m.sort_order,
              }))

            const newSet = await tx.question_sets.create({
              data: {
                bank_id: newBank.id,
                title: set.title,
                description: set.description,
                sort_order: set.sort_order,
                tags: set.tags,
                memberships: {
                  create: membershipData,
                },
              },
            })
            setIdMap.set(set.id, newSet.id)
          }

          // 4d. Clone quizzes with blocks
          for (const quiz of originalModule.quizzes) {
            const newQuiz = await tx.quizzes.create({
              data: {
                module_id: clonedModuleId,
                title: quiz.title,
                description: quiz.description,
                quiz_type: quiz.quiz_type,
                status: 'draft',
                xp_reward: quiz.xp_reward,
                randomize_blocks: quiz.randomize_blocks,
                time_limit_minutes: quiz.time_limit_minutes,
                max_attempts: quiz.max_attempts,
                pass_threshold: quiz.pass_threshold,
                scoring_procedure: quiz.scoring_procedure,
                scoring_drop_count: quiz.scoring_drop_count,
                feedback_timing: quiz.feedback_timing,
                feedback_depth: quiz.feedback_depth,
                mastery_threshold: quiz.mastery_threshold,
              },
            })

            const blockData = quiz.blocks
              .filter((b) => setIdMap.has(b.set_id))
              .map((b) => ({
                quiz_id: newQuiz.id,
                set_id: setIdMap.get(b.set_id)!,
                title: b.title,
                show_title: b.show_title,
                questions_to_pull: b.questions_to_pull,
                randomize_within: b.randomize_within,
                sort_order: b.sort_order,
              }))

            if (blockData.length > 0) {
              await tx.quiz_blocks.createMany({
                data: blockData,
              })
            }
          }
        }

        // 5. Increment clone count on original module
        await tx.modules.update({
          where: { id: originalModuleId },
          data: {
            clone_count: {
              increment: 1,
            },
          },
        })

        return newModule
      })
    })

    return NextResponse.json({
      module: clonedModule,
      message: 'Module cloned successfully',
    })
  } catch (error) {
    console.error('Error cloning module:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to clone module' },
      { status: 500 }
    )
  }
}
