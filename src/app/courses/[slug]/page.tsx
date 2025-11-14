import { notFound } from "next/navigation";
import { CourseViewer } from "@/components/public/course-viewer";
import { PublicLayout } from "@/components/layouts/app-layout";
import { prisma } from '@/lib/db';
import { withDatabaseRetry } from '@/lib/retry';
import { buildModuleTree, generateModuleNumbering, applyNumberingToTree } from '@/lib/modules/hierarchy-helpers';

async function getCourse(slug: string) {
  try {
    const course = await prisma.courses.findFirst({
      where: {
        slug,
        status: 'published', // Only show published courses publicly
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            speciality: true,
            university: true,
            about: true,
            google_scholar_url: true,
            personal_website_url: true,
            linkedin_url: true,
            twitter_url: true,
            github_url: true,
          },
        },
        collaborators: {
          include: {
            collaborator: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                speciality: true,
                university: true,
                about: true,
                google_scholar_url: true,
                personal_website_url: true,
                linkedin_url: true,
                twitter_url: true,
                github_url: true,
              },
            },
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
              },
            },
          },
          where: {
            modules: {
              status: 'published', // Only include published modules
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
    });

    if (!course) {
      return null;
    }

    // Build hierarchical tree structure from course modules
    const modules = course.course_modules.map(cm => ({
      id: cm.modules.id,
      title: cm.modules.title,
      slug: cm.modules.slug,
      description: cm.modules.description,
      parent_module_id: cm.modules.parent_module_id,
      sort_order: cm.modules.sort_order,
      status: cm.modules.status,
      created_at: cm.modules.created_at,
      updated_at: cm.modules.updated_at,
    }))

    const tree = buildModuleTree(modules)
    const numbering = generateModuleNumbering(tree)
    applyNumberingToTree(tree, numbering)

    // Transform data structure to match component expectations
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
        id: course.users.id,
        name: course.users.name,
        email: course.users.email,
        avatar_url: course.users.avatar_url,
        speciality: course.users.speciality,
        university: course.users.university,
        about: course.users.about,
        google_scholar_url: course.users.google_scholar_url,
        personal_website_url: course.users.personal_website_url,
        linkedin_url: course.users.linkedin_url,
        twitter_url: course.users.twitter_url,
        github_url: course.users.github_url,
      },
      collaborators: course.collaborators.map(collab => ({
        id: collab.collaborator.id,
        name: collab.collaborator.name,
        email: collab.collaborator.email,
        avatar_url: collab.collaborator.avatar_url,
        speciality: collab.collaborator.speciality,
        university: collab.collaborator.university,
        about: collab.collaborator.about,
        google_scholar_url: collab.collaborator.google_scholar_url,
        personal_website_url: collab.collaborator.personal_website_url,
        linkedin_url: collab.collaborator.linkedin_url,
        twitter_url: collab.collaborator.twitter_url,
        github_url: collab.collaborator.github_url,
      })),
      courseModules: course.course_modules.map(cm => ({
        sortOrder: cm.sort_order,
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
        }
      })),
      moduleTree: tree, // Add hierarchical tree
      moduleNumbering: Object.fromEntries(numbering), // Add numbering map
      _count: {
        courseModules: course._count.course_modules,
      },
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    return {
      title: "Course Not Found - Brain & Cognitive Sciences",
      description: "The requested course could not be found.",
    };
  }

  return {
    title: `${course.title} - Brain & Cognitive Sciences`,
    description: course.description || `Learn about ${course.title} through interactive modules and comprehensive content.`,
    keywords: ["neuroscience", "cognitive science", "brain", "learning", course.title],
    openGraph: {
      title: `${course.title} - Brain & Cognitive Sciences`,
      description: course.description || `Learn about ${course.title} through interactive modules.`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} - Brain & Cognitive Sciences`,
      description: course.description || `Learn about ${course.title} through interactive modules.`,
    },
  };
}

export default async function CoursePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ module?: string; search?: string }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  return (
    <PublicLayout>
      <CourseViewer course={course} initialModule={search?.module} initialSearch={search?.search} />
    </PublicLayout>
  );
}
