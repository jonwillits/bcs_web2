import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { hasFacultyAccess } from '@/lib/auth/utils';
import { canEditCourseWithRetry } from '@/lib/collaboration/permissions';

/**
 * Two add modes:
 *  - `{ userIds: [...] }` — faculty picks from a list of already-enrolled students
 *  - `{ emails:  [...] }` — faculty pastes a list of emails (supports bulk upload)
 *
 * Both modes run through the same pipeline and return a detailed per-entry
 * report. We accept either but require exactly one to be non-empty so the
 * client UI can keep the two paths visually separate.
 */
const addMembersSchema = z
  .object({
    userIds: z.array(z.string().min(1)).optional(),
    emails: z.array(z.string().trim().toLowerCase()).optional(),
  })
  .refine(
    (v) => (v.userIds && v.userIds.length > 0) || (v.emails && v.emails.length > 0),
    { message: 'Provide userIds or emails' }
  );

type AddResult = {
  input: string; // the original userId or email the caller provided
  status:
    | 'added'
    | 'already_in_group'
    | 'already_in_other_group'
    | 'not_enrolled'
    | 'not_found'
    | 'invalid_email';
  userId?: string;
  email?: string;
  name?: string;
  conflictGroupName?: string;
};

async function findGroupInCourse(groupId: string, courseId: string) {
  return withDatabaseRetry(async () => {
    const group = await prisma.course_groups.findUnique({
      where: { id: groupId },
      select: { id: true, course_id: true, name: true },
    });
    if (!group || group.course_id !== courseId) return null;
    return group;
  });
}

