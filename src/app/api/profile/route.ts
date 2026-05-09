import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const optionalUrl = z.union([
  z.string().url().max(500),
  z.literal(''),
  z.null(),
]).optional().transform(v => (v === '' || v == null) ? null : v)

const optionalGradYear = z.union([
  z.coerce.number().int().min(2000).max(2100),
  z.literal(''),
  z.null(),
]).optional().transform(v => (v === '' || v == null) ? null : v)

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  about: z.string().max(500).optional().nullable(),
  speciality: z.string().max(200).optional().nullable(),
  university: z.string().max(200).optional().nullable(),
  interested_fields: z.array(z.string().max(100)).max(20).optional().default([]),
  avatar_url: optionalUrl,
  google_scholar_url: optionalUrl,
  personal_website_url: optionalUrl,
  linkedin_url: optionalUrl,
  twitter_url: optionalUrl,
  github_url: optionalUrl,
  major: z.string().max(100).optional().nullable(),
  graduation_year: optionalGradYear,
  academic_interests: z.array(z.string().max(100)).max(20).optional().default([]),
})

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
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }

    const {
      name, about, speciality, university, interested_fields,
      avatar_url, google_scholar_url, personal_website_url,
      linkedin_url, twitter_url, github_url,
      major, graduation_year, academic_interests
    } = parsed.data

    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        about: about?.trim() || null,
        speciality: speciality?.trim() || null,
        university: university?.trim() || null,
        interested_fields: interested_fields || [],
        avatar_url: avatar_url || null,
        google_scholar_url: google_scholar_url || null,
        personal_website_url: personal_website_url || null,
        linkedin_url: linkedin_url || null,
        twitter_url: twitter_url || null,
        github_url: github_url || null,
        major: major?.trim() || null,
        graduation_year: graduation_year ?? null,
        academic_interests: academic_interests || [],
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
