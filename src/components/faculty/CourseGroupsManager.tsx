'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Users,
  Trash2,
  Pencil,
  UserPlus,
  UserMinus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Group {
  id: string;
  name: string;
  description: string | null;
  canvasCourseId: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; email: string };
}

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  addedAt: string;
}

interface Enrollment {
  userId: string;
  name: string;
  email: string;
}

type AddReportEntry = {
  input: string;
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

type AddReport = {
  report: AddReportEntry[];
  summary: {
    added: number;
    alreadyInGroup: number;
    alreadyInOtherGroup: number;
    notEnrolled: number;
    notFound: number;
    invalidEmail: number;
  };
};

interface CourseGroupsManagerProps {
  courseId: string;
}

export function CourseGroupsManager({ courseId }: CourseGroupsManagerProps) {
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [membersByGroup, setMembersByGroup] = useState<Record<string, Member[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [addMembersGroup, setAddMembersGroup] = useState<Group | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);

  // Fetch course title for breadcrumb
  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => setCourseTitle(d?.course?.title || ''))
      .catch(() => {});
  }, [courseId]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`/api/faculty/courses/${courseId}/groups`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load groups');
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    }
  }, [courseId]);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch(`/api/faculty/courses/${courseId}/students`);
      const data = await res.json();
      if (!res.ok) return;
      setEnrollments(
        (data.learners || []).map((l: { learner: { id: string; name: string; email: string } }) => ({
          userId: l.learner.id,
          name: l.learner.name,
          email: l.learner.email,
        }))
      );
    } catch {
      // Non-fatal: enrollments used only for the picker
    }
  }, [courseId]);

  useEffect(() => {
    Promise.all([fetchGroups(), fetchEnrollments()]).finally(() => setIsLoading(false));
  }, [fetchGroups, fetchEnrollments]);

  const fetchMembers = useCallback(
    async (groupId: string) => {
      const res = await fetch(`/api/faculty/courses/${courseId}/groups/${groupId}/members`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to load members');
        return;
      }
      setMembersByGroup((prev) => ({ ...prev, [groupId]: data.members }));
    },
    [courseId]
  );

  const toggleExpand = (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      return;
    }
    setExpandedGroupId(groupId);
    if (!membersByGroup[groupId]) {
      fetchMembers(groupId);
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    const res = await fetch(
      `/api/faculty/courses/${courseId}/groups/${groupId}/members/${userId}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to remove member');
      return;
    }
    toast.success('Member removed');
    fetchMembers(groupId);
    fetchGroups(); // refresh counts
  };

  const confirmDeleteGroup = async () => {
    if (!deleteGroup) return;
    const res = await fetch(
      `/api/faculty/courses/${courseId}/groups/${deleteGroup.id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to delete group');
      return;
    }
    toast.success(`Deleted group "${deleteGroup.name}"`);
    setDeleteGroup(null);
    setExpandedGroupId(null);
    fetchGroups();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading groups...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/faculty/courses/edit/${courseId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Groups</h1>
            {courseTitle && (
              <p className="text-muted-foreground mt-1">{courseTitle}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Organize enrolled students into groups (e.g. one group per section).
              Groups let you filter gradebook exports and map to a specific Canvas
              course when syncing grades.
            </p>
          </div>
          <NeuralButton variant="neural" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Group
          </NeuralButton>
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <Card className="cognitive-card">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No groups yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a group to organize a subset of enrolled students.
            </p>
            <NeuralButton variant="neural" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create your first group
            </NeuralButton>
          </CardContent>
        </Card>
      )}

      {/* Group list */}
      <div className="space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedGroupId === group.id;
          const members = membersByGroup[group.id] || [];
          return (
            <Card key={group.id} className="cognitive-card">
              <CardHeader
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(group.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
                        </Badge>
                        {group.canvasCourseId && (
                          <Badge variant="outline">
                            Canvas: {group.canvasCourseId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <NeuralButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGroup(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </NeuralButton>
                    <NeuralButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteGroup(group)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </NeuralButton>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t border-border/40">
                  <div className="flex items-center justify-between mb-3 mt-4">
                    <h4 className="font-medium">Members</h4>
                    <NeuralButton
                      variant="outline"
                      size="sm"
                      onClick={() => setAddMembersGroup(group)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Members
                    </NeuralButton>
                  </div>
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No members yet. Click &quot;Add Members&quot; to get started.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{m.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {m.email}
                            </div>
                          </div>
                          <NeuralButton
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(group.id, m.userId)}
                          >
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </NeuralButton>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Create group dialog */}
      <GroupFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        courseId={courseId}
        onSaved={fetchGroups}
      />

      {/* Edit group dialog */}
      <GroupFormDialog
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        mode="edit"
        courseId={courseId}
        group={editingGroup}
        onSaved={fetchGroups}
      />

      {/* Add members dialog */}
      <AddMembersDialog
        open={!!addMembersGroup}
        onOpenChange={(open) => !open && setAddMembersGroup(null)}
        courseId={courseId}
        group={addMembersGroup}
        enrollments={enrollments}
        existingMemberIds={
          addMembersGroup ? (membersByGroup[addMembersGroup.id] || []).map((m) => m.userId) : []
        }
        onAdded={() => {
          if (addMembersGroup) {
            fetchMembers(addMembersGroup.id);
            fetchGroups();
          }
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        title={`Delete group "${deleteGroup?.name}"?`}
        description={`This will remove all ${deleteGroup?.memberCount || 0} membership(s). Students stay enrolled in the course.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDeleteGroup}
      />
    </div>
  );
}

// ============================================================================
// Create/Edit group form dialog
// ============================================================================

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  courseId: string;
  group?: Group | null;
  onSaved: () => void;
}

function GroupFormDialog({
  open,
  onOpenChange,
  mode,
  courseId,
  group,
  onSaved,
}: GroupFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [canvasCourseId, setCanvasCourseId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(group?.name || '');
      setDescription(group?.description || '');
      setCanvasCourseId(group?.canvasCourseId || '');
    }
  }, [open, group]);

  const save = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const url =
        mode === 'create'
          ? `/api/faculty/courses/${courseId}/groups`
          : `/api/faculty/courses/${courseId}/groups/${group!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          canvas_course_id: canvasCourseId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save group');
        return;
      }
      toast.success(mode === 'create' ? 'Group created' : 'Group updated');
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Group' : 'Edit Group'}
          </DialogTitle>
          <DialogDescription>
            Groups let you scope gradebook exports and Canvas grade sync to a
            specific subset of enrolled students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="group-name">Name *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring 2026 Section A"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this group"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="group-canvas">Canvas Course ID</Label>
            <Input
              id="group-canvas"
              value={canvasCourseId}
              onChange={(e) => setCanvasCourseId(e.target.value)}
              placeholder="Numeric Canvas course ID (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Used later when syncing grades to Canvas. You can leave blank for now.
            </p>
          </div>
        </div>

        <DialogFooter>
          <NeuralButton variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </NeuralButton>
          <NeuralButton variant="neural" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {mode === 'create' ? 'Create' : 'Save'}
          </NeuralButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Add members dialog — supports picker + bulk email paste
// ============================================================================

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  group: Group | null;
  enrollments: Enrollment[];
  existingMemberIds: string[];
  onAdded: () => void;
}

function AddMembersDialog({
  open,
  onOpenChange,
  courseId,
  group,
  enrollments,
  existingMemberIds,
  onAdded,
}: AddMembersDialogProps) {
  const [tab, setTab] = useState<'picker' | 'bulk'>('picker');
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkText, setBulkText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<AddReport | null>(null);

  useEffect(() => {
    if (open) {
      setPickerSearch('');
      setSelectedUserIds(new Set());
      setBulkText('');
      setReport(null);
      setTab('picker');
    }
  }, [open]);

  if (!group) return null;

  const existingSet = new Set(existingMemberIds);
  const filteredEnrollments = enrollments.filter((e) => {
    if (existingSet.has(e.userId)) return false; // already in this group
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  });

  const toggle = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const submit = async () => {
    let payload: { userIds?: string[]; emails?: string[] };
    if (tab === 'picker') {
      if (selectedUserIds.size === 0) {
        toast.error('Select at least one student');
        return;
      }
      payload = { userIds: Array.from(selectedUserIds) };
    } else {
      // Split pasted text on commas, whitespace, newlines
      const emails = bulkText
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (emails.length === 0) {
        toast.error('Paste at least one email');
        return;
      }
      payload = { emails };
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/faculty/courses/${courseId}/groups/${group.id}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to add members');
        return;
      }
      setReport(data);
      if (data.summary.added > 0) {
        toast.success(`Added ${data.summary.added} member(s)`);
        onAdded();
      }
      // Don't auto-close — let faculty see the report
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Members to &quot;{group.name}&quot;</DialogTitle>
          <DialogDescription>
            Pick from enrolled students or paste a list of emails. Only students
            already enrolled in this course can be added.
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <ReportView report={report} onDone={() => onOpenChange(false)} onAddMore={() => setReport(null)} />
        ) : (
          <>
            <div className="border-b border-border mb-4">
              <nav className="flex gap-6 sm:gap-8">
                {([
                  { key: 'picker', label: 'Pick Enrolled' },
                  { key: 'bulk', label: 'Paste Emails' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`py-2.5 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      tab === key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {tab === 'picker' && (
              <div className="space-y-3">
                <Input
                  placeholder="Search by name or email..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                />
                <div className="border border-border/40 rounded-md max-h-[300px] overflow-y-auto">
                  {filteredEnrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">
                      {enrollments.length === 0
                        ? 'No enrolled students found.'
                        : 'No matching students (all enrolled students may already be in this group).'}
                    </p>
                  ) : (
                    filteredEnrollments.map((e) => (
                      <label
                        key={e.userId}
                        className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer border-b border-border/20 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(e.userId)}
                          onChange={() => toggle(e.userId)}
                          className="h-4 w-4"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{e.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{e.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedUserIds.size} selected
                </p>
              </div>
            )}

            {tab === 'bulk' && (
              <div className="space-y-3">
                <Label htmlFor="bulk-emails">
                  Paste emails (comma, space, or newline separated)
                </Label>
                <Textarea
                  id="bulk-emails"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="student1@illinois.edu&#10;student2@illinois.edu&#10;student3@illinois.edu"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Students must already be enrolled in this course. You&apos;ll see
                  a report showing exactly what happened for each email.
                </p>
              </div>
            )}

            <DialogFooter>
              <NeuralButton variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </NeuralButton>
              <NeuralButton variant="neural" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                Add Members
              </NeuralButton>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Bulk-add result report
// ============================================================================

function ReportView({
  report,
  onDone,
  onAddMore,
}: {
  report: AddReport;
  onDone: () => void;
  onAddMore: () => void;
}) {
  const { summary, report: entries } = report;

  const statusConfig: Record<
    AddReportEntry['status'],
    { label: string; color: string }
  > = {
    added: { label: 'Added', color: 'text-green-600 dark:text-green-400' },
    already_in_group: { label: 'Already in this group', color: 'text-muted-foreground' },
    already_in_other_group: {
      label: 'In another group',
      color: 'text-amber-600 dark:text-amber-400',
    },
    not_enrolled: {
      label: 'Not enrolled in course',
      color: 'text-red-600 dark:text-red-400',
    },
    not_found: { label: 'User not found', color: 'text-red-600 dark:text-red-400' },
    invalid_email: { label: 'Invalid email', color: 'text-red-600 dark:text-red-400' },
  };

  return (
    <>
      <div className="py-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="font-medium">Results</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-sm">
          <SummaryStat label="Added" value={summary.added} good />
          {summary.alreadyInGroup > 0 && (
            <SummaryStat label="Already in group" value={summary.alreadyInGroup} />
          )}
          {summary.alreadyInOtherGroup > 0 && (
            <SummaryStat label="In other group" value={summary.alreadyInOtherGroup} warn />
          )}
          {summary.notEnrolled > 0 && (
            <SummaryStat label="Not enrolled" value={summary.notEnrolled} bad />
          )}
          {summary.notFound > 0 && (
            <SummaryStat label="Not found" value={summary.notFound} bad />
          )}
          {summary.invalidEmail > 0 && (
            <SummaryStat label="Invalid email" value={summary.invalidEmail} bad />
          )}
        </div>

        <div className="border border-border/40 rounded-md max-h-[300px] overflow-y-auto">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 p-2 border-b border-border/20 last:border-b-0 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {entry.name || entry.email || entry.input}
                </div>
                {entry.name && entry.email && (
                  <div className="text-xs text-muted-foreground truncate">
                    {entry.email}
                  </div>
                )}
              </div>
              <div className={`text-xs font-medium ${statusConfig[entry.status].color}`}>
                {statusConfig[entry.status].label}
                {entry.conflictGroupName && (
                  <span className="block text-[10px] text-muted-foreground">
                    in &quot;{entry.conflictGroupName}&quot;
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <NeuralButton variant="outline" onClick={onAddMore}>
          Add more
        </NeuralButton>
        <NeuralButton variant="neural" onClick={onDone}>
          Done
        </NeuralButton>
      </DialogFooter>
    </>
  );
}

function SummaryStat({
  label,
  value,
  good,
  warn,
  bad,
}: {
  label: string;
  value: number;
  good?: boolean;
  warn?: boolean;
  bad?: boolean;
}) {
  const color = good
    ? 'text-green-600 dark:text-green-400'
    : warn
      ? 'text-amber-600 dark:text-amber-400'
      : bad
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';
  return (
    <div className="border border-border/40 rounded-md p-2">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
