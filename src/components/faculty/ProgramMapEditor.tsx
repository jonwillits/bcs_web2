'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';
import {
  Loader2,
  Save,
  RotateCcw,
  Info,
  Check,
  X,
  Settings,
  AlertCircle
} from 'lucide-react';
import { autoLayoutCourses, needsAutoLayout, validatePrerequisites } from '@/lib/program-layout';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prerequisite_course_ids: string[];
  program_position_x: number;
  program_position_y: number;
  featured: boolean;
  tags: string[];
  author: string;
  moduleCount: number;
}

export function ProgramMapEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [draggedCourse, setDraggedCourse] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/faculty/program/layout');
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();

        let coursesToSet = data.courses;

        // Auto-layout if needed
        if (needsAutoLayout(data.courses)) {
          const layouted = autoLayoutCourses(data.courses);
          // Remove depth property
          coursesToSet = layouted.map(({ depth, ...course }) => course);
          setHasUnsavedChanges(true); // Mark as unsaved since we auto-layouted
        }

        setCourses(coursesToSet);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Update map dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setMapDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [courses]);

  // Handle course drag
  const handleDragStart = (courseId: string) => (e: React.DragEvent) => {
    setDraggedCourse(courseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCourse || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCourses(prev =>
      prev.map(course =>
        course.id === draggedCourse
          ? {
              ...course,
              program_position_x: Math.max(5, Math.min(95, x)),
              program_position_y: Math.max(5, Math.min(95, y))
            }
          : course
      )
    );

    setDraggedCourse(null);
    setHasUnsavedChanges(true);
  };

  // Handle auto-layout
  const handleAutoLayout = () => {
    const layouted = autoLayoutCourses(courses);
    // Remove the depth property from layouted courses
    const coursesWithoutDepth = layouted.map(({ depth, ...course }) => course);
    setCourses(coursesWithoutDepth);
    setHasUnsavedChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate prerequisites first
      const validation = validatePrerequisites(courses);
      if (!validation.valid) {
        toast.error('Validation Error', {
          description: validation.errors.join('. '),
        });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/faculty/program/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses })
      });

      if (!response.ok) throw new Error('Failed to save');

      setHasUnsavedChanges(false);
      toast.success('Success!', {
        description: 'Program map layout saved successfully!',
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Save Failed', {
        description: 'Failed to save program map layout. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update prerequisites
  const updatePrerequisites = (courseId: string, prerequisiteIds: string[]) => {
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, prerequisite_course_ids: prerequisiteIds }
          : course
      )
    );
    setHasUnsavedChanges(true);
  };

  // Calculate SVG paths
  const connectionPaths = useMemo(() => {
    if (mapDimensions.width === 0) return null;

    return courses.flatMap(course =>
      (course.prerequisite_course_ids || []).map(prereqId => {
        const prereq = courses.find(c => c.id === prereqId);
        if (!prereq) return null;

        const startX = (prereq.program_position_x / 100) * mapDimensions.width;
        const startY = (prereq.program_position_y / 100) * mapDimensions.height;
        const endX = (course.program_position_x / 100) * mapDimensions.width;
        const endY = (course.program_position_y / 100) * mapDimensions.height;

        const controlY1 = startY + (endY - startY) / 2;
        const controlY2 = startY + (endY - startY) / 2;

        return (
          <path
            key={`${prereq.id}-${course.id}`}
            d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            opacity="0.6"
            className="pointer-events-none"
          />
        );
      })
    );
  }, [courses, mapDimensions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Program Map Editor</p>
                <p className="text-sm text-slate-600">
                  Drag courses to position them. Click a course to edit prerequisites.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </span>
              )}
              <NeuralButton variant="outline" onClick={handleAutoLayout} size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Auto-Layout
              </NeuralButton>
              <NeuralButton
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Layout
                  </>
                )}
              </NeuralButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div
                ref={containerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative h-[700px] bg-slate-50 overflow-hidden"
              >
                {/* SVG Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {connectionPaths}
                </svg>

                {/* Course Nodes */}
                {courses.map(course => (
                  <div
                    key={course.id}
                    draggable
                    onDragStart={handleDragStart(course.id)}
                    onClick={() => setSelectedCourse(course)}
                    className={`
                      absolute w-24 h-24 -ml-12 -mt-12 rounded-full
                      flex flex-col items-center justify-center
                      bg-gradient-to-br from-blue-500 to-purple-600
                      text-white text-xs font-bold text-center px-2
                      cursor-move hover:scale-110 transition-all
                      shadow-lg hover:shadow-xl
                      ${selectedCourse?.id === course.id ? 'ring-4 ring-yellow-400' : ''}
                      ${draggedCourse === course.id ? 'opacity-50' : ''}
                    `}
                    style={{
                      left: `${course.program_position_x}%`,
                      top: `${course.program_position_y}%`
                    }}
                  >
                    <span className="line-clamp-2">{course.title}</span>
                    {course.prerequisite_course_ids.length > 0 && (
                      <span className="text-[10px] mt-1 opacity-75">
                        {course.prerequisite_course_ids.length} prereq
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Course Details */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              {selectedCourse ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg">{selectedCourse.title}</h3>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="text-sm text-slate-600 space-y-2">
                    <p><strong>Author:</strong> {selectedCourse.author}</p>
                    <p><strong>Modules:</strong> {selectedCourse.moduleCount}</p>
                    <p>
                      <strong>Position:</strong> ({selectedCourse.program_position_x.toFixed(1)}%, {selectedCourse.program_position_y.toFixed(1)}%)
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">
                      <Settings className="h-4 w-4 inline mr-1" />
                      Prerequisites
                    </label>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {courses
                        .filter(c => c.id !== selectedCourse.id)
                        .map(course => {
                          // Always read from courses array, not selectedCourse (which may be stale)
                          const currentCourse = courses.find(c => c.id === selectedCourse.id);
                          const isChecked = currentCourse?.prerequisite_course_ids.includes(course.id) ?? false;

                          return (
                            <label key={course.id} className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentPrereqs = currentCourse?.prerequisite_course_ids || [];
                                  const newPrereqs = e.target.checked
                                    ? [...currentPrereqs, course.id]
                                    : currentPrereqs.filter(id => id !== course.id);
                                  updatePrerequisites(selectedCourse.id, newPrereqs);
                                }}
                                className="mt-1"
                              />
                              <span className="flex-1">{course.title}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Click a course to edit prerequisites</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
