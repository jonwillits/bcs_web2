import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * GET /api/faculty/courses/[id]/quiz-export
 * Enhanced CSV export with quiz_type and enrolled students
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    const data = await withDatabaseRetry(async () => {
      // Get all modules in course with quizzes (V2: plural relation)
      const courseModules = await prisma.course_modules.findMany({
        where: { course_id: courseId },
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              quizzes: {
                select: {
                  id: true,
                  title: true,
                  quiz_type: true,
                  attempts: {
                    where: { status: 'submitted' },
                    include: {
                      user: {
                        select: { id: true, name: true, email: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { sort_order: 'asc' },
      });

      // Get enrolled students
      const enrolledStudents = await prisma.course_tracking.findMany({
        where: { course_id: courseId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return { courseModules, enrolledStudents };
    });

    const studentMap = new Map(data.enrolledStudents.map(e => [e.user.id, e.user]));

    const headers = [
      'Student Name',
      'Student Email',
      'Student ID',
      'Module Title',
      'Quiz Type',
      'Quiz Title',
      'Best Score %',
      'Points Earned',
      'Points Possible',
      'Attempts Used',
      'Passed',
      'Last Attempt Date',
    ];

    const rows: string[][] = [];

    for (const cm of data.courseModules) {
      const mod = cm.modules;
      for (const quiz of mod.quizzes) {
        const quizTypeLabel = quiz.quiz_type === 'mastery_check' ? 'Mastery Check' : 'Assessment';

        // Group attempts by user
        const attemptsByUser = new Map<string, typeof quiz.attempts>();
        for (const attempt of quiz.attempts) {
          if (!attemptsByUser.has(attempt.user_id)) {
            attemptsByUser.set(attempt.user_id, []);
          }
          attemptsByUser.get(attempt.user_id)!.push(attempt);
        }

        // Add row for each enrolled student
        for (const [userId, student] of studentMap) {
          const userAttempts = attemptsByUser.get(userId) || [];

          if (userAttempts.length === 0) {
            rows.push([
              student.name,
              student.email,
              student.id,
              mod.title,
              quizTypeLabel,
              quiz.title,
              'N/A',
              'N/A',
              'N/A',
              '0',
              'N/A',
              'N/A',
            ]);
          } else {
            const bestAttempt = userAttempts.reduce((best, a) =>
              (a.score || 0) > (best.score || 0) ? a : best
            );
            const lastAttempt = userAttempts.reduce((last, a) =>
              new Date(a.submitted_at!) > new Date(last.submitted_at!) ? a : last
            );

            rows.push([
              student.name,
              student.email,
              student.id,
              mod.title,
              quizTypeLabel,
              quiz.title,
              bestAttempt.score !== null ? Math.round(bestAttempt.score).toString() : '0',
              bestAttempt.points_earned.toString(),
              bestAttempt.points_possible.toString(),
              userAttempts.length.toString(),
              bestAttempt.passed ? 'Yes' : 'No',
              lastAttempt.submitted_at
                ? new Date(lastAttempt.submitted_at).toISOString().split('T')[0]
                : '',
            ]);
          }
        }
      }
    }

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ];
    const csvContent = csvLines.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quiz-grades-${courseId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting quiz grades:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
