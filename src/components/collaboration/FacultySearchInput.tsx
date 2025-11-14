"use client"

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Check } from 'lucide-react'
import Image from 'next/image'

interface FacultyMember {
  id: string
  name: string
  email: string
  avatar_url: string | null
  university: string | null
  speciality: string | null
}

interface FacultySearchInputProps {
  onSelect: (userId: string) => void
  excludeUserIds?: string[]
  label?: string
  placeholder?: string
}

async function searchFaculty(query: string): Promise<FacultyMember[]> {
  if (!query || query.length < 2) return []

  const response = await fetch(
    `/api/users?role=faculty&search=${encodeURIComponent(query)}&limit=10`
  )

  if (!response.ok) {
    throw new Error('Failed to search faculty')
  }

  const data = await response.json()
  return data.users || []
}

export function FacultySearchInput({
  onSelect,
  excludeUserIds = [],
  label = 'Search Faculty',
  placeholder = 'Search by name or email...',
}: FacultySearchInputProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['faculty-search', query],
    queryFn: () => searchFaculty(query),
    enabled: query.length >= 2,
  })

  // Filter out excluded users
  const filteredResults = results.filter(
    (user) => !excludeUserIds.includes(user.id)
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show dropdown when results are available
  useEffect(() => {
    if (query.length >= 2 && filteredResults.length > 0) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }, [query, filteredResults])

  const handleSelect = (user: FacultyMember) => {
    setSelectedId(user.id)
    setQuery(user.name)
    setShowDropdown(false)
    onSelect(user.id)

    // Clear the input after a short delay
    setTimeout(() => {
      setQuery('')
      setSelectedId(null)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredResults.length) {
          handleSelect(filteredResults[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        setFocusedIndex(-1)
        break
    }
  }

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="faculty-search">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="faculty-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setFocusedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && filteredResults.length > 0) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          className="pl-10 border-neural-light/30 focus:border-neural-primary"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-neural-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && filteredResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[110] w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {filteredResults.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-neural-primary/10 transition-colors border-b border-border/40 last:border-0 ${
                index === focusedIndex ? 'bg-neural-primary/10' : ''
              }`}
            >
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-neural flex-shrink-0">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                {user.university && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.university}
                  </p>
                )}
              </div>
              {selectedId === user.id && (
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {query.length >= 2 && !isLoading && filteredResults.length === 0 && (
        <div className="absolute z-[110] w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No faculty members found matching &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}
