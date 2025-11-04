"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShinyliveCategory } from '@/types/shinylive';
import { getFeaturedShinyliveTemplates } from '@/templates/shinylive';

export default function PlaygroundsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ShinyliveCategory | 'all'>('all');
  const [playgrounds, setPlaygrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const featuredTemplates = getFeaturedShinyliveTemplates();

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
  const filteredTemplates = featuredTemplates.filter((template) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.requirements.some(req => req.toLowerCase().includes(query));
      if (!matches) return false;
    }

    // Filter by category
    if (activeFilter !== 'all' && template.category !== activeFilter) {
      return false;
    }

    return true;
  });

  const categories = [
    { id: 'all' as const, label: 'All Playgrounds', icon: '🎮' },
    { id: ShinyliveCategory.DATA_VIZ, label: 'Data Visualization', icon: '📊' },
    { id: ShinyliveCategory.NEURAL_NETWORKS, label: 'Neural Networks', icon: '🧠' },
    { id: ShinyliveCategory.ALGORITHMS, label: 'Algorithms', icon: '🔢' },
    { id: ShinyliveCategory.PHYSICS, label: 'Physics', icon: '⚛️' },
    { id: ShinyliveCategory.MATHEMATICS, label: 'Mathematics', icon: '📐' },
    { id: ShinyliveCategory.SIMULATIONS, label: 'Simulations', icon: '🎲' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Interactive Playgrounds</h1>
              <p className="text-lg text-gray-600 mt-2">
                Explore interactive educational simulations powered by Shinylive
              </p>
            </div>
            <Link
              href="/playgrounds/builder"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              + Create Playground
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playgrounds..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-4 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Filter by Category</h2>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Templates Section - Always show if templates match filter */}
        {filteredTemplates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery || activeFilter !== 'all' ? 'Matching Templates' : 'Featured Templates'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {searchQuery || activeFilter !== 'all'
                    ? `${filteredTemplates.length} template(s) found`
                    : 'Start with these professionally designed templates'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/playgrounds/builder?template=${template.id}`}
                  className="group bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-6"
                >
                  <div className="text-4xl mb-4">
                    {template.category === ShinyliveCategory.DATA_VIZ && '📊'}
                    {template.category === ShinyliveCategory.NEURAL_NETWORKS && '🧠'}
                    {template.category === ShinyliveCategory.ALGORITHMS && '🔢'}
                    {template.category === ShinyliveCategory.PHYSICS && '⚛️'}
                    {template.category === ShinyliveCategory.MATHEMATICS && '📐'}
                    {template.category === ShinyliveCategory.SIMULATIONS && '🎲'}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.requirements.slice(0, 3).map((req) => (
                      <span
                        key={req}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Playgrounds</h2>
            </div>
          </div>
        )}

        {/* Show message if no templates match but there are community playgrounds */}
        {filteredTemplates.length === 0 && (searchQuery || activeFilter !== 'all') && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              No featured templates match your search. Check out community playgrounds below.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading playgrounds...</p>
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
                  className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Preview/Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium text-gray-700">
                        {playground.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {playground.title}
                    </h3>
                    {playground.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>👁 {playground.view_count} views</span>
                      <span>📅 {new Date(playground.created_at).toLocaleDateString()}</span>
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && filteredPlaygrounds.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery || activeFilter !== 'all' ? 'No playgrounds found' : 'No playgrounds yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to create an interactive playground'}
            </p>
            <Link
              href="/playgrounds/builder"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Create Playground
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
