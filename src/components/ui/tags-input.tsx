"use client";

import React, { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X, Tag, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  label?: string
  maxTags?: number
  suggestions?: string[]
  className?: string
  disabled?: boolean
  id?: string
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  label,
  maxTags = 20,
  suggestions = [],
  className,
  disabled = false,
  id
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion.toLowerCase())
    )
    .slice(0, 8) // Limit suggestions shown

  // Handle input key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        addTag(inputValue)
        break
      case 'Backspace':
        if (inputValue === '' && value.length > 0) {
          removeTag(value[value.length - 1])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setInputValue('')
        break
    }
  }

  // Add a new tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    
    if (trimmedTag && 
        !value.includes(trimmedTag) && 
        value.length < maxTags &&
        trimmedTag.length <= 50) {
      onChange([...value, trimmedTag])
    }
    
    setInputValue('')
    setShowSuggestions(false)
  }

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    if (disabled) return
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  // Handle input focus
  const handleFocus = () => {
    setShowSuggestions(true)
  }

  // Handle input blur with delay to allow clicking suggestions
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
    inputRef.current?.focus()
  }

  // Auto-resize input based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.width = `${Math.max(100, inputValue.length * 8 + 20)}px`
    }
  }, [inputValue])

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      
      <div 
        ref={containerRef}
        className={cn(
          "min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "flex flex-wrap items-center gap-2",
          disabled && "cursor-not-allowed opacity-50",
          "border-neural-light/30 focus-within:border-neural-primary"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Display existing tags - Enhanced with larger size and better touch targets */}
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="h-8 gap-2 pr-1 hover:bg-neural-primary hover:text-white transition-all duration-200 hover:scale-105 text-sm px-3"
          >
            <Tag className="h-4 w-4" />
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="ml-1 hover:bg-white hover:text-black rounded-full p-1 min-w-[24px] min-h-[24px] flex items-center justify-center transition-all duration-200 hover:scale-110"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </Badge>
        ))}
        
        {/* Input field */}
        {value.length < maxTags && !disabled && (
          <div className="relative flex-1 min-w-[100px]">
            <Input
              ref={inputRef}
              id={id}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={value.length === 0 ? placeholder : "Add another tag..."}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              style={{ width: `${Math.max(100, inputValue.length * 8 + 20)}px` }}
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && (inputValue || filteredSuggestions.length > 0) && (
              <div className="absolute top-full left-0 z-50 w-full min-w-[200px] mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                      Suggestions
                    </div>
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neural-light/10 flex items-center gap-2"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {suggestion}
                      </button>
                    ))}
                  </>
                ) : inputValue && (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-neural-light/10 flex items-center gap-2"
                    onClick={() => addTag(inputValue)}
                  >
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    Add &ldquo;{inputValue}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Max tags reached indicator */}
        {value.length >= maxTags && (
          <Badge variant="outline" className="text-xs">
            Max {maxTags} tags
          </Badge>
        )}
      </div>
      
      {/* Helper text */}
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <span className="flex-1">
          Press Enter or Tab to add tags. Use tags to categorize and search your content.
        </span>
        <span className="flex-shrink-0 font-medium">
          {value.length}/{maxTags}
        </span>
      </div>
    </div>
  )
}
