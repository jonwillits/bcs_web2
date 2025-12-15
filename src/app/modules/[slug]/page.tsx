import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { StandaloneModuleViewer } from '@/components/public/standalone-module-viewer'
import { PublicLayout } from '@/components/layouts/app-layout'
import { ModuleTreeSidebar } from '@/components/modules/module-tree-sidebar'
import { ModuleBreadcrumbs } from '@/components/modules/module-breadcrumbs'
import { ModuleNavigationCards } from '@/components/modules/module-navigation-cards'
import { MobileModuleDrawer } from '@/components/modules/mobile-module-drawer'
import {
  getModuleBreadcrumbs,
  getModuleSiblings,
  getStandaloneModuleTree,
} from '@/lib/modules/hierarchy-helpers'

interface ModulePageProps {
  params: Promise<{ slug: string }>
}

async function getModuleBySlug(slug: string) {
  const foundModule = await prisma.modules.findFirst({
    where: {
      slug,
      status: 'published', // Only show published modules publicly
    },
    include: {
      users: {
        select: {
          name: true,
          email: true,
        },
      },
      modules: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      other_modules: {
        where: {
          status: 'published', // Only show published submodules
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          sort_order: true,
        },
        orderBy: {
          sort_order: 'asc',
        },
      },
      module_media: {
        include: {
          media_files: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  })

  return foundModule
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { slug } = await params
  const foundModule = await getModuleBySlug(slug)

  if (!foundModule) {
    return {
      title: 'Module Not Found',
      description: 'The requested module could not be found.',
    }
  }

  return {
    title: `${foundModule.title} | BCS E-Textbook`,
    description: foundModule.description || `Learn about ${foundModule.title} in this educational module.`,
    openGraph: {
      title: foundModule.title,
      description: foundModule.description || `Learn about ${foundModule.title} in this educational module.`,
      type: 'article',
      authors: [foundModule.users.name],
    },
  }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { slug } = await params
  const foundModule = await getModuleBySlug(slug)

  if (!foundModule) {
    notFound()
  }

  // Check if user is authenticated and fetch their progress
  const session = await auth()
  let moduleProgress: 'not_started' | 'completed' = 'not_started'

  if (session?.user?.id) {
    // Check if module is completed (in any context - course or standalone)
    const progress = await prisma.module_progress.findFirst({
      where: {
        user_id: session.user.id,
        module_id: foundModule.id,
        status: 'completed'
      }
    })

    if (progress) {
      moduleProgress = 'completed'
    }
  }

  // Fetch hierarchical navigation data
  const breadcrumbs = await getModuleBreadcrumbs(foundModule.id)
  const siblings = await getModuleSiblings(foundModule.id)
  const { tree } = await getStandaloneModuleTree(foundModule.id)

  // Type cast the module data to ensure proper TypeScript types
  const moduleData = {
    ...foundModule,
    status: foundModule.status as 'draft' | 'published',
    createdAt: foundModule.created_at.toISOString(),
    updatedAt: foundModule.updated_at.toISOString(),
    author: foundModule.users,
    parentModule: foundModule.modules,
    subModules: foundModule.other_modules.map((subModule) => ({
      ...subModule,
      sortOrder: subModule.sort_order,
    })),
    resources: foundModule.module_media.map((mm) => ({
      id: mm.media_files.id,
      name: mm.media_files.original_name,
      filename: mm.media_files.filename,
      size: Number(mm.media_files.file_size),
      mimeType: mm.media_files.mime_type,
      url: mm.media_files.storage_path,
      uploadedAt: mm.created_at.toISOString(),
    })),
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <ModuleBreadcrumbs breadcrumbs={breadcrumbs} baseUrl="/modules" />
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Tree Navigation Sidebar - Hidden on mobile, shown on desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 h-[calc(100vh-6rem)] border rounded-lg bg-card">
              <ModuleTreeSidebar
                tree={tree}
                currentModuleId={foundModule.id}
                baseUrl="/modules"
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            <StandaloneModuleViewer
              module={moduleData}
              userId={session?.user?.id}
              initialProgress={moduleProgress}
            />

            {/* Navigation Cards */}
            <div className="mt-8">
              <ModuleNavigationCards
                parentModule={foundModule.modules}
                previousModule={siblings.previous}
                nextModule={siblings.next}
                baseUrl="/modules"
              />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileModuleDrawer
        tree={tree}
        currentModuleId={foundModule.id}
        baseUrl="/modules"
      />
    </PublicLayout>
  )
}
