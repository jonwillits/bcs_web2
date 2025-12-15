'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, LogIn, Eye, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { NeuralButton } from '@/components/ui/neural-button';
import { QuestBreadcrumb } from '@/components/navigation/QuestBreadcrumb';

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
}

interface CurriculumMapData {
  courses: Course[];
  totalCourses: number;
}

interface CurriculumMapPublicProps {
  pathTitle?: string;
  pathSlug?: string;
}

export function CurriculumMapPublic({ pathTitle, pathSlug }: CurriculumMapPublicProps) {
  const [data, setData] = useState<CurriculumMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch curriculum map data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const url = pathSlug
          ? `/api/paths/${pathSlug}`
          : '/api/curriculum/map';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch curriculum map');
        }
        const json = await response.json();

        // Handle response structure difference between curriculum and path endpoints
        if (pathSlug) {
          setData({
            courses: json.courses,
            totalCourses: json.courses.length
          });
        } else {
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching curriculum map:', error);
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

        return (
          <path
            key={`${prereq.id}-${course.id}`}
            d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
            opacity="0.5"
            className="transition-all duration-300"
          />
        );
      })
    );
  }, [data, mapDimensions]);

  const handleNodeClick = (course: Course) => {
    router.push(`/courses/${course.slug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white">
        <div className="text-center">
          <MapIcon className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-lg">Loading curriculum map...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-lg text-red-400">Failed to load curriculum map</p>
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
    : [{ label: 'Curriculum Map' }];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Public Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <QuestBreadcrumb
            items={breadcrumbItems}
            icon={<MapIcon size={24} />}
          />
          <p className="text-xs text-slate-400 hidden sm:block">• {data.totalCourses} Courses</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          <Link href="/courses">
            <NeuralButton variant="outline" size="sm" className="hidden sm:flex">
              <Eye className="h-4 w-4 mr-2" />
              Browse Courses
            </NeuralButton>
            <NeuralButton variant="outline" size="sm" className="sm:hidden">
              <Eye className="h-4 w-4" />
            </NeuralButton>
          </Link>
          <Link href="/auth/login">
            <NeuralButton variant="neural" size="sm" className="hidden sm:flex">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Track Progress
            </NeuralButton>
            <NeuralButton variant="neural" size="sm" className="sm:hidden">
              <LogIn className="h-4 w-4" />
            </NeuralButton>
          </Link>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative flex-1 overflow-auto custom-scrollbar">
        <div className="relative w-full min-h-[800px] max-w-5xl mx-auto py-20 px-4" ref={containerRef}>
          {/* SVG Connections */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
            {connectionPaths}
          </svg>

          {/* Course Nodes */}
          {data.courses.map(course => (
            <button
              key={course.id}
              onClick={() => handleNodeClick(course)}
              className="
                absolute w-20 h-20 -ml-10 -mt-10 rounded-full
                bg-slate-700 border-4 border-slate-600
                text-slate-300
                flex items-center justify-center
                transition-all duration-300 hover:scale-110
                hover:bg-slate-600 hover:border-slate-500
                focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-slate-950 focus:ring-blue-500
                cursor-pointer
                shadow-lg hover:shadow-xl
              "
              style={{
                left: `${course.position.x}%`,
                top: `${course.position.y}%`
              }}
            >
              <Eye size={24} />

              {/* Tooltip */}
              <div className="absolute top-24 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-10">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800/90 border border-slate-700 text-slate-300 shadow-lg">
                  {course.title}
                </span>
                <div className="text-center mt-1">
                  <span className="text-xs text-slate-500">{course.moduleCount} modules</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Call to Action Footer */}
      <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 text-center shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <p className="text-slate-300 text-sm sm:text-base">
              Sign in to track your progress across <span className="font-bold text-blue-400">{data.totalCourses} courses</span> and unlock your learning path!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/login">
              <NeuralButton variant="neural" className="w-full sm:w-auto">
                Sign In
              </NeuralButton>
            </Link>
            <Link href="/auth/register">
              <NeuralButton variant="outline" className="w-full sm:w-auto">
                Create Account
              </NeuralButton>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
