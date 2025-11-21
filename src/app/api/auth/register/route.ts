import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../../../../lib/db'
import { sendVerificationEmail } from '../../../../lib/email'
import { z } from 'zod'
import {
  USER_ROLES,
  ACCOUNT_STATUS,
  determineRoleFromEmail,
  determineAccountStatus,
  isAdminEmail,
  isSuperAdminEmail,
} from '../../../../lib/auth/utils'

// Base validation schema (common fields)
const baseSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-\']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  role: z.enum(['student', 'faculty']),
})

// Student-specific validation
const studentSchema = baseSchema.extend({
  major: z.string().min(1, 'Major is required'),
  graduation_year: z.number()
    .int()
    .min(new Date().getFullYear(), 'Graduation year must be in the future')
    .max(new Date().getFullYear() + 10, 'Graduation year seems too far in the future'),
  academic_interests: z.array(z.string()).optional().default([]),
})

// Faculty-specific validation
const facultySchema = baseSchema.extend({
  university: z.string().min(1, 'University is required for faculty registration'),
  department: z.string().min(1, 'Department is required for faculty registration'),
  title: z.string().min(1, 'Title/Position is required for faculty registration'),
  research_area: z.string().min(1, 'Research area is required for faculty registration'),
  personal_website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  request_statement: z.string()
    .min(50, 'Statement must be at least 50 characters')
    .max(2000, 'Statement must be less than 2000 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const requestedRole = body.role

    // Validate based on role
    let validatedData: any
    if (requestedRole === 'student') {
      validatedData = studentSchema.parse(body)
    } else if (requestedRole === 'faculty') {
      validatedData = facultySchema.parse(body)
    } else {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email: validatedData.email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Determine final role (check for admin email)
    const finalRole = determineRoleFromEmail(validatedData.email, requestedRole as any)
    const isSuperAdmin = isSuperAdminEmail(validatedData.email)
    const accountStatus = determineAccountStatus(finalRole as any)

    // For faculty requests, set role to pending_faculty
    const actualRole = finalRole === USER_ROLES.ADMIN
      ? USER_ROLES.ADMIN
      : requestedRole === 'faculty'
      ? USER_ROLES.PENDING_FACULTY
      : USER_ROLES.STUDENT

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)

    // Generate unique user ID and email verification token
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Prepare user data
    const userData: any = {
      id: userId,
      name: validatedData.name,
      email: validatedData.email,
      password_hash: hashedPassword,
      role: actualRole,
      is_super_admin: isSuperAdmin,
      account_status: accountStatus,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_token_expires: verificationTokenExpires,
      last_verification_email_sent_at: new Date(),
    }

    // Add role-specific fields
    if (requestedRole === 'student') {
      userData.major = validatedData.major
      userData.graduation_year = validatedData.graduation_year
      userData.academic_interests = validatedData.academic_interests || []
    } else if (requestedRole === 'faculty') {
      userData.university = validatedData.university
      userData.department = validatedData.department
      userData.title = validatedData.title
      userData.research_area = validatedData.research_area
      userData.personal_website_url = validatedData.personal_website_url || null
    }

    // Create user and faculty request in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_super_admin: true,
          account_status: true,
          created_at: true,
          email_verified: true,
        },
      })

      // If faculty request, create faculty_requests entry
      if (requestedRole === 'faculty' && actualRole === USER_ROLES.PENDING_FACULTY) {
        await tx.faculty_requests.create({
          data: {
            user_id: userId,
            request_statement: validatedData.request_statement,
            approval_status: 'pending',
            requested_at: new Date(),
          },
        })
      }

      return newUser
    })

    // Send verification email
    try {
      await sendVerificationEmail(result.email, result.name, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email to:', result.email, emailError)
      // Continue with registration but log the error
    }

    // Prepare response message based on role
    let message = ''
    if (actualRole === USER_ROLES.ADMIN) {
      message = 'Admin account created successfully. Please check your email to verify your account.'
    } else if (actualRole === USER_ROLES.PENDING_FACULTY) {
      message = 'Faculty request submitted successfully. Your request will be reviewed by an administrator. Please check your email to verify your account.'
    } else {
      message = 'Student account created successfully. Please check your email to verify your account.'
    }

    return NextResponse.json(
      {
        success: true,
        message,
        requiresVerification: true,
        requiresApproval: actualRole === USER_ROLES.PENDING_FACULTY,
        emailSent: true,
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          role: result.role,
          isSuperAdmin: result.is_super_admin,
          accountStatus: result.account_status,
          createdAt: result.created_at,
          emailVerified: result.email_verified,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle database constraint errors
    if (error instanceof Error && (error.message.includes('Unique constraint') || error.message.includes('unique constraint'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email address already exists',
          field: 'email'
        },
        { status: 409 }
      )
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email address already exists',
            field: 'email'
          },
          { status: 409 }
        )
      }
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error. Please try again later.'
      },
      { status: 500 }
    )
  }
}
