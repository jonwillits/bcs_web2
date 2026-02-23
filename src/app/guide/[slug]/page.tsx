import { Metadata } from "next"
import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import { PublicLayout } from "@/components/layouts/app-layout"
import { UserGuide } from "@/components/public/user-guide"

const GUIDE_DOCS: Record<string, { file: string; title: string }> = {
  "tensorflow-technical": {
    file: "TF_PLAYGROUND_TECHNICAL_GUIDE.md",
    title: "TensorFlow Playground Technical Guide",
  },
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return Object.keys(GUIDE_DOCS).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = GUIDE_DOCS[slug]

  if (!doc) {
    return { title: "Not Found | BCS E-Textbook" }
  }

  return {
    title: `${doc.title} | BCS E-Textbook`,
    description: doc.title,
  }
}

export default async function GuideDocPage({ params }: PageProps) {
  const { slug } = await params
  const doc = GUIDE_DOCS[slug]

  if (!doc) {
    notFound()
  }

  const filePath = path.join(process.cwd(), "docs", doc.file)
  const content = fs.readFileSync(filePath, "utf-8")

  return (
    <PublicLayout>
      <UserGuide content={content} />
    </PublicLayout>
  )
}
