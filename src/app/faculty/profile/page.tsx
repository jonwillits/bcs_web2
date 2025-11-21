import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'

export default async function FacultyProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/faculty/profile')
  }

  // Redirect to public profile view
  redirect(`/profile/${session.user.id}`)
}
