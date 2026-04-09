import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import ExcelJS from 'exceljs';

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const QUIZ_HEADERS = [
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

const GRADEBOOK_HEADERS = [
  'Student Name',
  'Student Email',
  'Student ID',
  'Overall Grade %',
  'Total Points Earned',
  'Total Points Possible',
  'Quizzes Attempted',
  'Quizzes Passed',
  'Modules Completed',
  'Modules Total',
  'Last Activity',
];

/**
 * GET /api/faculty/courses/[id]/quiz-export
 *
 * Unified gradebook export. Returns either:
 *  - format=xlsx (default): an .xlsx workbook with "Quiz Breakdown" and "Course Gradebook" sheets
 *  - format=csv: a single-sheet CSV chosen via sheet=quiz|gradebook (default: quiz)
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
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const sheet = (searchParams.get('sheet') || 'quiz').toLowerCase();
    const groupId = searchParams.get('groupId') || null;

    if (format !== 'xlsx' && format !== 'csv') {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
    if (format === 'csv' && sheet !== 'quiz' && sheet !== 'gradebook') {
      return NextResponse.json({ error: 'Invalid sheet' }, { status: 400 });
    }

    const data = await withDatabaseRetry(async () => {
      const course = await prisma.courses.findUnique({
        where: { id: courseId },
        select: { id: true, slug: true, title: true },
      });

      // If groupId provided, verify it belongs to this course and collect
      // the member user IDs to filter the enrolled-students query.
      let group: { id: string; name: string } | null = null;
      let groupMemberIds: string[] | null = null;
      if (groupId) {
        const g = await prisma.course_groups.findUnique({
          where: { id: groupId },
          select: {
            id: true,
            name: true,
            course_id: true,
            memberships: { select: { user_id: true } },
          },
        });
        if (g && g.course_id === courseId) {
          group = { id: g.id, name: g.name };
          groupMemberIds = g.memberships.map((m) => m.user_id);
        } else {
          // Treat an invalid/cross-course groupId as a 404 below
          return { course, courseModules: [], enrolledStudents: [], group: null, groupMemberIds: null, groupNotFound: true };
        }
      }

      // Get all modules in course with quizzes and submitted attempts
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

      // Get enrolled students, optionally filtered to a group's member list
      const enrolledStudents = await prisma.course_tracking.findMany({
        where: {
          course_id: courseId,
          ...(groupMemberIds !== null && { user_id: { in: groupMemberIds } }),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return { course, courseModules, enrolledStudents, group, groupMemberIds, groupNotFound: false };
    });

    if (!data.course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (data.groupNotFound) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const studentMap = new Map(data.enrolledStudents.map((e) => [e.user.id, e.user]));

    // Build quiz sheet rows (one row per student × quiz)
    const quizRows: string[][] = [];
    for (const cm of data.courseModules) {
      const mod = cm.modules;
      for (const quiz of mod.quizzes) {
        const quizTypeLabel =
          quiz.quiz_type === 'mastery_check' ? 'Mastery Check' : 'Assessment';

        // Group attempts by user
        const attemptsByUser = new Map<string, typeof quiz.attempts>();
        for (const attempt of quiz.attempts) {
          if (!attemptsByUser.has(attempt.user_id)) {
            attemptsByUser.set(attempt.user_id, []);
          }
          attemptsByUser.get(attempt.user_id)!.push(attempt);
        }

        for (const [userId, student] of studentMap) {
          const userAttempts = attemptsByUser.get(userId) || [];

          if (userAttempts.length === 0) {
            quizRows.push([
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

            quizRows.push([
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

    // Build gradebook sheet rows (one row per student)
    // Strategy:
    //   For each quiz in the course, determine its canonical points_possible by
    //   looking at any submitted attempt (attempts for a given quiz should all
    //   report the same points_possible; take the max to be safe). Quizzes with
    //   zero attempts are excluded from the denominator since we cannot tell
    //   their point value without an attempt record.
    //   For each student, sum points_earned (best attempt per quiz, 0 if not
    //   attempted) over all quizzes that contribute to the denominator.
    type QuizInfo = {
      id: string;
      pointsPossible: number;
      bestByUser: Map<string, { points: number; passed: boolean; submittedAt: Date | null }>;
    };
    const quizzesForGrade: QuizInfo[] = [];
    for (const cm of data.courseModules) {
      for (const quiz of cm.modules.quizzes) {
        if (quiz.attempts.length === 0) continue;
        let pointsPossible = 0;
        const bestByUser = new Map<
          string,
          { points: number; passed: boolean; submittedAt: Date | null }
        >();
        for (const a of quiz.attempts) {
          if (a.points_possible > pointsPossible) pointsPossible = a.points_possible;
          const prev = bestByUser.get(a.user_id);
          if (!prev || a.points_earned > prev.points) {
            bestByUser.set(a.user_id, {
              points: a.points_earned,
              passed: a.passed,
              submittedAt: a.submitted_at,
            });
          }
        }
        if (pointsPossible > 0) {
          quizzesForGrade.push({ id: quiz.id, pointsPossible, bestByUser });
        }
      }
    }

    const enrollmentByUser = new Map(data.enrolledStudents.map((e) => [e.user.id, e]));

    const gradebookRows: string[][] = [];
    for (const [userId, student] of studentMap) {
      const enrollment = enrollmentByUser.get(userId);
      let totalEarned = 0;
      let totalPossible = 0;
      let attempted = 0;
      let passed = 0;
      let lastQuizSubmission: Date | null = null;

      for (const q of quizzesForGrade) {
        totalPossible += q.pointsPossible;
        const best = q.bestByUser.get(userId);
        if (best) {
          totalEarned += best.points;
          attempted += 1;
          if (best.passed) passed += 1;
          if (best.submittedAt && (!lastQuizSubmission || best.submittedAt > lastQuizSubmission)) {
            lastQuizSubmission = best.submittedAt;
          }
        }
      }

      const overallGrade =
        totalPossible > 0
          ? (Math.round((totalEarned / totalPossible) * 1000) / 10).toFixed(1)
          : 'N/A';

      const lastActivityDate = (() => {
        const candidates: Date[] = [];
        if (enrollment?.last_accessed) candidates.push(new Date(enrollment.last_accessed));
        if (lastQuizSubmission) candidates.push(lastQuizSubmission);
        if (candidates.length === 0) return '';
        const latest = candidates.reduce((a, b) => (a > b ? a : b));
        return latest.toISOString().split('T')[0];
      })();

      gradebookRows.push([
        student.name,
        student.email,
        student.id,
        overallGrade,
        totalEarned.toString(),
        totalPossible.toString(),
        attempted.toString(),
        passed.toString(),
        (enrollment?.modules_completed ?? 0).toString(),
        (enrollment?.modules_total ?? 0).toString(),
        lastActivityDate,
      ]);
    }

    const courseSlug = data.course.slug;
    const dateStr = new Date().toISOString().split('T')[0];
    // Slugify the group name for the filename so it's safe on every filesystem
    const groupSlug = data.group
      ? `-${data.group.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}`
      : '';

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'BCS E-Textbook';
      workbook.created = new Date();

      const quizSheet = workbook.addWorksheet('Quiz Breakdown');
      quizSheet.addRow(QUIZ_HEADERS);
      for (const row of quizRows) quizSheet.addRow(row);
      quizSheet.getRow(1).font = { bold: true };
      quizSheet.views = [{ state: 'frozen', ySplit: 1 }];
      quizSheet.columns.forEach((col) => {
        col.width = 18;
      });

      const gradebookSheet = workbook.addWorksheet('Course Gradebook');
      gradebookSheet.addRow(GRADEBOOK_HEADERS);
      for (const row of gradebookRows) gradebookSheet.addRow(row);
      gradebookSheet.getRow(1).font = { bold: true };
      gradebookSheet.views = [{ state: 'frozen', ySplit: 1 }];
      gradebookSheet.columns.forEach((col) => {
        col.width = 18;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer as ArrayBuffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="gradebook-${courseSlug}${groupSlug}-${dateStr}.xlsx"`,
        },
      });
    }

    // CSV
    const headers = sheet === 'gradebook' ? GRADEBOOK_HEADERS : QUIZ_HEADERS;
    const rows = sheet === 'gradebook' ? gradebookRows : quizRows;

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ];
    const csvContent = csvLines.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gradebook-${courseSlug}${groupSlug}-${sheet}-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting quiz grades:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
