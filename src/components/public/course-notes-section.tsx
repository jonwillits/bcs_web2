"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, Target, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { NeuralButton } from '@/components/ui/neural-button';

interface CourseNotesSectionProps {
  customTitle?: string | null;
  customNotes?: string | null;
  customContext?: string | null;
  customObjectives?: string | null;
}

export function CourseNotesSection({
  customTitle,
  customNotes,
  customContext,
  customObjectives,
}: CourseNotesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't render if there's no content
  const hasContent = customNotes || customContext || customObjectives;
  if (!hasContent) return null;

  // Determine which tab to show first
  const getDefaultTab = () => {
    if (customNotes) return 'notes';
    if (customContext) return 'context';
    if (customObjectives) return 'objectives';
    return 'notes';
  };

  return (
    <Card className="cognitive-card border-l-4 border-l-neural-primary bg-gradient-to-r from-neural-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="mr-2 h-5 w-5 text-neural-primary" />
            Course-Specific Notes
            {customTitle && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({customTitle})
              </span>
            )}
          </CardTitle>
          <NeuralButton
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </NeuralButton>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your instructor has added course-specific context for this module
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {customNotes && (
                <TabsTrigger
                  value="notes"
                  className="text-xs sm:text-sm"
                  disabled={!customNotes}
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Notes
                </TabsTrigger>
              )}
              {customContext && (
                <TabsTrigger
                  value="context"
                  className="text-xs sm:text-sm"
                  disabled={!customContext}
                >
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Context
                </TabsTrigger>
              )}
              {customObjectives && (
                <TabsTrigger
                  value="objectives"
                  className="text-xs sm:text-sm"
                  disabled={!customObjectives}
                >
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Objectives
                </TabsTrigger>
              )}
            </TabsList>

            {customNotes && (
              <TabsContent value="notes" className="mt-0">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {customNotes}
                  </div>
                </div>
              </TabsContent>
            )}

            {customContext && (
              <TabsContent value="context" className="mt-0">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {customContext}
                  </div>
                </div>
              </TabsContent>
            )}

            {customObjectives && (
              <TabsContent value="objectives" className="mt-0">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {customObjectives}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
