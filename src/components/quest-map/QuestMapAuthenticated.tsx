'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map as MapIcon,
  Check,
  Lock,
  Play,
  Trophy,
  Target,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';
import { QuestBreadcrumb } from '@/components/navigation/QuestBreadcrumb';

type QuestStatus = 'locked' | 'available' | 'active' | 'completed';

interface Quest {
  id: string;
  title: string;
  slug: string;
  description: string;
  position: { x: number; y: number };
  prerequisites: string[];
  xp: number;
  difficulty: string;
  estimatedMinutes: number | null;
  type: string;
  status: QuestStatus;
  completedAt: string | null;
  startedAt: string | null;
  xpEarned: number;
}

interface QuestMapData {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
  };
  quests: Quest[];
  userProgress: {
    totalXP: number;
    level: number;
    completedCount: number;
    totalCount: number;
    completionPct: number;
    currentStreak: number;
    longestStreak: number;
  };
}

interface QuestMapAuthenticatedProps {
  courseSlug: string;
  userId: string;
}

export function QuestMapAuthenticated({ courseSlug, userId }: QuestMapAuthenticatedProps) {
  const [data, setData] = useState<QuestMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch authenticated quest map data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/by-slug/${courseSlug}/quest-map`);
        if (!response.ok) {
          if (response.status === 403) {
            // Not enrolled - redirect to course page
            router.push(`/courses/${courseSlug}`);
            return;
          }
          throw new Error('Failed to fetch quest map');
        }
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching quest map:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseSlug, router]);

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

    return data.quests.flatMap(quest =>
      quest.prerequisites.map(prereqId => {
        const prereq = data.quests.find(q => q.id === prereqId);
        if (!prereq) return null;

        const startX = (prereq.position.x / 100) * mapDimensions.width;
        const startY = (prereq.position.y / 100) * mapDimensions.height;
        const endX = (quest.position.x / 100) * mapDimensions.width;
        const endY = (quest.position.y / 100) * mapDimensions.height;

        const controlY1 = startY + (endY - startY) / 2;
        const controlY2 = startY + (endY - startY) / 2;

        // Color based on unlock status
        const isUnlocked = prereq.status === 'completed';
        const stroke = isUnlocked ? '#3b82f6' : '#334155';
        const dashArray = isUnlocked ? '0' : '8 4';

        return (
          <path
            key={`${prereq.id}-${quest.id}`}
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

  const getStatusColor = (status: QuestStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]';
      case 'active':
        return 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse-slow';
      case 'available':
        return 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.5)]';
      default: // locked
        return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const getStatusIcon = (status: QuestStatus, type: string) => {
    if (status === 'completed') return <Check size={20} strokeWidth={3} />;
    if (status === 'locked') return <Lock size={18} />;
    if (type === 'boss') return <Trophy size={20} />;
    if (status === 'active') return <Play size={20} fill="currentColor" />;
    return <Target size={20} />;
  };

  const handleNodeClick = (quest: Quest) => {
    if (quest.status !== 'locked') {
      router.push(`/courses/${courseSlug}/${quest.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white">
        <div className="text-center">
          <MapIcon className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-lg">Loading your quest map...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-lg text-red-400">Failed to load quest map</p>
          <p className="text-slate-500 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Progress HUD */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <QuestBreadcrumb
            items={[
              { label: 'Curriculum', href: '/curriculum/map' },
              { label: data.course.title, href: `/courses/${courseSlug}` },
              { label: 'Quest Map' }
            ]}
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

          {/* Completion */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
              <span className="hidden sm:inline">{data.userProgress.completionPct}% Complete</span>
              <span className="sm:hidden">{data.userProgress.completionPct}%</span>
              <span className="text-slate-500">({data.userProgress.completedCount}/{data.userProgress.totalCount})</span>
            </div>
            <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 ease-out"
                style={{ width: `${data.userProgress.completionPct}%` }}
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

          {/* Quest Nodes */}
          {data.quests.map(quest => (
            <button
              key={quest.id}
              onClick={() => handleNodeClick(quest)}
              disabled={quest.status === 'locked'}
              className={`
                absolute w-16 h-16 -ml-8 -mt-8 rounded-full
                flex items-center justify-center border-4
                transition-all duration-300 hover:scale-110
                focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-slate-950 focus:ring-blue-500
                z-10
                ${getStatusColor(quest.status)}
                ${quest.status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                left: `${quest.position.x}%`,
                top: `${quest.position.y}%`
              }}
            >
              {getStatusIcon(quest.status, quest.type)}

              {/* Tooltip */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border shadow-lg
                  ${quest.status === 'completed'
                    ? 'bg-green-900/80 border-green-500/50 text-green-200'
                    : quest.status === 'active'
                    ? 'bg-blue-900/80 border-blue-500/50 text-blue-200'
                    : quest.status === 'available'
                    ? 'bg-purple-900/80 border-purple-500/50 text-purple-200'
                    : 'bg-slate-900/80 border-slate-700 text-slate-500'
                  }
                `}>
                  {quest.title}
                </span>
                <div className="text-center mt-1">
                  <span className="text-xs text-slate-400">
                    {quest.xpEarned > 0 ? `${quest.xpEarned} XP earned` : `${quest.xp} XP`}
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
