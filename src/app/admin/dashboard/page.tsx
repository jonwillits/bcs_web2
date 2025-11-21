import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserX, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/dashboard')
  }

  if (!isAdmin(session)) {
    redirect('/')
  }

  // Fetch platform statistics
  const [
    totalUsers,
    studentCount,
    facultyCount,
    pendingFacultyCount,
    totalCourses,
    totalModules,
    recentRegistrations,
    pendingRequests,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { role: 'student' } }),
    prisma.users.count({ where: { role: 'faculty' } }),
    prisma.users.count({ where: { role: 'pending_faculty' } }),
    prisma.courses.count(),
    prisma.modules.count(),
    prisma.users.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    }),
    prisma.faculty_requests.findMany({
      where: { approval_status: 'pending' },
      take: 5,
      orderBy: { requested_at: 'desc' },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            university: true,
          },
        },
      },
    }),
  ])

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      description: 'All registered users',
      color: 'text-blue-600',
    },
    {
      title: 'Students',
      value: studentCount,
      icon: UserCheck,
      description: 'Active student accounts',
      color: 'text-green-600',
    },
    {
      title: 'Faculty',
      value: facultyCount,
      icon: UserCheck,
      description: 'Approved faculty members',
      color: 'text-purple-600',
    },
    {
      title: 'Pending Requests',
      value: pendingFacultyCount,
      icon: Clock,
      description: 'Awaiting approval',
      color: 'text-yellow-600',
    },
    {
      title: 'Total Courses',
      value: totalCourses,
      icon: TrendingUp,
      description: 'Published courses',
      color: 'text-indigo-600',
    },
    {
      title: 'Total Modules',
      value: totalModules,
      icon: TrendingUp,
      description: 'Learning modules',
      color: 'text-teal-600',
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-neural-primary mb-2">
            Platform Overview
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage the BCS E-Textbook Platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="cognitive-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pending Faculty Requests */}
        {pendingRequests.length > 0 && (
          <Card className="cognitive-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Pending Faculty Requests</CardTitle>
                  <CardDescription>
                    {pendingRequests.length} request(s) awaiting review
                  </CardDescription>
                </div>
                <Link
                  href="/admin/faculty-requests"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-neural-primary text-neural-primary hover:bg-neural-primary hover:text-white h-9 px-3 self-start sm:self-auto"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border border-neural-light/30 rounded-lg hover:bg-neural-light/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{request.requester.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.requester.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.requester.university}
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0">
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/admin/faculty-requests?highlight=${request.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-neural-primary to-synapse-primary text-white hover:opacity-90 h-9 px-4 sm:mt-2 whitespace-nowrap"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Registrations */}
        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRegistrations.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 border border-neural-light/20 rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded whitespace-nowrap ${
                        user.role === 'student'
                          ? 'bg-green-100 text-green-800'
                          : user.role === 'faculty'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'pending_faculty'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'pending_faculty' ? 'Pending' : user.role}
                    </span>
                    <p className="text-xs text-muted-foreground sm:mt-1 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
