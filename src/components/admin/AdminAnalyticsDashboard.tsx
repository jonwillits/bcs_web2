'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Users, BookOpen, Layers, TrendingUp, Activity, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  users: {
    total: number;
    byRole: {
      student: number;
      faculty: number;
      pending_faculty: number;
      admin: number;
    };
    active: number;
    suspended: number;
    unverified: number;
  };
  content: {
    courses: {
      total: number;
      published: number;
      draft: number;
    };
    modules: {
      total: number;
      published: number;
    };
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  recentActivity: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
    }>;
    courses: Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      created_at: string;
      users: { name: string };
    }>;
    enrollments: Array<{
      id: string;
      started_at: string;
      user: { name: string; email: string };
      course: { title: string; slug: string };
    }>;
  };
  trends: {
    userGrowth: Array<{
      date: string;
      count: number;
    }>;
  };
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">Loading platform analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 text-lg mb-4">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare data for charts
  const userRoleData = [
    { name: 'Students', value: analytics.users.byRole.student },
    { name: 'Faculty', value: analytics.users.byRole.faculty },
    { name: 'Pending Faculty', value: analytics.users.byRole.pending_faculty },
    { name: 'Admins', value: analytics.users.byRole.admin },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-neural-primary mb-2">Platform Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive platform metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.users.active} active (7d)
            </p>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.content.courses.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.content.courses.published} published
            </p>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Layers className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.content.modules.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.content.modules.published} published
            </p>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.enrollments.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.enrollments.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>User Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="New Users"
                  dot={{ fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cognitive-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">User Status</CardTitle>
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="font-semibold">{analytics.users.total - analytics.users.suspended}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Suspended</span>
              <span className="font-semibold text-red-600">{analytics.users.suspended}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Unverified Email</span>
              <span className="font-semibold text-yellow-600">{analytics.users.unverified}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Course Status</CardTitle>
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Published</span>
              <span className="font-semibold">{analytics.content.courses.published}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Drafts</span>
              <span className="font-semibold text-yellow-600">{analytics.content.courses.draft}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold text-neural-primary">{analytics.content.courses.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enrollment Metrics</CardTitle>
              <Award className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active (7d)</span>
              <span className="font-semibold">{analytics.enrollments.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-semibold text-green-600">{analytics.enrollments.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <span className="font-semibold text-neural-primary">{analytics.enrollments.completionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.recentActivity.users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <div className="text-xs text-muted-foreground ml-2">
                  {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.recentActivity.courses.slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{course.title}</div>
                  <div className="text-xs text-muted-foreground">by {course.users.name}</div>
                </div>
                <div className="text-xs text-muted-foreground ml-2">
                  {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.recentActivity.enrollments.slice(0, 5).map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{enrollment.user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{enrollment.course.title}</div>
                </div>
                <div className="text-xs text-muted-foreground ml-2">
                  {new Date(enrollment.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
