'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User, Mail, GraduationCap, School, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/RoleBadge';

interface Learner {
  trackingId: string;
  startedAt: string;
  lastAccessed: string;
  learner: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    major: string | null;
    graduationYear: number | null;
    university: string | null;
  };
}

interface FacultyStudentListProps {
  courseId: string;
}

export function FacultyStudentList({ courseId }: FacultyStudentListProps) {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        const response = await fetch(`/api/faculty/courses/${courseId}/students`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch learners');
        }

        setLearners(data.learners);
        setTotalCount(data.totalCount);
        setActiveCount(data.activeCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load learners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearners();
  }, [courseId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading learners...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (learners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No one has enrolled in this course yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrolled Learners ({totalCount})</CardTitle>
        <p className="text-sm text-muted-foreground">
          {activeCount} active in the last 30 days
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Learner</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Major</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Started</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((data) => (
                <tr key={data.trackingId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {data.learner.avatarUrl ? (
                        <Image
                          src={data.learner.avatarUrl}
                          alt={data.learner.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{data.learner.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {data.learner.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <RoleBadge role={data.learner.role} />
                  </td>
                  <td className="py-3 px-4">
                    {data.learner.major && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <GraduationCap className="h-4 w-4 text-gray-500" />
                          {data.learner.major}
                        </div>
                        {data.learner.graduationYear && (
                          <div className="text-xs text-muted-foreground">
                            Class of {data.learner.graduationYear}
                          </div>
                        )}
                      </div>
                    )}
                    {data.learner.university && !data.learner.major && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <School className="h-4 w-4 text-gray-500" />
                        {data.learner.university}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(data.startedAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(data.lastAccessed), { addSuffix: true })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
