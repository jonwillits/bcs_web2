"use client";

import { useState, useEffect } from 'react';
import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';
import { TemplateSelector } from './TemplateSelector';
import { MonacoCodeEditor } from './MonacoCodeEditor';
import { ShinyliveEmbed } from './ShinyliveEmbed';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface PlaygroundBuilderProps {
  /**
   * Initial code (for editing existing playground)
   */
  initialCode?: string;

  /**
   * Initial requirements
   */
  initialRequirements?: string[];

  /**
   * Initial metadata
   */
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: ShinyliveCategory;

  /**
   * Callback when saving
   */
  onSave?: (data: {
    title: string;
    description: string;
    category: ShinyliveCategory;
    sourceCode: string;
    requirements: string[];
  }) => Promise<void>;

  /**
   * Is in edit mode (editing existing playground)
   */
  editMode?: boolean;
}

type BuilderStep = 'template' | 'edit' | 'preview';

/**
 * PlaygroundBuilder Component
 *
 * Main interface for creating and editing Shinylive playgrounds.
 *
 * Workflow:
 * 1. Select template
 * 2. Edit code
 * 3. Preview app
 * 4. Save and publish
 */
export function PlaygroundBuilder({
  initialCode = '',
  initialRequirements = [],
  initialTitle = '',
  initialDescription = '',
  initialCategory = ShinyliveCategory.CUSTOM,
  onSave,
  editMode = false,
}: PlaygroundBuilderProps) {
  // State
  const [step, setStep] = useState<BuilderStep>(editMode ? 'edit' : 'template');
  const [selectedTemplate, setSelectedTemplate] = useState<ShinyliveTemplate | null>(null);
  const [code, setCode] = useState(initialCode);
  const [requirements, setRequirements] = useState<string[]>(initialRequirements);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<ShinyliveCategory>(initialCategory);
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const isMobile = useIsMobile();

  // Requirements input
  const [requirementsInput, setRequirementsInput] = useState(requirements.join(', '));

  useEffect(() => {
    // Parse requirements from comma-separated string
    const parsed = requirementsInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
    setRequirements(parsed);
  }, [requirementsInput]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!editMode && code && title) {
      const draft = {
        code,
        title,
        description,
        category,
        requirements,
        timestamp: Date.now()
      };
      localStorage.setItem('playground-draft', JSON.stringify(draft));
    }
  }, [code, title, description, category, requirements, editMode]);

  // Restore draft on mount
  useEffect(() => {
    if (!editMode && !initialCode) {
      const saved = localStorage.getItem('playground-draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          // Only restore if less than 24 hours old
          if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
            if (confirm('Restore your last unsaved playground?')) {
              setCode(draft.code);
              setTitle(draft.title);
              setDescription(draft.description);
              setCategory(draft.category);
              setRequirements(draft.requirements);
              setRequirementsInput(draft.requirements.join(', '));
            }
          }
        } catch (e) {
          console.error('Failed to restore draft:', e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle template selection
   */
  function handleTemplateSelect(template: ShinyliveTemplate) {
    setSelectedTemplate(template);
    setCode(template.sourceCode);
    setRequirements(template.requirements);
    setRequirementsInput(template.requirements.join(', '));
    setCategory(template.category);

    if (!title) {
      setTitle(template.name);
    }
    if (!description) {
      setDescription(template.description);
    }

    // Move to edit step
    setStep('edit');
  }

  /**
   * Handle save
   */
  async function handleSave() {
    if (!title || !code) {
      alert('Please provide a title and code');
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({
          title,
          description,
          category,
          sourceCode: code,
          requirements,
        });
        // Clear draft from localStorage after successful save
        localStorage.removeItem('playground-draft');
      }
    } catch (error: any) {
      console.error('Failed to save:', error);

      // Better error messages based on error type
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        alert('Please sign in to save playgrounds.\n\nYour work has been saved locally and will be restored when you return.');
      } else if (error.message?.includes('network')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to save playground. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="playground-builder min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit Playground' : 'Create New Playground'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'template' && 'Step 1: Choose a template'}
                {step === 'edit' && 'Step 2: Edit your code'}
                {step === 'preview' && 'Step 3: Preview and publish'}
              </p>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center gap-2">
              {!editMode && (
                <>
                  <button
                    onClick={() => setStep('template')}
                    disabled={step === 'template'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      step === 'template'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    1. Template
                  </button>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              )}
              <button
                onClick={() => setStep('edit')}
                disabled={step === 'edit'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  step === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {editMode ? 'Edit' : '2. Edit'}
              </button>
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <button
                onClick={() => setStep('preview')}
                disabled={step === 'preview'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  step === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {editMode ? 'Preview' : '3. Preview'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Warning */}
      {isMobile && (
        <div className="bg-yellow-50 border-t border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-xl">📱</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Mobile Editing Limited
                </h3>
                <p className="text-sm text-yellow-800">
                  Editing code on mobile devices can be challenging. For the best experience,
                  we recommend using a desktop or laptop computer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Template Selection */}
        {step === 'template' && !editMode && (
          <TemplateSelector
            onSelect={handleTemplateSelect}
            selectedId={selectedTemplate?.id}
          />
        )}

        {/* Step 2: Code Editor */}
        {step === 'edit' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Metadata Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900">Playground Metadata</h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showMetadata ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showMetadata && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="My Interactive Playground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe what this playground demonstrates..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ShinyliveCategory)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(ShinyliveCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Python Requirements
                      <span className="text-gray-500 text-xs ml-2">
                        (comma-separated, e.g. plotly, numpy, pandas)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={requirementsInput}
                      onChange={(e) => setRequirementsInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="plotly, numpy, scikit-learn"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Code Editor */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <MonacoCodeEditor
                value={code}
                onChange={setCode}
                language="python"
                height="600px"
                theme="vs-dark"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              {!editMode && (
                <button
                  onClick={() => setStep('template')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ← Back to Templates
                </button>
              )}
              <button
                onClick={() => setStep('preview')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-auto"
              >
                Preview →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            {/* Preview Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title || 'Untitled Playground'}</h3>
              <p className="text-gray-600">{description || 'No description provided'}</p>
              <div className="mt-4 flex gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                {requirements.map((req) => (
                  <span key={req} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {req}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Live Preview</h4>
              <ShinyliveEmbed
                key={`${Date.now()}-${code.length}`} // Force complete iframe reload with timestamp + code length
                sourceCode={code}
                requirements={requirements}
                title={title}
                height={700}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep('edit')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Editor
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !title || !code}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSaving ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * ```tsx
 * <PlaygroundBuilder
 *   onSave={async (data) => {
 *     // Save to database
 *     await fetch('/api/playgrounds', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   }}
 * />
 * ```
 */
