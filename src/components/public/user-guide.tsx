"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChevronRight, BookOpen, Menu, X } from "lucide-react"

interface TocItem {
  id: string
  text: string
  level: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = []
  const lines = markdown.split("\n")
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim()
      items.push({ id: slugify(text), text, level })
    }
  }
  return items
}

export function UserGuide({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const tocItems = extractToc(content)

  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const headings = document.querySelectorAll<HTMLElement>(
      ".guide-content h2[id], .guide-content h3[id]"
    )

    if (headings.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          )

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    )

    headings.forEach((heading) => observerRef.current!.observe(heading))
  }, [])

  useEffect(() => {
    // Small delay to let react-markdown render headings with ids
    const timer = setTimeout(setupObserver, 100)
    return () => {
      clearTimeout(timer)
      observerRef.current?.disconnect()
    }
  }, [setupObserver])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      const offset = 90
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: "smooth" })
      setActiveId(id)
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="relative">
      {/* Mobile TOC toggle */}
      <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
          Table of Contents
        </button>
        {mobileMenuOpen && (
          <nav className="mt-3 max-h-[60vh] overflow-y-auto pb-2">
            <ul className="space-y-1">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className={`block w-full text-left text-sm py-1.5 transition-colors ${
                      item.level === 3 ? "pl-6" : "pl-2"
                    } ${
                      activeId === item.id
                        ? "text-neural-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop layout: sidebar + content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          {/* Sticky TOC sidebar - desktop only */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pr-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
                <BookOpen className="h-4 w-4 text-neural-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Contents
                </span>
              </div>
              <ul className="space-y-0.5">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`group flex items-center w-full text-left text-[13px] py-1.5 rounded-md transition-colors ${
                        item.level === 3 ? "pl-5" : "pl-2"
                      } ${
                        activeId === item.id
                          ? "text-neural-primary font-medium bg-neural-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {activeId === item.id && (
                        <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                      )}
                      <span className={activeId === item.id ? "" : "ml-4"}>
                        {item.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Markdown content */}
          <article className="guide-content min-w-0 max-w-none prose prose-slate dark:prose-invert
                prose-headings:scroll-mt-24
                prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:text-foreground
                prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-foreground prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2
                prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-foreground
                prose-h4:text-lg prose-h4:font-medium prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-foreground
                prose-p:text-muted-foreground prose-p:leading-7
                prose-li:text-muted-foreground
                prose-strong:text-foreground
                prose-a:text-neural-primary prose-a:no-underline hover:prose-a:underline
                prose-table:text-sm
                prose-th:bg-muted/50 prose-th:text-foreground prose-th:font-semibold prose-th:px-4 prose-th:py-2
                prose-td:px-4 prose-td:py-2 prose-td:text-muted-foreground prose-td:border-border/40
                prose-hr:border-border/40
                prose-code:text-neural-primary prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children, ...props }) => {
                  const text =
                    typeof children === "string"
                      ? children
                      : Array.isArray(children)
                        ? children
                            .map((c) => (typeof c === "string" ? c : ""))
                            .join("")
                        : ""
                  const id = slugify(text)
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ children, ...props }) => {
                  const text =
                    typeof children === "string"
                      ? children
                      : Array.isArray(children)
                        ? children
                            .map((c) => (typeof c === "string" ? c : ""))
                            .join("")
                        : ""
                  const id = slugify(text)
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  )
}
