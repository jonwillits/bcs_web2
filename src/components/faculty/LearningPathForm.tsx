'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NeuralButton } from '@/components/ui/neural-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, GripVertical, X, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  moduleCount: number;
}

interface LearningPathFormProps {
  initialData?: {
    title: string;
    slug: string;
    description: string | null;
    course_ids: string[];
    is_featured: boolean;
    sort_order: number;
  };
  isEdit?: boolean;
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
      <div className="flex items-center gap-2 p-3 bg-white border rounded-lg">
        <button type="button" {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-slate-400" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function LearningPathForm({ initialData, isEdit = false }: LearningPathFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialData?.course_ids || []);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    is_featured: initialData?.is_featured || false,
    sort_order: initialData?.sort_order || 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Fetch all published courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/faculty/program/layout');
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedCourseIds(items => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        course_ids: selectedCourseIds,
        ...(isEdit && { newSlug: formData.slug !== initialData?.slug ? formData.slug : undefined })
      };

      const url = isEdit ? `/api/paths/${initialData?.slug}` : '/api/paths';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save learning path');
      }

      toast.success('Success!', {
        description: `Learning path ${isEdit ? 'updated' : 'created'} successfully!`,
      });
      router.push('/faculty/paths');
      router.refresh();
    } catch (error) {
      console.error('Error saving path:', error);
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Failed to save learning path. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCourses = selectedCourseIds
    .map(id => courses.find(c => c.id === id))
    .filter(Boolean) as Course[];

  const availableCourses = courses.filter(c => !selectedCourseIds.includes(c.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Path Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g., Data Science Career Track"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="data-science-career-track"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Will be used in URL: /paths/{formData.slug}
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this learning path..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked === true }))}
              />
              <span className="text-sm font-medium">Featured Path</span>
            </label>

            <div className="flex items-center gap-2">
              <Label htmlFor="sort_order" className="text-sm">Display Order:</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Courses */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Available Courses</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCourses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  All courses have been added to this path
                </p>
              ) : (
                availableCourses.map(course => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-slate-600">{course.moduleCount} modules</p>
                      </div>
                      <Plus className="h-5 w-5 text-blue-600" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Courses (Sortable) */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">
              Selected Courses ({selectedCourses.length})
            </h3>

            {selectedCourses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p>No courses selected yet</p>
                <p className="text-sm mt-1">Select courses from the left panel</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 mb-3">
                  Drag to reorder • Students will see courses in this order
                </p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={selectedCourseIds} strategy={verticalListSortingStrategy}>
                    {selectedCourses.map((course, index) => (
                      <SortableItem key={course.id} id={course.id}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-6">{index + 1}.</span>
                            <div>
                              <p className="font-medium text-sm">{course.title}</p>
                              <p className="text-xs text-slate-600">{course.moduleCount} modules</p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCourse(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <NeuralButton
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </NeuralButton>
        <NeuralButton type="submit" disabled={saving || !formData.title || !formData.slug || selectedCourseIds.length === 0}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Update Path' : 'Create Path'}
            </>
          )}
        </NeuralButton>
      </div>
    </form>
  );
}
