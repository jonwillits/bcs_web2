import Link from "next/link"
import { Brain, Github, Twitter, Linkedin, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-neural">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-neural-primary">Brain & Cognitive Sciences</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Advancing education through innovative neuroscience-based learning platforms.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-neural-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-neural-primary transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-neural-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-neural-primary transition-colors">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link href="/modules" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Module Library
                </Link>
              </li>
              <li>
                <Link href="/network" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Network Visualization
                </Link>
              </li>
              <li>
                <Link href="/playgrounds" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Interactive Playgrounds
                </Link>
              </li>
            </ul>
          </div>

          {/* For Faculty */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">For Faculty</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/faculty/dashboard" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/faculty/modules/create" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Create Content
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/guide" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  User Guide
                </Link>
              </li>
              <li>
                <Link href="https://github.com/RITIKHARIANI/bcs_web2" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  GitHub Repository
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-neural-primary transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Brain & Cognitive Sciences E-Textbook Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
