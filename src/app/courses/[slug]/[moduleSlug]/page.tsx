import { notFound, redirect } from "next/navigation";
import { CourseViewer } from "@/components/public/course-viewer";
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';

async function getCourse(slug: string) {
  try {
    const course = await withDatabaseRetry(async () => {
      return await prisma.courses.findFirst({
        where: {
          slug,
          status: 'published',
        },
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
          course_modules: {
            include: {
              modules: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  description: true,
                  content: true,
                  status: true,
                  parent_module_id: true,
                  sort_order: true,
                  created_at: true,
                  updated_at: true,
                  module_media: {
                    include: {
                      media_files: true,
                    },
                    orderBy: {
                      created_at: 'desc',
                    },
                  },
                },
              },
            },
            where: {
              modules: {
                status: 'published',
              },
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
          _count: {
            select: {
              course_modules: true,
            },
          },
        },
      })
    })

    if (!course) {
      return null;
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      featured: course.featured || false,
      status: course.status,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      author: {
        name: course.users.name,
        email: course.users.email,
      },
      courseModules: course.course_modules.map(cm => ({
        sortOrder: cm.sort_order,
        customTitle: cm.custom_title,
        customNotes: cm.custom_notes,
        customContext: cm.custom_context,
        customObjectives: cm.custom_objectives,
        module: {
          id: cm.modules.id,
          title: cm.modules.title,
          slug: cm.modules.slug,
          description: cm.modules.description,
          content: cm.modules.content,
          status: cm.modules.status,
          parentModuleId: cm.modules.parent_module_id,
          sortOrder: cm.modules.sort_order,
          createdAt: cm.modules.created_at,
          updatedAt: cm.modules.updated_at,
          resources: cm.modules.module_media.map(mm => ({
            id: mm.media_files.id,
            name: mm.media_files.original_name,
            filename: mm.media_files.filename,
            size: Number(mm.media_files.file_size),
            mimeType: mm.media_files.mime_type,
            url: mm.media_files.storage_path,
            uploadedAt: mm.created_at,
          })),
        }
      })),
      _count: {
        courseModules: course._count.course_modules,
      },
    };
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
