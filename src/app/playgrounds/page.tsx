'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Plus, Eye, Calendar, Box, Brain, BarChart3, GitBranch, Layout, GraduationCap, Folder, Code } from 'lucide-react';
import { Header } from '@/components/Header';
import { PLAYGROUND_TEMPLATES } from '@/lib/react-playground/templates';
import { PlaygroundCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types/react-playground';

// Icon mapping for categories
const CategoryIcon = ({ category }: { category: PlaygroundCategory }) => {
  const icons: Record<PlaygroundCategory, React.ReactNode> = {
    'simulations': <Brain className="h-5 w-5" />,
    'visualizations': <BarChart3 className="h-5 w-5" />,
    '3d-graphics': <Box className="h-5 w-5" />,
    'neural-networks': <Brain className="h-5 w-5" />,
    'algorithms': <GitBranch className="h-5 w-5" />,
    'ui-components': <Layout className="h-5 w-5" />,
    'tutorials': <GraduationCap className="h-5 w-5" />,
    'other': <Folder className="h-5 w-5" />,
  };
  return icons[category] || <Code className="h-5 w-5" />;
};

export default function PlaygroundsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PlaygroundCategory | 'all'>('all');
  const [playgrounds, setPlaygrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isFaculty =
    session?.user?.role === 'faculty' || session?.user?.role === 'admin';

  // Fetch playgrounds from API
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '12',
      public: 'true',
      ...(activeFilter !== 'all' && { category: activeFilter }),
    });

    fetch(`/api/playgrounds?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPlaygrounds(data.playgrounds || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch playgrounds:', error);
        setLoading(false);
      });
  }, [page, activeFilter]);

  // Filter by search
  const filteredPlaygrounds = playgrounds.filter((playground) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      playground.title.toLowerCase().includes(query) ||
      playground.description?.toLowerCase().includes(query)
    );
  });

  // Filter featured templates by search query and category
  const filteredTemplates = PLAYGROUND_TEMPLATES.filter((template) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query));
      if (!matches) return false;
    }

    // Filter by category
    if (activeFilter !== 'all' && template.category !== activeFilter) {
      return false;
    }

    return true;
  });

  const categories: { id: PlaygroundCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'simulations', label: 'Simulations' },
    { id: 'visualizations', label: 'Visualizations' },
    { id: '3d-graphics', label: '3D Graphics' },
    { id: 'neural-networks', label: 'Neural Networks' },
    { id: 'algorithms', label: 'Algorithms' },
    { id: 'tutorials', label: 'Tutorials' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      {/* Page Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">Interactive Playgrounds</h1>
              <p className="text-lg text-gray-400 mt-2">
                Explore interactive React simulations and visualizations
              </p>
            </div>
            {isFaculty && (
              <Link
                href="/playgrounds/builder?new=true"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90 transition-colors font-semibold"
              >
                <Plus className="h-5 w-5" />
                Create Playground
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playgrounds..."
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-neural-primary focus:border-transparent text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveFilter(category.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === category.id
                    ? 'bg-neural-primary text-white'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Templates Section */}
        {filteredTemplates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {searchQuery || activeFilter !== 'all' ? 'Matching Templates' : 'Featured Templates'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {searchQuery || activeFilter !== 'all'
                    ? `${filteredTemplates.length} template(s) found`
                    : 'Start with these professionally designed templates'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {filteredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/playgrounds/builder?template=${template.id}`}
                  className="group bg-gray-900 rounded-lg border border-gray-800 hover:border-neural-primary/50 hover:shadow-lg hover:shadow-neural-primary/10 transition-all p-6"
                >
                  <div className="w-12 h-12 bg-neural-primary/20 rounded-lg flex items-center justify-center mb-4 text-neural-primary">
                    <CategoryIcon category={template.category} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neural-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
            {(playgrounds.length > 0 || loading) && (
              <div className="border-t border-gray-800 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6">Community Playgrounds</h2>
              </div>
            )}
          </div>
        )}

        {/* Show message if no templates match but there are community playgrounds */}
        {filteredTemplates.length === 0 && (searchQuery || activeFilter !== 'all') && (
          <div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400">
              No featured templates match your search. Check out community playgrounds below.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading playgrounds...</p>
          </div>
        )}

        {/* Playgrounds Grid */}
        {!loading && filteredPlaygrounds.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPlaygrounds.map((playground) => (
                <Link
                  key={playground.id}
                  href={`/playgrounds/${playground.id}`}
                  className="group bg-gray-900 rounded-lg border border-gray-800 hover:border-neural-primary/50 hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Preview/Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-neural-primary/30 to-purple-600/30 relative">
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gray-900/90 rounded-full text-xs font-medium text-gray-300">
                        {CATEGORY_LABELS[playground.category as PlaygroundCategory] ||
                          playground.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {/* Code icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Code className="h-16 w-16 text-white/20" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neural-primary transition-colors">
                      {playground.title}
                    </h3>
                    {playground.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {playground.description}
                      </p>
                    )}

                    {/* Author */}
                    {playground.author && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span>by {playground.author.name}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {playground.view_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(playground.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && filteredPlaygrounds.length === 0 && filteredTemplates.length === 0 && (
          <div className="text-center py-16 bg-gray-900 rounded-lg border border-gray-800">
            <div className="w-16 h-16 bg-neural-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-neural-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || activeFilter !== 'all' ? 'No playgrounds found' : 'No playgrounds yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to create an interactive playground'}
            </p>
            {isFaculty && (
              <Link
                href="/playgrounds/builder?new=true"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90 transition-colors font-semibold"
              >
                <Plus className="h-5 w-5" />
                Create Playground
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
