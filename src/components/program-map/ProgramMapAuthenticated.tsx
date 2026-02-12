'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map as MapIcon,
  Check,
  Lock,
  Play,
  Target,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';
import { QuestBreadcrumb } from '@/components/navigation/QuestBreadcrumb';

type CourseStatus = 'locked' | 'available' | 'in_progress' | 'completed';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  featured: boolean;
  position: { x: number; y: number };
  prerequisites: string[];
  moduleCount: number;
  instructor: {
    name: string;
    avatar_url: string | null;
    title: string | null;
    department: string | null;
  };
  status: CourseStatus;
  completionPct: number;
  modulesCompleted: number;
  modulesTotal: number;
  startedAt: string | null;
  isCompleted: boolean;
}

interface ProgramMapData {
  courses: Course[];
  totalCourses: number;
  userProgress: {
    totalXP: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    coursesStarted: number;
    coursesCompleted: number;
  };
}

interface ProgramMapAuthenticatedProps {
  userId: string;
  pathTitle?: string; // If viewing a learning path
  pathSlug?: string;
}

export function ProgramMapAuthenticated({
  userId,
  pathTitle,
  pathSlug
}: ProgramMapAuthenticatedProps) {
  const [data, setData] = useState<ProgramMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch program map data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const url = pathSlug
          ? `/api/paths/${pathSlug}`
          : '/api/program/map';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch program map');
        }
        const json = await response.json();

        // Handle response structure difference between program and path endpoints
        if (pathSlug) {
          setData({
            courses: json.courses,
            totalCourses: json.courses.length,
            userProgress: {
              totalXP: 0,
              level: 1,
              currentStreak: 0,
              longestStreak: 0,
              coursesStarted: json.pathProgress?.coursesInProgress || 0,
              coursesCompleted: json.pathProgress?.coursesCompleted || 0
            }
          });
        } else {
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching program map:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [pathSlug]);

  // Update map dimensions on resize
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
  }, [data]);

  // Calculate SVG paths for connections
  const connectionPaths = useMemo(() => {
    if (!data || mapDimensions.width === 0) return null;

    return data.courses.flatMap(course =>
      course.prerequisites.map(prereqId => {
        const prereq = data.courses.find(c => c.id === prereqId);
        if (!prereq) return null;

        const startX = (prereq.position.x / 100) * mapDimensions.width;
        const startY = (prereq.position.y / 100) * mapDimensions.height;
        const endX = (course.position.x / 100) * mapDimensions.width;
        const endY = (course.position.y / 100) * mapDimensions.height;

        const controlY1 = startY + (endY - startY) / 2;
        const controlY2 = startY + (endY - startY) / 2;

        // Color based on unlock status
        const isUnlocked = prereq.status === 'completed';
        const stroke = isUnlocked ? '#3b82f6' : '#334155';
        const dashArray = isUnlocked ? '0' : '8 4';

        return (
          <path
            key={`${prereq.id}-${course.id}`}
            d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeDasharray={dashArray}
            opacity="0.8"
            className="transition-all duration-1000 ease-in-out"
          />
        );
      })
    );
  }, [data, mapDimensions]);

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]';
      case 'in_progress':
        return 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse-slow';
      case 'available':
        return 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.5)]';
      default: // locked
        return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const getStatusIcon = (status: CourseStatus) => {
    if (status === 'completed') return <Check size={24} strokeWidth={3} />;
    if (status === 'locked') return <Lock size={22} />;
    if (status === 'in_progress') return <Play size={24} fill="currentColor" />;
    return <Target size={24} />;
  };

  const handleNodeClick = (course: Course) => {
    if (course.status !== 'locked') {
      // Zoom into course map
      router.push(`/courses/${course.slug}/map`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white">
        <div className="text-center">
          <MapIcon className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-lg">Loading program map...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-lg text-red-400">Failed to load program map</p>
        </div>
      </div>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = pathSlug
    ? [
        { label: 'Learning Paths', href: '/paths' },
        { label: pathTitle || 'Path' }
      ]
    : [{ label: 'Program Map' }];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Progress HUD */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <QuestBreadcrumb
            items={breadcrumbItems}
            icon={<MapIcon size={24} />}
          />
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 ml-2">
          {/* Progress Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="font-bold text-yellow-400">{data.userProgress.totalXP} XP</span>
              <span className="text-slate-500">• Level {data.userProgress.level}</span>
            </div>
            {data.userProgress.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-orange-400">🔥</span>
                <span className="font-bold text-orange-400">{data.userProgress.currentStreak}</span>
                <span className="text-slate-500">day streak</span>
              </div>
            )}
          </div>

          {/* Course Completion */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
              <span className="hidden sm:inline">{data.userProgress.coursesCompleted}/{data.totalCourses} Courses</span>
              <span className="sm:hidden">{data.userProgress.coursesCompleted}/{data.totalCourses}</span>
            </div>
            <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 ease-out"
                style={{ width: `${(data.userProgress.coursesCompleted / data.totalCourses) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative flex-1 overflow-auto custom-scrollbar">
        <div className="relative w-full min-h-[800px] max-w-5xl mx-auto py-20 px-4" ref={containerRef}>
          {/* SVG Connections */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
            {connectionPaths}
          </svg>

          {/* Course Nodes */}
          {data.courses.map(course => (
            <button
              key={course.id}
              onClick={() => handleNodeClick(course)}
              disabled={course.status === 'locked'}
              className={`
                absolute w-20 h-20 -ml-10 -mt-10 rounded-full
                flex items-center justify-center border-4
                transition-all duration-300 hover:scale-110
                focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-slate-950 focus:ring-blue-500
                z-10
                ${getStatusColor(course.status)}
                ${course.status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                left: `${course.position.x}%`,
                top: `${course.position.y}%`
              }}
            >
              {getStatusIcon(course.status)}

              {/* Tooltip */}
              <div className="absolute top-24 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border shadow-lg
                  ${course.status === 'completed'
                    ? 'bg-green-900/80 border-green-500/50 text-green-200'
                    : course.status === 'in_progress'
                    ? 'bg-blue-900/80 border-blue-500/50 text-blue-200'
                    : course.status === 'available'
                    ? 'bg-purple-900/80 border-purple-500/50 text-purple-200'
                    : 'bg-slate-900/80 border-slate-700 text-slate-500'
                  }
                `}>
                  {course.title}
                </span>
                <div className="text-center mt-1">
                  <span className="text-xs text-slate-400">
                    {course.isCompleted
                      ? `${course.completionPct}% Complete`
                      : `${course.moduleCount} Modules`}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Footer (Mobile) */}
      <div className="md:hidden p-3 bg-slate-900 border-t border-slate-800 text-center shrink-0">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="font-bold text-yellow-400">{data.userProgress.totalXP} XP</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-purple-400" />
            <span className="text-slate-300">Level {data.userProgress.level}</span>
          </div>
          {data.userProgress.currentStreak > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1">
                <span className="text-orange-400">🔥</span>
                <span className="text-orange-400">{data.userProgress.currentStreak} days</span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
