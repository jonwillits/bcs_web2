import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { StandaloneModuleViewer } from '@/components/public/standalone-module-viewer'
import { PublicLayout } from '@/components/layouts/app-layout'

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

  // Type cast the module data to ensure proper TypeScript types
  const moduleData = {
    ...foundModule,
    status: foundModule.status as 'draft' | 'published',
    createdAt: foundModule.created_at.toISOString(),
    updatedAt: foundModule.updated_at.toISOString(),
    author: foundModule.users, // Map users to author for component compatibility
    parentModule: foundModule.modules, // Map modules to parentModule for component compatibility
    subModules: foundModule.other_modules.map(subModule => ({
      ...subModule,
      sortOrder: subModule.sort_order // Map sort_order to sortOrder for component compatibility
    })), // Map other_modules to subModules for component compatibility
    resources: foundModule.module_media.map(mm => ({
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
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            {foundModule.modules && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/modules/${foundModule.modules.slug}`} className="hover:text-foreground">
                  {foundModule.modules.title}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{foundModule.title}</span>
          </nav>
        </div>

        {/* Module Content */}
        <StandaloneModuleViewer module={moduleData} />
      </div>
    </PublicLayout>
  )
}
