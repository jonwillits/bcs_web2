import { notFound, redirect } from "next/navigation";
import { CourseViewer } from "@/components/public/course-viewer";
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

async function getCourse(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/courses/by-slug/${slug}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; moduleSlug: string }> 
}) {
  const { slug, moduleSlug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    return {
      title: "Course Not Found - Brain & Cognitive Sciences",
      description: "The requested course could not be found.",
    };
  }

  // Find the specific module
  const foundModule = course.courseModules.find((cm: any) => 
    cm.module.slug === moduleSlug
  )?.module;

  if (!foundModule) {
    return {
      title: `${course.title} - Brain & Cognitive Sciences`,
      description: course.description || `Learn about ${course.title} through interactive modules.`,
    };
  }

  return {
    title: `${foundModule.title} - ${course.title} - Brain & Cognitive Sciences`,
    description: foundModule.description || `Learn about ${foundModule.title} in the ${course.title} course.`,
    keywords: ["neuroscience", "cognitive science", "brain", "learning", course.title, foundModule.title],
    openGraph: {
      title: `${foundModule.title} - ${course.title} - Brain & Cognitive Sciences`,
      description: foundModule.description || `Learn about ${foundModule.title} in the ${course.title} course.`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${foundModule.title} - ${course.title} - Brain & Cognitive Sciences`,
      description: foundModule.description || `Learn about ${foundModule.title} in the ${course.title} course.`,
    },
  };
}

export default async function ModulePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; moduleSlug: string }>;
  searchParams?: Promise<{ search?: string }>;
}) {
  const { slug, moduleSlug } = await params;
  const search = await searchParams;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  // Check if the module exists
  const moduleExists = course.courseModules.find((cm: any) =>
    cm.module.slug === moduleSlug
  );

  if (!moduleExists) {
    // Redirect to course page if module doesn't exist
    redirect(`/courses/${slug}`);
  }

  // Check if user is logged in and if they have enrolled in this course
  const session = await auth();
  let isStarted = false;

  if (session?.user?.id) {
    const tracking = await withDatabaseRetry(async () => {
      return await prisma.course_tracking.findUnique({
        where: {
          course_id_user_id: {
            course_id: course.id,
            user_id: session.user.id,
          },
        },
      });
    });
    isStarted = !!tracking;
  }

  return (
    <CourseViewer
      course={course}
      initialModule={moduleSlug}
      initialSearch={search?.search}
      session={session}
      isStarted={isStarted}
    />
  );
}
