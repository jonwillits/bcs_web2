import { Metadata } from 'next';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { CourseMapPublic } from '@/components/course-map/CourseMapPublic';
import { CourseMapAuthenticated } from '@/components/course-map/CourseMapAuthenticated';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Fetch course title for metadata
  const course = await prisma.courses.findUnique({
    where: { slug, status: 'published' },
    select: { title: true, description: true }
  });

  if (!course) {
    return {
      title: 'Course Map - Course Not Found',
      description: 'The requested course could not be found.'
    };
  }

  return {
    title: `${course.title} - Course Map`,
    description: course.description || `Interactive course map for ${course.title}`,
    openGraph: {
      title: `${course.title} - Course Map`,
      description: course.description || `Explore the learning journey for ${course.title}`,
      type: 'website'
    }
  };
}

export default async function CourseMapPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;

  // Verify course exists
  const course = await prisma.courses.findUnique({
    where: { slug, status: 'published' },
    select: { id: true, title: true }
  });

  if (!course) {
    redirect('/courses');
  }

  // Determine which component to render based on authentication
  let content;
  if (session?.user) {
    // Check if user is enrolled
    const enrollment = await prisma.course_tracking.findUnique({
      where: {
        course_id_user_id: {
          course_id: course.id,
          user_id: session.user.id
        }
      }
    });

    if (enrollment) {
      // User is enrolled - show personalized course map
      content = <CourseMapAuthenticated courseSlug={slug} userId={session.user.id} />;
    } else {
      // Not enrolled but authenticated - show public preview with enrollment CTA
      content = <CourseMapPublic courseSlug={slug} isAuthenticated={true} />;
    }
  } else {
    // Not logged in - show public preview with sign-in CTA
    content = <CourseMapPublic courseSlug={slug} isAuthenticated={false} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        {content}
      </div>
    </div>
  );
}
