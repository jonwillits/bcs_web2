"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PlaygroundBuilder } from '@/components/playground/PlaygroundBuilder';
import { ShinyliveCategory } from '@/types/shinylive';

function PlaygroundBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(!!editId);
  const [existingPlayground, setExistingPlayground] = useState<any>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Check auth status when component mounts
  useEffect(() => {
    if (status === 'unauthenticated' && !editId) {
      setShowAuthPrompt(true);
    }
  }, [status, editId]);

  // Load existing playground if editing
  useEffect(() => {
    if (editId) {
      fetch(`/api/playgrounds/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          setExistingPlayground(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load playground:', error);
          alert('Failed to load playground');
          setLoading(false);
        });
    }
  }, [editId]);

  /**
   * Handle save
   */
  async function handleSave(data: {
    title: string;
    description: string;
    category: ShinyliveCategory;
    sourceCode: string;
    requirements: string[];
  }) {
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
            requirements: data.requirements,
            is_public: true, // TODO: Make this configurable
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
            requirements: data.requirements,
            is_public: true, // TODO: Make this configurable
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save playground');
      }

      const playground = await response.json();

      // Redirect to the playground view
      router.push(`/playgrounds/${playground.id}`);
    } catch (error) {
      console.error('Failed to save playground:', error);
      throw error;
    }
  }

  if (showAuthPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to create and publish playgrounds. Your work will be saved to your account.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/login?callbackUrl=/playgrounds/builder"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
              >
                Sign In to Continue
              </Link>
              <Link
                href="/auth/register?callbackUrl=/playgrounds/builder"
                className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-center"
              >
                Create Account
              </Link>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="block w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Browse templates without signing in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playground...</p>
        </div>
      </div>
    );
  }

  return (
    <PlaygroundBuilder
      onSave={handleSave}
      editMode={!!editId}
      initialCode={existingPlayground?.source_code}
      initialRequirements={existingPlayground?.requirements}
      initialTitle={existingPlayground?.title}
      initialDescription={existingPlayground?.description}
      initialCategory={existingPlayground?.category}
    />
  );
}

export default function PlaygroundBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading playground builder...</p>
          </div>
        </div>
      }
    >
      <PlaygroundBuilderContent />
    </Suspense>
  );
}
