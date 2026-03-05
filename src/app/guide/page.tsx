import { Metadata } from "next"
import fs from "fs"
import path from "path"
import { PublicLayout } from "@/components/layouts/app-layout"
import { UserGuide } from "@/components/public/user-guide"

export const metadata: Metadata = {
  title: "User Guide | BCS E-Learning",
  description:
    "Complete guide to using the Brain & Cognitive Sciences E-Learning Platform — browse courses, manage content, track progress, and more.",
}

export default function GuidePage() {
  const filePath = path.join(process.cwd(), "docs", "USER_GUIDE.md")
  const content = fs.readFileSync(filePath, "utf-8")

  return (
    <PublicLayout>
      <UserGuide content={content} />
    </PublicLayout>
  )
}
