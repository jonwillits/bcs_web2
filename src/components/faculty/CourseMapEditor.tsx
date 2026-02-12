'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Save,
  RotateCcw,
  Info,
  X,
  Settings,
  AlertCircle,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import { autoLayoutModules, needsAutoLayout, validatePrerequisites } from '@/lib/course-map-layout';
import { toast } from 'sonner';

interface Module {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prerequisite_module_ids: string[];
  course_map_position_x: number;
  course_map_position_y: number;
  xp_reward: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'boss';
  quest_type: 'standard' | 'challenge' | 'boss' | 'bonus';
  status: 'draft' | 'published';
}

// Difficulty colors
const DIFFICULTY_COLORS = {
  beginner: 'from-green-400 to-green-600',
  intermediate: 'from-blue-400 to-blue-600',
  advanced: 'from-orange-400 to-orange-600',
  boss: 'from-red-500 to-purple-700'
};

// Quest type badges
const QUEST_TYPE_ICONS = {
  standard: '📚',
  challenge: '⚡',
  boss: '👑',
  bonus: '⭐'
};

export function CourseMapEditor() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch modules
  useEffect(() => {
    async function fetchModules() {
      try {
        const response = await fetch('/api/faculty/course-map/layout');
        if (!response.ok) throw new Error('Failed to fetch modules');
        const data = await response.json();

        let modulesToSet = data.modules;

        // Auto-layout if needed
        if (needsAutoLayout(data.modules)) {
          const layouted = autoLayoutModules(data.modules);
          // Remove depth property
          modulesToSet = layouted.map(({ depth, ...rest }) => rest as Module);
          setHasUnsavedChanges(true); // Mark as unsaved since we auto-layouted
        }

        setModules(modulesToSet);
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast.error('Failed to load modules');
      } finally {
        setLoading(false);
      }
    }
    fetchModules();
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
  }, [modules]);

  // Handle module drag
  const handleDragStart = (moduleId: string) => (e: React.DragEvent) => {
    setDraggedModule(moduleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedModule || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setModules(prev =>
      prev.map(module =>
        module.id === draggedModule
          ? {
              ...module,
              course_map_position_x: Math.max(5, Math.min(95, x)),
              course_map_position_y: Math.max(5, Math.min(95, y))
            }
          : module
      )
    );

    setDraggedModule(null);
    setHasUnsavedChanges(true);
  };

  // Handle auto-layout
  const handleAutoLayout = () => {
    const layouted = autoLayoutModules(modules);
    // Remove the depth property from layouted modules
    const modulesWithoutDepth = layouted.map(({ depth, ...rest }) => rest as Module);
    setModules(modulesWithoutDepth);
    setHasUnsavedChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate prerequisites first
      const validation = validatePrerequisites(modules);
      if (!validation.valid) {
        toast.error('Validation Error', {
          description: validation.errors.join('. '),
        });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/faculty/course-map/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules })
      });

      if (!response.ok) throw new Error('Failed to save');

      setHasUnsavedChanges(false);
      toast.success('Success!', {
        description: 'Course map layout saved successfully!',
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Save Failed', {
        description: 'Failed to save course map layout. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Update prerequisites
  const updatePrerequisites = (moduleId: string, prerequisiteIds: string[]) => {
    setModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? { ...module, prerequisite_module_ids: prerequisiteIds }
          : module
      )
    );
    setHasUnsavedChanges(true);
  };

  // Calculate SVG paths
  const connectionPaths = useMemo(() => {
    if (mapDimensions.width === 0) return null;

    return modules.flatMap(module =>
      (module.prerequisite_module_ids || []).map(prereqId => {
        const prereq = modules.find(m => m.id === prereqId);
        if (!prereq) return null;

        const startX = (prereq.course_map_position_x / 100) * mapDimensions.width;
        const startY = (prereq.course_map_position_y / 100) * mapDimensions.height;
        const endX = (module.course_map_position_x / 100) * mapDimensions.width;
        const endY = (module.course_map_position_y / 100) * mapDimensions.height;

        const controlY1 = startY + (endY - startY) / 2;
        const controlY2 = startY + (endY - startY) / 2;

        return (
          <path
            key={`${prereq.id}-${module.id}`}
            d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            opacity="0.5"
            className="pointer-events-none"
          />
        );
      })
    );
  }, [modules, mapDimensions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-neural-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Controls - Responsive */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-2 flex-1">
              <Info className="h-5 w-5 text-neural-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base">Course Map Editor</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Drag modules to position them. Click to edit prerequisites.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {hasUnsavedChanges && (
                <span className="text-xs md:text-sm text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Unsaved changes</span>
                </span>
              )}
              <NeuralButton variant="outline" onClick={handleAutoLayout} size="sm" className="flex-1 sm:flex-initial">
                <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="text-xs md:text-sm">Auto-Layout</span>
              </NeuralButton>
              <NeuralButton
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
                    <span className="text-xs md:text-sm">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Save Layout</span>
                  </>
                )}
              </NeuralButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <Card>
            <CardContent className="p-0">
              <div
                ref={containerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative h-[500px] md:h-[700px] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden"
              >
                {/* SVG Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {connectionPaths}
                </svg>

                {/* Module Nodes */}
                {modules.map(module => (
                  <div
                    key={module.id}
                    draggable
                    onDragStart={handleDragStart(module.id)}
                    onClick={() => setSelectedModule(module)}
                    className={`
                      absolute w-20 h-20 sm:w-24 sm:h-24 -ml-10 sm:-ml-12 -mt-10 sm:-mt-12 rounded-full
                      flex flex-col items-center justify-center
                      bg-gradient-to-br ${DIFFICULTY_COLORS[module.difficulty_level]}
                      text-white text-[10px] sm:text-xs font-bold text-center px-1 sm:px-2
                      cursor-move hover:scale-110 transition-all
                      shadow-lg hover:shadow-xl
                      ${selectedModule?.id === module.id ? 'ring-4 ring-yellow-400' : ''}
                      ${draggedModule === module.id ? 'opacity-50' : ''}
                    `}
                    style={{
                      left: `${module.course_map_position_x}%`,
                      top: `${module.course_map_position_y}%`
                    }}
                  >
                    <span className="text-sm sm:text-base mb-0.5">{QUEST_TYPE_ICONS[module.quest_type]}</span>
                    <span className="line-clamp-2 leading-tight">{module.title}</span>
                    {module.prerequisite_module_ids.length > 0 && (
                      <span className="text-[8px] sm:text-[10px] mt-0.5 opacity-75">
                        {module.prerequisite_module_ids.length} prereq
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Module Details - Responsive */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <Card className="lg:sticky lg:top-4">
            <CardContent className="p-3 md:p-4">
              {selectedModule ? (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base md:text-lg line-clamp-2 flex-1">{selectedModule.title}</h3>
                    <button
                      onClick={() => setSelectedModule(null)}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <X className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  </div>

                  {/* Module Stats */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    <Badge className={`bg-gradient-to-r ${DIFFICULTY_COLORS[selectedModule.difficulty_level]} text-white border-0 text-[10px] md:text-xs`}>
                      <Target className="h-3 w-3 mr-1" />
                      {selectedModule.difficulty_level}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] md:text-xs">
                      <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                      {selectedModule.xp_reward} XP
                    </Badge>
                    <Badge variant="outline" className="text-[10px] md:text-xs">
                      <Zap className="h-3 w-3 mr-1 text-purple-500" />
                      {selectedModule.quest_type}
                    </Badge>
                  </div>

                  <div className="text-xs md:text-sm text-muted-foreground space-y-1.5 md:space-y-2">
                    <p>
                      <strong>Position:</strong> ({selectedModule.course_map_position_x.toFixed(1)}%, {selectedModule.course_map_position_y.toFixed(1)}%)
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <Badge variant={selectedModule.status === 'published' ? 'default' : 'outline'} className="text-[10px]">
                        {selectedModule.status}
                      </Badge>
                    </p>
                  </div>

                  <div className="border-t pt-3 md:pt-4">
                    <label className="block text-xs md:text-sm font-medium mb-2">
                      <Settings className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                      Prerequisites
                    </label>
                    <div className="space-y-2 max-h-60 md:max-h-80 overflow-y-auto">
                      {modules
                        .filter(m => m.id !== selectedModule.id)
                        .map(module => {
                          const currentModule = modules.find(m => m.id === selectedModule.id);
                          const isChecked = currentModule?.prerequisite_module_ids.includes(module.id) ?? false;

                          return (
                            <label key={module.id} className="flex items-start gap-2 text-xs md:text-sm hover:bg-accent/50 p-1.5 md:p-2 rounded transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentPrereqs = currentModule?.prerequisite_module_ids || [];
                                  const newPrereqs = e.target.checked
                                    ? [...currentPrereqs, module.id]
                                    : currentPrereqs.filter(id => id !== module.id);
                                  updatePrerequisites(selectedModule.id, newPrereqs);
                                }}
                                className="mt-0.5 md:mt-1 rounded border-gray-300 text-neural-primary focus:ring-neural-primary"
                              />
                              <span className="flex-1 leading-tight">{module.title}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-slate-400">
                  <Settings className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs md:text-sm">Click a module to edit prerequisites</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
