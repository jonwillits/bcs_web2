'use client';

import Link from 'next/link';
import { BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { NeuralButton } from '@/components/ui/neural-button';

export function EmptyLearningState() {
  return (
    <Card className="cognitive-card">
      <CardContent className="p-12 text-center">
        <div className="max-w-md mx-auto">
          {/* Icon */}
          <div className="relative mb-6">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto" />
            <Sparkles className="h-6 w-6 text-purple-500 absolute top-0 right-1/3 animate-pulse" />
          </div>

          {/* Heading */}
          <h3 className="text-2xl font-bold text-neural-primary mb-3">
            Start Your Learning Journey
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            You haven&apos;t enrolled in any courses yet. Explore our course catalog to find topics that
            interest you and begin learning today.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/courses">
              <NeuralButton variant="neural" className="w-full sm:w-auto">
                Browse Courses
              </NeuralButton>
            </Link>
            <Link href="/modules">
              <NeuralButton variant="outline" className="w-full sm:w-auto">
                Explore Modules
              </NeuralButton>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Not sure where to start? Check out our{' '}
              <Link href="/network" className="text-purple-600 hover:text-purple-700 hover:underline">
                course network visualization
              </Link>{' '}
              to discover learning paths and connections between topics.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
