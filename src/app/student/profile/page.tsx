import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'

export default async function StudentProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/student/profile')
  }

  // Redirect to public profile view
  redirect(`/profile/${session.user.id}`)
}
