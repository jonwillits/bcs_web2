'use client';

/**
 * DependencyManager
 *
 * Component for managing npm dependencies in a React playground.
 * Shows curated suggestions and allows custom package additions.
 */

import { useState, useCallback } from 'react';
import { Plus, X, Package, Search, Loader2 } from 'lucide-react';
import { PACKAGE_SUGGESTIONS } from '@/lib/react-playground/sandpack-config';
import { cn } from '@/lib/utils';

interface DependencyManagerProps {
  dependencies: Record<string, string>;
  onChange: (dependencies: Record<string, string>) => void;
  className?: string;
  compact?: boolean;
}

export default function DependencyManager({
  dependencies,
  onChange,
  className,
  compact = false,
}: DependencyManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customPackage, setCustomPackage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get installed packages (excluding react/react-dom)
  const installedPackages = Object.entries(dependencies).filter(
    ([name]) => name !== 'react' && name !== 'react-dom'
  );

  // Filter suggestions based on search and not already installed
  const filteredSuggestions = PACKAGE_SUGGESTIONS.filter(
    (pkg) =>
      !dependencies[pkg.name] &&
      (pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add package from suggestions
  const addSuggestedPackage = useCallback(
    (name: string, version: string) => {
      onChange({
        ...dependencies,
        [name]: version,
      });
      setSearchQuery('');
    },
    [dependencies, onChange]
  );

  // Add custom package
  const addCustomPackage = useCallback(async () => {
    if (!customPackage.trim()) return;

    setIsAdding(true);

    // Parse package name and version
    const parts = customPackage.trim().split('@');
    let name = parts[0];
    let version = 'latest';

    // Handle scoped packages (@org/package)
    if (customPackage.startsWith('@') && parts.length > 2) {
      name = `@${parts[1]}`;
      version = parts[2] || 'latest';
    } else if (parts.length > 1) {
      version = parts[1];
    }

    onChange({
      ...dependencies,
      [name]: version,
    });

    setCustomPackage('');
    setIsAdding(false);
  }, [customPackage, dependencies, onChange]);

  // Remove package
  const removePackage = useCallback(
    (name: string) => {
      const { [name]: _, ...rest } = dependencies;
      onChange(rest);
    },
    [dependencies, onChange]
  );

  // Category badge colors
  const categoryColors: Record<string, string> = {
    graphics: 'bg-purple-500/20 text-purple-400',
    animation: 'bg-green-500/20 text-green-400',
    charts: 'bg-blue-500/20 text-blue-400',
    utils: 'bg-yellow-500/20 text-yellow-400',
    ui: 'bg-pink-500/20 text-pink-400',
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Compact view - just show installed packages */}
        <div className="flex flex-wrap gap-1">
          {installedPackages.map(([name, version]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300"
            >
              <Package className="h-3 w-3" />
              {name}
              <button
                onClick={() => removePackage(name)}
                className="ml-1 text-gray-500 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Quick add */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customPackage}
            onChange={(e) => setCustomPackage(e.target.value)}
            placeholder="Add package..."
            className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
            onKeyDown={(e) => e.key === 'Enter' && addCustomPackage()}
          />
          <button
            onClick={addCustomPackage}
            disabled={!customPackage.trim() || isAdding}
            className="px-2 py-1 bg-neural-primary text-white rounded text-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-gray-900 rounded-lg border border-gray-800', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-neural-primary" />
          Dependencies
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Add npm packages to use in your playground
        </p>
      </div>

      {/* Installed packages */}
      <div className="p-4 border-b border-gray-800">
        <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
          Installed ({installedPackages.length})
        </h4>
        {installedPackages.length > 0 ? (
          <div className="space-y-2">
            {installedPackages.map(([name, version]) => (
              <div
                key={name}
                className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-white text-sm">{name}</span>
                  <span className="text-gray-500 text-xs">{version}</span>
                </div>
                <button
                  onClick={() => removePackage(name)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm py-2">No additional packages installed</p>
        )}
      </div>

      {/* Add custom package */}
      <div className="p-4 border-b border-gray-800">
        <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
          Add Custom Package
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={customPackage}
            onChange={(e) => setCustomPackage(e.target.value)}
            placeholder="package-name or @scope/package"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neural-primary"
            onKeyDown={(e) => e.key === 'Enter' && addCustomPackage()}
          />
          <button
            onClick={addCustomPackage}
            disabled={!customPackage.trim() || isAdding}
            className="px-4 py-2 bg-neural-primary text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neural-primary/90 transition-colors"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Suggested packages */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-gray-400 text-xs uppercase tracking-wider">
            Suggested Packages
          </h4>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-neural-primary text-xs hover:underline"
          >
            {showSuggestions ? 'Hide' : 'Show all'}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder="Search packages..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 text-sm focus:outline-none focus:border-neural-primary"
          />
        </div>

        {/* Suggestions list */}
        {(showSuggestions || searchQuery) && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => addSuggestedPackage(pkg.name, pkg.defaultVersion)}
                  className="w-full flex items-start gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-750 rounded-md transition-colors text-left"
                >
                  <Package className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">
                        {pkg.name}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-xs',
                          categoryColors[pkg.category]
                        )}
                      >
                        {pkg.category}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {pkg.description}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-neural-primary flex-shrink-0" />
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No packages found
              </p>
            )}
          </div>
        )}

        {/* Quick add buttons for common packages */}
        {!showSuggestions && !searchQuery && (
          <div className="flex flex-wrap gap-2">
            {PACKAGE_SUGGESTIONS.slice(0, 6)
              .filter((pkg) => !dependencies[pkg.name])
              .map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => addSuggestedPackage(pkg.name, pkg.defaultVersion)}
                  className="px-2 py-1 bg-gray-800 hover:bg-gray-750 rounded text-xs text-gray-300 hover:text-white transition-colors"
                >
                  + {pkg.name}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
