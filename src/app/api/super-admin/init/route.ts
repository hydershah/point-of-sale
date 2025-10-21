import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

/**
 * Initialize super admin account
 * This endpoint creates the first super admin if none exists
 * Protected by environment variable secret
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, secret } = body

    // Require a secret key to prevent unauthorized creation
    const initSecret = process.env.SUPER_ADMIN_INIT_SECRET || process.env.NEXTAUTH_SECRET

    if (!secret || secret !== initSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid secret' },
        { status: 401 }
      )
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters long' },
        { status: 400 }
      )
    }

    // Check if super admin already exists
    const existing = await prisma.super_admins.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Super admin with this email already exists' },
        { status: 409 }
      )
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(password, 12)
    const superAdmin = await prisma.super_admins.create({
      data: {
        id: nanoid(),
        email,
        password: hashedPassword,
        name: 'Super Admin',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      email: superAdmin.email,
    })
  } catch (error) {
    console.error('Error creating super admin:', error)
    return NextResponse.json(
      { error: 'Failed to create super admin' },
      { status: 500 }
    )
  }
}

/**
 * Check if any super admin exists
 */
export async function GET() {
  try {
    const count = await prisma.super_admins.count()

    return NextResponse.json({
      exists: count > 0,
      count,
      needsInitialization: count === 0,
    })
  } catch (error) {
    console.error('Error checking super admin:', error)
    return NextResponse.json(
      { error: 'Failed to check super admin status' },
      { status: 500 }
    )
  }
}
