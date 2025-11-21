"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { Brain, Search, User, BookOpen, Menu, LogOut, X, Home, BarChart3, Settings, Plus, Users, Activity, Shield, FileText } from "lucide-react";
import { NeuralButton } from "./ui/neural-button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Navigation configuration for extensibility
const navigationConfig = {
  public: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/modules", label: "Modules", icon: BookOpen },
    { href: "/network", label: "Network", icon: BarChart3 },
  ],
  admin: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/modules", label: "Modules", icon: BookOpen },
    { href: "/network", label: "Network", icon: BarChart3 },
    { href: "/admin/dashboard", label: "Admin Dashboard", icon: BarChart3 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: Activity },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: Shield },
    { href: "/admin/faculty-requests", label: "Faculty Requests", icon: FileText },
    { href: "/learning", label: "My Learning", icon: BookOpen },
  ],
  faculty: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/modules", label: "Modules", icon: BookOpen },
    { href: "/network", label: "Network", icon: BarChart3 },
    { href: "/faculty/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/learning", label: "My Learning", icon: BookOpen },
    { href: "/faculty/visualization", label: "Visualization", icon: BarChart3 },
    { href: "/faculty/modules", label: "My Modules", icon: BookOpen },
    { href: "/faculty/courses", label: "My Courses", icon: BookOpen },
    { href: "/faculty/modules/create", label: "Create Module", icon: Plus },
  ],
  student: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/modules", label: "Modules", icon: BookOpen },
    { href: "/network", label: "Network", icon: BarChart3 },
    { href: "/learning", label: "My Learning", icon: BookOpen },
  ]
};

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false); // Close mobile menu if search from mobile
      setSearchTerm(''); // Clear search input after navigation
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    // Check admin first (most privileged role)
    if (session?.user?.role === "admin") {
      return navigationConfig.admin;
    } else if (session?.user?.role === "faculty") {
      return navigationConfig.faculty;
    } else if (session?.user?.role === "student") {
      return navigationConfig.student;
    } else {
      return navigationConfig.public;
    }
  };

  const navigationItems = getNavigationItems();

  // Split navigation for desktop (primary + overflow)
  const getPrimaryNavItems = () => {
    // Show first 4 items on desktop for all roles to prevent overflow
    return navigationItems.slice(0, 4);
  };

  const getOverflowNavItems = () => {
    // Remaining items go into dropdown/overflow menu
    return navigationItems.slice(4);
  };

  const primaryNavItems = getPrimaryNavItems();
  const overflowNavItems = getOverflowNavItems();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2 md:gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0" aria-label="Brain & Cognitive Sciences - Go to homepage">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-neural" aria-hidden="true">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            {/* Show abbreviated "BCS" on mobile, full text on md+ */}
            <span className="font-bold text-sm sm:text-base lg:text-lg text-neural-primary">
              <span className="md:hidden">BCS</span>
              <span className="hidden md:inline">Brain & Cognitive Sciences</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 text-sm font-medium" role="navigation" aria-label="Main navigation">
            {primaryNavItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="flex items-center space-x-1 thought-pathway transition-colors hover:text-neural-primary focus:text-neural-primary focus:outline-none focus:ring-2 focus:ring-neural-primary focus:ring-offset-2 rounded px-2 py-1"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Overflow Menu for additional navigation items */}
            {overflowNavItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <NeuralButton variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Menu className="h-4 w-4" />
                    <span>More</span>
                  </NeuralButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {overflowNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <DropdownMenuItem key={item.href + item.label} asChild>
                        <Link href={item.href} className="flex items-center">
                          <IconComponent className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Desktop Search */}
            <div className="hidden lg:block">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search courses, modules, people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="h-9 w-[300px] bg-background pl-10 border-neural-light/30 focus:border-neural-primary"
                  aria-label="Search courses, modules, and people"
                  role="searchbox"
                />
              </form>
            </div>

            {/* Action Buttons */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <NeuralButton variant="synaptic" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">{session.user.name}</span>
                  </NeuralButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* User Profile Section */}
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{session.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.user.role?.charAt(0).toUpperCase() + session.user.role?.slice(1)}
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* My Profile */}
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${session.user.id}`} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Admin Tools Section */}
                  {session.user.role === "admin" && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Admin Tools
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          User Management
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/analytics" className="flex items-center">
                          <Activity className="mr-2 h-4 w-4" />
                          Platform Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/audit-logs" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Audit Logs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Content Creation
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/faculty/dashboard" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Faculty Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/faculty/courses" className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Courses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/faculty/modules" className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Modules
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Faculty Tools Section */}
                  {session.user.role === "faculty" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/faculty/dashboard" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/faculty/courses" className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Courses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/faculty/modules" className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Modules
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Learning Section (All authenticated users) */}
                  <DropdownMenuItem asChild>
                    <Link href="/learning" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Learning
                    </Link>
                  </DropdownMenuItem>

                  {/* Settings Section */}
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        session.user.role === "admin" ? "/admin/profile/edit" :
                        session.user.role === "faculty" ? "/faculty/profile/edit" :
                        "/student/profile/edit"
                      }
                      className="flex items-center"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Hide Browse button on mobile - available in mobile menu */}
                <Link href="/courses" className="hidden lg:inline-block">
                  <NeuralButton variant="ghost" size="sm">
                    <BookOpen className="h-4 w-4" />
                    <span className="ml-2">Browse</span>
                  </NeuralButton>
                </Link>

                <Link href="/auth/login">
                  <NeuralButton variant="synaptic" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">Sign In</span>
                  </NeuralButton>
                </Link>
              </>
            )}

            {/* Mobile Search Icon */}
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen)
                if (mobileMenuOpen) setMobileMenuOpen(false)
              }}
              className="lg:hidden p-1.5 text-muted-foreground hover:text-neural-primary transition-colors rounded-md"
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Mobile Menu Button */}
            <NeuralButton
              variant="ghost"
              size="icon"
              className="lg:hidden p-1.5"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
                if (mobileSearchOpen) setMobileSearchOpen(false)
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </NeuralButton>
          </div>
        </div>

        {/* Mobile Search Bar (appears when search icon clicked) */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <div className="px-4 py-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses, modules, people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  autoFocus
                  className="h-10 w-full bg-background pl-10 border-neural-light/30 focus:border-neural-primary"
                  aria-label="Search courses, modules, and people"
                />
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <div className="px-4 py-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses, modules, people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="h-9 w-full bg-background pl-10 border-neural-light/30 focus:border-neural-primary"
                  aria-label="Search courses, modules, and people"
                />
              </form>

              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-1" role="navigation" aria-label="Mobile navigation">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Navigation</div>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className="flex items-center space-x-3 text-foreground hover:text-neural-primary hover:bg-neural-primary/10 transition-colors py-2 px-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Mobile User Actions */}
                {session && (
                  <>
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2 mt-4">Account</div>
                    <div className="px-2 py-2 text-sm border rounded-md bg-muted/50">
                      <div className="font-medium">{session.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.user.role?.charAt(0).toUpperCase() + session.user.role?.slice(1)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center space-x-3 text-destructive hover:bg-destructive/10 transition-colors py-2 px-2 rounded-md w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}