/**
 * GET /api/faculty/courses/[id]/groups/[groupId]/members
 * List all members of a group with user details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, groupId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view this course' },
        { status: 403 }
      );
    }

    const existing = await findGroupInCourse(groupId, courseId);
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const members = await withDatabaseRetry(async () => {
      return prisma.course_group_memberships.findMany({
        where: { group_id: groupId },
        orderBy: { added_at: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatar_url,
        role: m.user.role,
        addedAt: m.added_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error listing group members:', error);
    return NextResponse.json(
      { error: 'Failed to list group members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faculty/courses/[id]/groups/[groupId]/members
 * Add members to a group. Supports both single-user (from picker) and bulk
 * (from email textarea). Returns a per-entry report so the UI can show faculty
 * exactly what happened for each row they pasted.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !hasFacultyAccess(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, groupId } = await params;
    const hasAccess = await canEditCourseWithRetry(session.user.id, courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    const existing = await findGroupInCourse(groupId, courseId);
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userIds = [], emails = [] } = addMembersSchema.parse(body);

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Deduplicate and, for the email path, pre-filter invalid addresses so
    // the caller gets a clear "invalid_email" marker per row.
    const cleanEmails = Array.from(new Set(emails.filter(Boolean)));
    const invalidEmails = cleanEmails.filter((e) => !EMAIL_RE.test(e));
    const validEmails = cleanEmails.filter((e) => EMAIL_RE.test(e));
    const cleanUserIds = Array.from(new Set(userIds.filter(Boolean)));

    // Resolve emails -> users in one query. Missing emails will be flagged
    // as 'not_found' based on the diff below.
    const usersByEmail =
      validEmails.length > 0
        ? await withDatabaseRetry(async () => {
            return prisma.users.findMany({
              where: { email: { in: validEmails } },
              select: { id: true, email: true, name: true },
            });
          })
        : [];
    const emailToUser = new Map(usersByEmail.map((u) => [u.email.toLowerCase(), u]));

    // Resolve userIds -> users (for the picker path we already know they exist,
    // but verify anyway in case the client is stale).
    const usersById =
      cleanUserIds.length > 0
        ? await withDatabaseRetry(async () => {
            return prisma.users.findMany({
              where: { id: { in: cleanUserIds } },
              select: { id: true, email: true, name: true },
            });
          })
        : [];
    const idToUser = new Map(usersById.map((u) => [u.id, u]));

    // Collect the unique candidate user IDs we actually need to check/insert,
    // each tagged with the original caller-provided input string so the
    // response report stays aligned with what the UI sent.
    type Candidate = { input: string; user: { id: string; email: string; name: string } };
    const candidates: Candidate[] = [];
    for (const uid of cleanUserIds) {
      const u = idToUser.get(uid);
      if (u) candidates.push({ input: uid, user: u });
    }
    for (const email of validEmails) {
      const u = emailToUser.get(email);
      if (u) candidates.push({ input: email, user: u });
    }

    const candidateUserIds = Array.from(new Set(candidates.map((c) => c.user.id)));

    // Check enrollment: a user must be in course_tracking for this course
    // before they can be added to a group. Otherwise the group is meaningless.
    const enrollments =
      candidateUserIds.length > 0
        ? await withDatabaseRetry(async () => {
            return prisma.course_tracking.findMany({
              where: {
                course_id: courseId,
                user_id: { in: candidateUserIds },
              },
              select: { user_id: true },
            });
          })
        : [];
    const enrolledIds = new Set(enrollments.map((e) => e.user_id));

    // Check existing memberships across ALL groups in this course. Gives us
    // the one-group-per-course enforcement + lets us tell the faculty which
    // group is conflicting.
    const otherGroupMemberships =
      candidateUserIds.length > 0
        ? await withDatabaseRetry(async () => {
            return prisma.course_group_memberships.findMany({
              where: {
                user_id: { in: candidateUserIds },
                group: { course_id: courseId },
              },
              include: {
                group: { select: { id: true, name: true } },
              },
            });
          })
        : [];
    const userToExistingGroup = new Map(
      otherGroupMemberships.map((m) => [m.user_id, m.group])
    );

    // Build the report + the set of memberships we actually need to insert.
    const report: AddResult[] = [];
    const toInsert: { userId: string; input: string }[] = [];
    const seenInBatch = new Set<string>();

    for (const email of invalidEmails) {
      report.push({ input: email, email, status: 'invalid_email' });
    }

    for (const uid of cleanUserIds) {
      if (!idToUser.has(uid)) {
        report.push({ input: uid, status: 'not_found' });
      }
    }
    for (const email of validEmails) {
      if (!emailToUser.has(email)) {
        report.push({ input: email, email, status: 'not_found' });
      }
    }

    for (const { input, user } of candidates) {
      // Dedup within the same batch in case the caller sent the same user
      // via both paths (e.g. both id and email).
      if (seenInBatch.has(user.id)) continue;
      seenInBatch.add(user.id);

      if (!enrolledIds.has(user.id)) {
        report.push({
          input,
          userId: user.id,
          email: user.email,
          name: user.name,
          status: 'not_enrolled',
        });
        continue;
      }

      const existingMembership = userToExistingGroup.get(user.id);
      if (existingMembership) {
        if (existingMembership.id === groupId) {
          report.push({
            input,
            userId: user.id,
            email: user.email,
            name: user.name,
            status: 'already_in_group',
          });
        } else {
          report.push({
            input,
            userId: user.id,
            email: user.email,
            name: user.name,
            status: 'already_in_other_group',
            conflictGroupName: existingMembership.name,
          });
        }
        continue;
      }

      toInsert.push({ userId: user.id, input });
      report.push({
        input,
        userId: user.id,
        email: user.email,
        name: user.name,
        status: 'added',
      });
    }

    if (toInsert.length > 0) {
      await withDatabaseRetry(async () => {
        return prisma.course_group_memberships.createMany({
          data: toInsert.map((t) => ({
            group_id: groupId,
            user_id: t.userId,
            added_by: session.user.id,
          })),
        });
      });
    }

    const summary = {
      added: report.filter((r) => r.status === 'added').length,
      alreadyInGroup: report.filter((r) => r.status === 'already_in_group').length,
      alreadyInOtherGroup: report.filter((r) => r.status === 'already_in_other_group')
        .length,
      notEnrolled: report.filter((r) => r.status === 'not_enrolled').length,
      notFound: report.filter((r) => r.status === 'not_found').length,
      invalidEmail: report.filter((r) => r.status === 'invalid_email').length,
    };

    return NextResponse.json({ report, summary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error adding group members:', error);
    return NextResponse.json(
      { error: 'Failed to add group members' },
      { status: 500 }
    );
  }
}
