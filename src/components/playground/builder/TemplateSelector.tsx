"use client";

import React, { useState, useEffect } from 'react';
import { PlaygroundTemplate, PlaygroundCategory } from '@/types/playground';
import { getAllTemplates, getTemplatesByCategory } from '@/templates';
import { X, Search, FileCode, Sparkles } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: PlaygroundTemplate) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaygroundCategory | 'all'>('all');

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const templates = selectedCategory === 'all'
    ? getAllTemplates()
    : getTemplatesByCategory(selectedCategory);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: 'all' as const, label: 'All Templates' },
    { id: PlaygroundCategory.ALGORITHMS, label: 'Algorithms' },
    { id: PlaygroundCategory.NEURAL_NETWORKS, label: 'Neural Networks' },
    { id: PlaygroundCategory.PHYSICS, label: 'Physics' },
    { id: PlaygroundCategory.BIOLOGY, label: 'Biology' },
    { id: PlaygroundCategory.CHEMISTRY, label: 'Chemistry' },
    { id: PlaygroundCategory.MATHEMATICS, label: 'Mathematics' },
    { id: PlaygroundCategory.CUSTOM, label: 'Custom' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Choose a Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Start with a pre-built playground and customize it
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                           ${selectedCategory === category.id
                             ? 'bg-blue-500 text-white'
                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                      <FileCode className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {template.category.replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span>{template.defaultControls.length} controls</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4" />
              <span>Or start from scratch</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
