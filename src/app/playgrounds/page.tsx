'use client';

/**
 * Playgrounds Gallery Page
 *
 * Unified view with tabs:
 * - All: Featured + Community playgrounds
 * - Featured: is_featured=true (curated content)
 * - Community: is_featured=false, is_public=true (user-created)
 * - My Playgrounds: Current user's playgrounds (logged-in only)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search,
  Plus,
  Eye,
  Calendar,
  Box,
  Brain,
  BarChart3,
  GitBranch,
  Layout,
  GraduationCap,
  Folder,
  Code,
  Star,
  Users,
  User,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { PlaygroundCategory, CATEGORY_LABELS } from '@/types/react-playground';

type TabType = 'all' | 'featured' | 'community' | 'my-playgrounds';

// Icon mapping for categories
const CategoryIcon = ({ category }: { category: PlaygroundCategory }) => {
  const icons: Record<PlaygroundCategory, React.ReactNode> = {
    simulations: <Brain className="h-5 w-5" />,
    visualizations: <BarChart3 className="h-5 w-5" />,
    '3d-graphics': <Box className="h-5 w-5" />,
    'neural-networks': <Brain className="h-5 w-5" />,
    algorithms: <GitBranch className="h-5 w-5" />,
    'ui-components': <Layout className="h-5 w-5" />,
    tutorials: <GraduationCap className="h-5 w-5" />,
    other: <Folder className="h-5 w-5" />,
  };
  return icons[category] || <Code className="h-5 w-5" />;
};

interface Playground {
  id: string;
  title: string;
  description?: string;
  category: string;
  view_count: number;
  created_at: string;
  is_featured?: boolean;
  is_public?: boolean;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export default function PlaygroundsPage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [activeFilter, setActiveFilter] = useState<PlaygroundCategory | 'all'>('all');

  // Separate state for different sections
  const [featuredPlaygrounds, setFeaturedPlaygrounds] = useState<Playground[]>([]);
  const [communityPlaygrounds, setCommunityPlaygrounds] = useState<Playground[]>([]);
  const [myPlaygrounds, setMyPlaygrounds] = useState<Playground[]>([]);

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);

  const [communityPage, setCommunityPage] = useState(1);
  const [communityTotalPages, setCommunityTotalPages] = useState(1);

  const isLoggedIn = status === 'authenticated';
  const isFaculty = session?.user?.role === 'faculty' || session?.user?.role === 'admin';
  const isAdmin = session?.user?.role === 'admin';

  // Fetch featured playgrounds from database
  useEffect(() => {
    setLoadingFeatured(true);
    const params = new URLSearchParams({
      limit: '50',
      featured: 'true',
      ...(activeFilter !== 'all' && { category: activeFilter }),
    });

    fetch(`/api/playgrounds?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setFeaturedPlaygrounds(data.playgrounds || []);
        setLoadingFeatured(false);
      })
      .catch((error) => {
        console.error('Failed to fetch featured playgrounds:', error);
        setLoadingFeatured(false);
      });
  }, [activeFilter]);

  // Fetch community playgrounds from database
  useEffect(() => {
    setLoadingCommunity(true);
    const params = new URLSearchParams({
      page: communityPage.toString(),
      limit: '12',
      public: 'true',
      featured: 'false',
      ...(activeFilter !== 'all' && { category: activeFilter }),
    });

    fetch(`/api/playgrounds?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setCommunityPlaygrounds(data.playgrounds || []);
        setCommunityTotalPages(data.pagination?.totalPages || 1);
        setLoadingCommunity(false);
      })
      .catch((error) => {
        console.error('Failed to fetch community playgrounds:', error);
        setLoadingCommunity(false);
      });
  }, [communityPage, activeFilter]);

  // Fetch my playgrounds (only when logged in and tab is active)
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'my-playgrounds') return;

    setLoadingMine(true);
    const params = new URLSearchParams({
      limit: '50',
      createdBy: session?.user?.id || '',
    });

    fetch(`/api/playgrounds?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setMyPlaygrounds(data.playgrounds || []);
        setLoadingMine(false);
      })
      .catch((error) => {
        console.error('Failed to fetch my playgrounds:', error);
        setLoadingMine(false);
      });
  }, [isLoggedIn, activeTab, session?.user?.id]);

  // Filter by search query
  const filterBySearch = (items: Playground[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  };

  const filteredFeatured = filterBySearch(featuredPlaygrounds);
  const filteredCommunity = filterBySearch(communityPlaygrounds);
  const filteredMine = filterBySearch(myPlaygrounds);

  const categories: { id: PlaygroundCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'simulations', label: 'Simulations' },
    { id: 'visualizations', label: 'Visualizations' },
    { id: '3d-graphics', label: '3D Graphics' },
    { id: 'neural-networks', label: 'Neural Networks' },
    { id: 'algorithms', label: 'Algorithms' },
    { id: 'tutorials', label: 'Tutorials' },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode; requiresAuth?: boolean }[] = [
    { id: 'all', label: 'All', icon: <Code className="h-4 w-4" /> },
    { id: 'featured', label: 'Featured', icon: <Star className="h-4 w-4" /> },
    { id: 'community', label: 'Community', icon: <Users className="h-4 w-4" /> },
    { id: 'my-playgrounds', label: 'My Playgrounds', icon: <User className="h-4 w-4" />, requiresAuth: true },
  ];

  // Render a playground card
  const PlaygroundCard = ({ playground, showFeaturedBadge = false }: { playground: Playground; showFeaturedBadge?: boolean }) => (
    <Link
      href={`/playgrounds/${playground.id}`}
      className="group bg-gray-900 rounded-lg border border-gray-800 hover:border-neural-primary/50 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Preview/Thumbnail */}
      <div className="h-32 bg-gradient-to-br from-neural-primary/30 to-purple-600/30 relative">
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        <div className="absolute top-3 left-3 flex gap-2">
          {(showFeaturedBadge || playground.is_featured) && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-gray-900/90 rounded-full text-xs font-medium text-gray-300">
            {CATEGORY_LABELS[playground.category as PlaygroundCategory] ||
              playground.category?.replace(/_/g, ' ')}
          </span>
        </div>
        {/* Code icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CategoryIcon category={playground.category as PlaygroundCategory} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-neural-primary transition-colors line-clamp-1">
          {playground.title}
        </h3>
        {playground.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{playground.description}</p>
        )}

        {/* Author */}
        {playground.author && (
          <div className="text-xs text-gray-500 mb-2">by {playground.author.name}</div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {playground.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(playground.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );

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
                Explore interactive simulations and visualizations
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
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playgrounds..."
              className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-neural-primary focus:border-transparent text-white placeholder-gray-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              if (tab.requiresAuth && !isLoggedIn) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-neural-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
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
                  setCommunityPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeFilter === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* ALL Tab */}
        {activeTab === 'all' && (
          <>
            {/* Standalone Tools Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Brain className="h-6 w-6 text-emerald-400" />
                Interactive Tools
              </h2>
              <p className="text-gray-500 mb-6">Advanced standalone learning tools</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  href="/playgrounds/tensorflow"
                  className="group bg-gradient-to-br from-emerald-900/50 to-blue-900/50 rounded-lg border border-emerald-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 relative">
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        Featured Tool
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 bg-gray-900/90 rounded-full text-xs font-medium text-gray-300">
                        Neural Networks
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                      Neural Network Playground
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      Interactive neural network visualization. Explore how networks learn with real-time training and decision boundary visualization.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="px-2 py-1 bg-emerald-500/10 rounded">Train Networks</span>
                      <span className="px-2 py-1 bg-emerald-500/10 rounded">Visualize Learning</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Featured Section */}
            {filteredFeatured.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-400" />
                  Featured Playgrounds
                </h2>
                <p className="text-gray-500 mb-6">Curated educational simulations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredFeatured.slice(0, 8).map((playground) => (
                    <PlaygroundCard key={playground.id} playground={playground} />
                  ))}
                </div>
              </div>
            )}

            {/* Community Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Users className="h-6 w-6 text-neural-primary" />
                Community Playgrounds
              </h2>
              <p className="text-gray-500 mb-6">Created by educators</p>

              {loadingCommunity ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading...</p>
                </div>
              ) : filteredCommunity.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunity.map((playground) => (
                    <PlaygroundCard key={playground.id} playground={playground} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="text-gray-400">No community playgrounds yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* FEATURED Tab */}
        {activeTab === 'featured' && (
          <div>
            {loadingFeatured ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading featured playgrounds...</p>
              </div>
            ) : filteredFeatured.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFeatured.map((playground) => (
                  <PlaygroundCard key={playground.id} playground={playground} showFeaturedBadge />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                <Star className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No featured playgrounds found</p>
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY Tab */}
        {activeTab === 'community' && (
          <div>
            {loadingCommunity ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading community playgrounds...</p>
              </div>
            ) : filteredCommunity.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredCommunity.map((playground) => (
                    <PlaygroundCard key={playground.id} playground={playground} />
                  ))}
                </div>

                {/* Pagination */}
                {communityTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCommunityPage((p) => Math.max(1, p - 1))}
                      disabled={communityPage === 1}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-400">
                      Page {communityPage} of {communityTotalPages}
                    </span>
                    <button
                      onClick={() => setCommunityPage((p) => Math.min(communityTotalPages, p + 1))}
                      disabled={communityPage === communityTotalPages}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                <Users className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No community playgrounds yet</p>
                {isFaculty && (
                  <Link
                    href="/playgrounds/builder?new=true"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Playground
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* MY PLAYGROUNDS Tab */}
        {activeTab === 'my-playgrounds' && isLoggedIn && (
          <div>
            {loadingMine ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading your playgrounds...</p>
              </div>
            ) : filteredMine.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMine.map((playground) => (
                  <PlaygroundCard key={playground.id} playground={playground} showFeaturedBadge={playground.is_featured} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                <User className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No playgrounds yet</h3>
                <p className="text-gray-400 mb-6">Create your first interactive playground</p>
                <Link
                  href="/playgrounds/builder?new=true"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90 transition-colors font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  Create Playground
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
