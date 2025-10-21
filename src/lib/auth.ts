import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          const email = credentials.email
          const password = credentials.password

          console.log('Attempting login for:', email)

          // Check if this is a super admin login
          const superAdmin = await prisma.super_admins.findUnique({
            where: { email },
          })

          if (superAdmin) {
            console.log('Found super admin:', email)
            const isValid = await bcrypt.compare(password, superAdmin.password)
            if (!isValid) {
              console.log('Invalid password for super admin:', email)
              return null
            }

            console.log('Super admin login successful:', email)
            return {
              id: superAdmin.id,
              email: superAdmin.email,
              name: superAdmin.name,
              role: 'SUPER_ADMIN',
              tenantId: null,
              tenantSubdomain: null,
            }
          }

          // Try to find tenant user by email
          console.log('Checking tenant users for:', email)
          const user = await prisma.users.findFirst({
            where: {
              email,
              isActive: true,
            },
            include: {
              tenants: true,
            },
          })

          if (!user) {
            console.log('No user found for:', email)
            return null
          }

          console.log('Found user:', email, 'Role:', user.role)
          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            console.log('Invalid password for user:', email)
            return null
          }

          console.log('User login successful:', email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenantSubdomain: user.tenants?.subdomain || null,
          }
        } catch (error) {
          console.error('Error in authorize:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantSubdomain = user.tenantSubdomain ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | null
        session.user.tenantSubdomain = token.tenantSubdomain as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
