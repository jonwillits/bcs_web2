"use client"

import { useState } from 'react'
import Link from 'next/link'
import { UserCircle, Users, FileText, Shield, BarChart3, Activity, Menu, X } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: BarChart3,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: Activity,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Faculty Requests',
      href: '/admin/faculty-requests',
      icon: UserCircle,
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: Shield,
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: FileText,
      soon: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-neural-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <Link
              href="/"
              className="text-xs sm:text-sm hover:underline opacity-90 hover:opacity-100"
            >
              Back to Platform
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex gap-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside
            className={`
              fixed lg:sticky top-0 left-0 z-40 h-screen lg:h-auto
              w-64 flex-shrink-0 bg-background lg:bg-transparent
              transition-transform duration-300 ease-in-out
              border-r lg:border-r-0 border-border
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <nav className="space-y-1 p-4 lg:p-0 lg:sticky lg:top-8 pt-20 lg:pt-0">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      item.soon
                        ? 'text-muted-foreground cursor-not-allowed opacity-50'
                        : 'hover:bg-neural-light/10 text-foreground'
                    }`}
                    onClick={(e) => {
                      if (item.soon) e.preventDefault()
                      setSidebarOpen(false) // Close sidebar on mobile after clicking
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                    {item.soon && (
                      <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
                        Soon
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu overlay"
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
