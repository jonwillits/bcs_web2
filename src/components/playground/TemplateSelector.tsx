"use client";

import { useState } from 'react';
import { ShinyliveTemplate, ShinyliveCategory } from '@/types/shinylive';
import {
  getAllShinyliveTemplates,
  getShinyliveTemplatesByCategory,
  searchShinyliveTemplates,
} from '@/templates/shinylive';

interface TemplateSelectorProps {
  /**
   * Callback when template is selected
   */
  onSelect: (template: ShinyliveTemplate) => void;

  /**
   * Currently selected template ID (optional)
   */
  selectedId?: string;
}

/**
 * TemplateSelector Component
 *
 * Displays available Shinylive templates in a filterable grid.
 * Faculty can browse by category, search, and select a template to start with.
 */
export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<ShinyliveCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get templates based on filters
  const getFilteredTemplates = (): ShinyliveTemplate[] => {
    let templates: ShinyliveTemplate[] = [];

    if (searchQuery.trim()) {
      templates = searchShinyliveTemplates(searchQuery);
    } else if (selectedCategory === 'all') {
      templates = getAllShinyliveTemplates();
    } else {
      templates = getShinyliveTemplatesByCategory(selectedCategory);
    }

    return templates;
  };

  const filteredTemplates = getFilteredTemplates();

  // Category labels
  const categoryLabels: Record<ShinyliveCategory | 'all', string> = {
    all: 'All Templates',
    [ShinyliveCategory.DATA_VIZ]: 'Data Visualization',
    [ShinyliveCategory.NEURAL_NETWORKS]: 'Neural Networks',
    [ShinyliveCategory.ALGORITHMS]: 'Algorithms',
    [ShinyliveCategory.PHYSICS]: 'Physics',
    [ShinyliveCategory.BIOLOGY]: 'Biology',
    [ShinyliveCategory.MATHEMATICS]: 'Mathematics',
    [ShinyliveCategory.SIMULATIONS]: 'Simulations',
    [ShinyliveCategory.CUSTOM]: 'Custom',
  };

  // Category icons
  const categoryIcons: Record<ShinyliveCategory, string> = {
    [ShinyliveCategory.DATA_VIZ]: '📊',
    [ShinyliveCategory.NEURAL_NETWORKS]: '🧠',
    [ShinyliveCategory.ALGORITHMS]: '🔢',
    [ShinyliveCategory.PHYSICS]: '⚛️',
    [ShinyliveCategory.BIOLOGY]: '🧬',
    [ShinyliveCategory.MATHEMATICS]: '📐',
    [ShinyliveCategory.SIMULATIONS]: '🎲',
    [ShinyliveCategory.CUSTOM]: '⚙️',
  };

  return (
    <div className="template-selector">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h3>
        <p className="text-gray-600">
          Start with a pre-built template or select &quot;Blank&quot; to create from scratch
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
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

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Templates ({getAllShinyliveTemplates().length})
          </button>
          {Object.values(ShinyliveCategory).map((category) => {
            const count = getShinyliveTemplatesByCategory(category).length;
            if (count === 0) return null;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryIcons[category]} {categoryLabels[category]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No templates found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Blank Template Card */}
          <div
            onClick={() =>
              onSelect({
                id: 'blank',
                name: 'Blank Template',
                description: 'Start from scratch with a minimal Shiny app',
                category: ShinyliveCategory.CUSTOM,
                version: '1.0.0',
                tags: [],
                requirements: [],
                sourceCode: `from shiny import App, ui, render\n\napp_ui = ui.page_fluid(\n    ui.h2("My Playground"),\n    # Add your UI here\n)\n\ndef server(input, output, session):\n    # Add your server logic here\n    pass\n\napp = App(app_ui, server)\n`,
              })
            }
            className={`group cursor-pointer bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-all ${
              selectedId === 'blank'
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-colors">
                <svg
                  className="w-8 h-8 text-gray-400 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Blank Template</h4>
              <p className="text-sm text-gray-600">Start from scratch</p>
            </div>
          </div>

          {/* Template Cards */}
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className={`group cursor-pointer bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-all ${
                selectedId === template.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Template Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{categoryIcons[template.category]}</div>
                {selectedId === template.id && (
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Template Info */}
              <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {template.name}
              </h4>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>

              {/* Requirements */}
              {template.requirements.length > 0 && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  <span className="font-medium">Requires:</span>{' '}
                  {template.requirements.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example Usage:
 *
 * ```tsx
 * const [selectedTemplate, setSelectedTemplate] = useState<ShinyliveTemplate | null>(null);
 *
 * <TemplateSelector
 *   onSelect={(template) => {
 *     setSelectedTemplate(template);
 *     setCode(template.sourceCode);
 *   }}
 *   selectedId={selectedTemplate?.id}
 * />
 * ```
 */
