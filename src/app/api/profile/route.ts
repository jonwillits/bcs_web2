import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        about: true,
        speciality: true,
        interested_fields: true,
        university: true,
        avatar_url: true,
        role: true,
        google_scholar_url: true,
        personal_website_url: true,
        linkedin_url: true,
        twitter_url: true,
        github_url: true,
        // Student fields
        major: true,
        graduation_year: true,
        academic_interests: true
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      about,
      speciality,
      university,
      interested_fields,
      avatar_url,
      google_scholar_url,
      personal_website_url,
      linkedin_url,
      twitter_url,
      github_url,
      // Student fields
      major,
      graduation_year,
      academic_interests
    } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        about: about?.trim() || null,
        speciality: speciality?.trim() || null,
        university: university?.trim() || null,
        interested_fields: Array.isArray(interested_fields) ? interested_fields : [],
        avatar_url: avatar_url?.trim() || null,
        google_scholar_url: google_scholar_url?.trim() || null,
        personal_website_url: personal_website_url?.trim() || null,
        linkedin_url: linkedin_url?.trim() || null,
        twitter_url: twitter_url?.trim() || null,
        github_url: github_url?.trim() || null,
        // Student fields
        major: major?.trim() || null,
        graduation_year: graduation_year ? parseInt(graduation_year, 10) : null,
        academic_interests: Array.isArray(academic_interests) ? academic_interests : []
      },
      select: {
        id: true,
        name: true,
        about: true,
        speciality: true,
        university: true,
        interested_fields: true,
        avatar_url: true,
        google_scholar_url: true,
        personal_website_url: true,
        linkedin_url: true,
        twitter_url: true,
        github_url: true,
        // Student fields
        major: true,
        graduation_year: true,
        academic_interests: true
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
