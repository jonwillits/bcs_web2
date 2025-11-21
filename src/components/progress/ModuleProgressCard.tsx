import Link from 'next/link';
import { Check, Circle, BookOpen } from 'lucide-react';

interface ModuleProgressCardProps {
  module: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
  };
  courseSlug: string;
  status: 'not_started' | 'completed';
  completedAt?: Date | null;
}

export function ModuleProgressCard({
  module,
  courseSlug,
  status,
  completedAt,
}: ModuleProgressCardProps) {
  const isCompleted = status === 'completed';

  return (
    <Link
      href={`/courses/${courseSlug}/${module.slug}`}
      className="block cognitive-card p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div
          className={`flex-shrink-0 rounded-full p-2 ${
            isCompleted
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground hover:text-neural-primary transition-colors">
              {module.title}
            </h3>
            {isCompleted && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Completed
              </span>
            )}
          </div>

          {module.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          )}

          {completedAt && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3" />
              Completed on {new Date(completedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* View Icon */}
        <div className="flex-shrink-0">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
