'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowLeft, Users, TrendingUp, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  courseTitle: string;
  enrollment: {
    total: number;
    active: number;
    completed: number;
  };
  completionRate: number;
  averageProgress: number;
  moduleAnalytics: Array<{
    moduleId: string;
    moduleTitle: string;
    moduleSlug: string;
    startedCount: number;
    completedCount: number;
    dropoffRate: number;
    completionRate: number;
  }>;
  recentActivity: Array<{
    moduleTitle: string;
    completedAt: string;
  }>;
  enrollmentTrend: Array<{
    date: string;
    count: number;
  }>;
}

interface CourseAnalyticsDashboardProps {
  courseId: string;
}

export default function CourseAnalyticsDashboard({ courseId }: CourseAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/analytics/${courseId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <Link
          href="/faculty/courses"
          className="text-purple-600 hover:text-purple-700 transition-colors"
        >
          Return to Courses
        </Link>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/faculty/courses"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
          <h1 className="text-3xl font-bold text-neural-primary">{analytics.courseTitle}</h1>
          <p className="text-muted-foreground mt-2">Course Analytics Dashboard</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Enrollments"
          value={analytics.enrollment.total}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Active Students"
          value={analytics.enrollment.active}
          subtitle="Last 7 days"
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Completion Rate"
          value={`${analytics.completionRate}%`}
          subtitle={`${analytics.enrollment.completed} completed`}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Average Progress"
          value={`${analytics.averageProgress}%`}
          color="text-synapse-400"
          bgColor="bg-synapse-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Completion Rates */}
        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>Module Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.moduleAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.moduleAnalytics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="moduleTitle"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#8B5CF6" name="Completion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center py-12">No module data available</div>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Trend */}
        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>Enrollment Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.enrollmentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Enrollments', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="New Enrollments"
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center py-12">No enrollment data in last 30 days</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Analytics Table */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Module Performance Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {analytics.moduleAnalytics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Module</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Started</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Completed</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Completion Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Dropoff Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.moduleAnalytics.map((module) => (
                    <tr key={module.moduleId} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{module.moduleTitle}</td>
                      <td className="py-3 px-4 text-right">{module.startedCount}</td>
                      <td className="py-3 px-4 text-right">{module.completedCount}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${
                          module.completionRate >= 80 ? 'text-green-600' :
                          module.completionRate >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {module.completionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${
                          module.dropoffRate <= 20 ? 'text-green-600' :
                          module.dropoffRate <= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {module.dropoffRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-12">No module analytics available</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="cognitive-card">
        <CardHeader>
          <CardTitle>Recent Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="font-medium">{activity.moduleTitle}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {new Date(activity.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-12">No recent completions</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, label, value, subtitle, color, bgColor }: StatCardProps) {
  return (
    <Card className="cognitive-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <div className={color}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
