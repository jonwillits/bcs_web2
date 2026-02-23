"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CourseCard } from "./CourseCard";
import { NeuralButton } from "./ui/neural-button"
import { ArrowRight, Filter, Grid, List, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  instructor: string;
  moduleCount: number;
  status: string;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

async function fetchCourses(): Promise<Course[]> {
  const response = await fetch('/api/courses?featured=true');
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  const data = await response.json();
  return data.courses;
}

export function CoursesSection() {
  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn: fetchCourses,
  });

  if (isLoading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-neural-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Unable to Load Courses
            </h2>
            <p className="text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-neural-primary mb-4">
              Featured Courses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover comprehensive courses designed by leading experts in brain and cognitive sciences.
              Each course combines theoretical foundations with practical applications.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <NeuralButton variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton variant="ghost" size="icon">
              <Grid className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton variant="ghost" size="icon">
              <List className="h-4 w-4" />
            </NeuralButton>
          </div>
        </div>

        {/* Course Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                {...course}
                level="Beginner" // Default level for now
                rating={4.8} // Default rating for now
                students={0} // Will be calculated later
                duration="Varies" // Will be calculated based on modules
                // No image prop - will use default background
                topics={course.tags} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Featured Courses Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for new courses from our instructors.
            </p>
            <Link href="/courses">
              <NeuralButton variant="neural">
                Browse All Courses
              </NeuralButton>
            </Link>
          </div>
        )}

        {/* View All Courses */}
        {courses.length > 0 && (
          <div className="text-center">
            <Link href="/courses">
              <NeuralButton variant="synaptic" size="lg">
                View All Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </NeuralButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}