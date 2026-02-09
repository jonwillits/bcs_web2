'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { PlaygroundFormData, PlaygroundCategory } from '@/types/react-playground';

// Lazy load the builder to reduce initial bundle size
const ReactPlaygroundBuilder = dynamic(
  () => import('@/components/react-playground/ReactPlaygroundBuilder'),
  {
    loading: () => (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading playground builder...</p>
        </div>
      </div>
    ),
    ssr: false, // Sandpack doesn't support SSR
  }
);

// Default welcoming code for new playgrounds
const DEFAULT_NEW_PLAYGROUND_CODE = `export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        Welcome to Your Playground
      </h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>
        Start editing to see your changes in real-time
      </p>
      <div style={{
        padding: '1.5rem 2rem',
        background: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
      }}>
        <p style={{ margin: 0, color: '#a5b4fc' }}>
          💡 Tip: Try importing libraries like Three.js, Chart.js, or Framer Motion!
        </p>
      </div>
    </div>
  );
}
`;

function PlaygroundBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const templateId = searchParams.get('template');
  const isNew = searchParams.get('new') === 'true';
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(!!editId || !!templateId);
  const [existingPlayground, setExistingPlayground] = useState<any>(null);
  const [templatePlayground, setTemplatePlayground] = useState<any>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Check if user is faculty/admin
  const isFaculty =
    session?.user?.role === 'faculty' || session?.user?.role === 'admin';

  // Check auth status - only faculty can create
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setShowAuthPrompt(true);
    } else if (!isFaculty && !editId) {
      // Logged in but not faculty
      setShowAuthPrompt(true);
    }
  }, [status, isFaculty, editId]);

  // Load existing playground if editing
  useEffect(() => {
    if (editId && session?.user) {
      fetch(`/api/playgrounds/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
            router.push('/playgrounds');
            return;
          }

          // Check if user has permission to edit
          const isOwner = data.created_by === session.user.id;
          const isAdmin = session.user.role === 'admin';

          if (!isOwner && !isAdmin) {
            alert('You do not have permission to edit this playground');
            router.push(`/playgrounds/${editId}`);
            return;
          }

          setExistingPlayground(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load playground:', error);
          alert('Failed to load playground');
          setLoading(false);
        });
    }
  }, [editId, session?.user, router]);

  // Load template if starting from a template (creates new playground with template data)
  useEffect(() => {
    if (templateId && !editId) {
      fetch(`/api/playgrounds/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error('Failed to load template:', data.error);
            setLoading(false);
            return;
          }
          setTemplatePlayground(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load template:', error);
          setLoading(false);
        });
    }
  }, [templateId, editId]);

  // Clear localStorage draft when creating new playground
  useEffect(() => {
    if (isNew && typeof window !== 'undefined') {
      localStorage.removeItem('playground-draft-new');
    }
  }, [isNew]);

  // Prepare initial data
  const initialData: Partial<PlaygroundFormData> | undefined = editId
    ? existingPlayground
      ? {
          title: existingPlayground.title,
          description: existingPlayground.description,
          category: existingPlayground.category as PlaygroundCategory,
          sourceCode: existingPlayground.source_code,
          dependencies: existingPlayground.requirements || [],
        }
      : undefined
    : templatePlayground
    ? {
        // When using a template, give it a new title so user knows it's a copy
        title: `${templatePlayground.title} (Copy)`,
        description: templatePlayground.description,
        category: templatePlayground.category as PlaygroundCategory,
        sourceCode: templatePlayground.source_code,
        dependencies: templatePlayground.requirements || [],
      }
    : isNew
    ? {
        title: 'Untitled Playground',
        description: '',
        category: 'other' as PlaygroundCategory,
        sourceCode: DEFAULT_NEW_PLAYGROUND_CODE,
        dependencies: [],
      }
    : undefined;

  /**
   * Handle save
   */
  async function handleSave(data: PlaygroundFormData) {
    try {
      let response;

      if (editId) {
        // Update existing playground
        response = await fetch(`/api/playgrounds/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            category: data.category,
            source_code: data.sourceCode,
            requirements: data.dependencies,
            is_public: data.isPublic,
            app_type: 'sandpack',
          }),
        });
      } else {
        // Create new playground
        response = await fetch('/api/playgrounds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            category: data.category,
            source_code: data.sourceCode,
            requirements: data.dependencies,
            is_public: data.isPublic,
            app_type: 'sandpack',
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save playground');
      }

      const playground = await response.json();

      // Redirect to the playground view
      router.push(`/playgrounds/${playground.id}`);
    } catch (error) {
      console.error('Failed to save playground:', error);
      throw error;
    }
  }

  // Auth prompt for non-faculty users
  if (showAuthPrompt) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-neural-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {status === 'unauthenticated'
                ? 'Sign In Required'
                : 'Faculty Access Required'}
            </h2>
            <p className="text-gray-400 mb-6">
              {status === 'unauthenticated'
                ? 'You need to sign in with a faculty account to create playgrounds.'
                : 'Only faculty members can create and edit playgrounds. Students can view and interact with existing playgrounds.'}
            </p>
            <div className="space-y-3">
              {status === 'unauthenticated' ? (
                <>
                  <Link
                    href="/auth/login?callbackUrl=/playgrounds/builder"
                    className="block w-full px-6 py-3 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90 transition-colors font-semibold text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/playgrounds"
                    className="block w-full px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-center"
                  >
                    Browse Playgrounds
                  </Link>
                </>
              ) : (
                <Link
                  href="/playgrounds"
                  className="block w-full px-6 py-3 bg-neural-primary text-white rounded-lg hover:bg-neural-primary/90 transition-colors font-semibold text-center"
                >
                  Browse Playgrounds
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while fetching existing playground
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading playground...</p>
        </div>
      </div>
    );
  }

  return (
    <ReactPlaygroundBuilder
      initialData={initialData}
      playgroundId={editId || undefined}
      onSave={handleSave}
    />
  );
}

export default function PlaygroundBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-neural-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading playground builder...</p>
          </div>
        </div>
      }
    >
      <PlaygroundBuilderContent />
    </Suspense>
  );
}
