import Link from 'next/link';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { NeuralButton } from '@/components/ui/neural-button';
import { Map, BookOpen, Users, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Learning Paths | BCS E-Textbook',
  description: 'Explore curated learning paths designed to guide your educational journey'
};

export default async function LearningPathsPage() {
  const paths = await withDatabaseRetry(async () => {
    return await prisma.learning_paths.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        course_ids: true,
        is_featured: true,
        sort_order: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            title: true,
            department: true
          }
        }
      },
      orderBy: [
        { is_featured: 'desc' },
        { sort_order: 'asc' },
        { created_at: 'desc' }
      ]
    });
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Header */}
        <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-4">
              <Map className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Learning Paths</h1>
            </div>
            <p className="text-slate-400 max-w-2xl">
              Follow curated learning paths designed by expert instructors. Each path guides you through
              a structured curriculum to achieve specific learning goals.
            </p>
            <div className="mt-6">
              <Link href="/curriculum/map">
                <NeuralButton className="bg-blue-600 text-white hover:bg-blue-700 border-blue-500">
                  <Map className="h-4 w-4 mr-2" />
                  View Full Curriculum Map
                </NeuralButton>
              </Link>
            </div>
          </div>
        </div>

      {/* Learning Paths Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {paths.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-xl text-slate-400">No learning paths available yet</p>
            <p className="text-slate-500 mt-2">Check back soon for curated learning paths</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.slug}`}
                className="block p-6 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-300 hover:scale-105 group backdrop-blur-sm"
              >
                {/* Featured Badge */}
                {path.is_featured && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold mb-3">
                    ⭐ Featured
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  {path.title}
                </h3>

                {/* Description */}
                {path.description && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                    {path.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{path.course_ids.length} courses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>By {path.creator.name}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm group-hover:gap-3 transition-all">
                  <span>Explore Path</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
