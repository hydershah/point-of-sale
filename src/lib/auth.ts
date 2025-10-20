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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email
        const password = credentials.password

        // Check if this is a super admin login
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email },
        })

        if (superAdmin) {
          const isValid = await bcrypt.compare(password, superAdmin.password)
          if (!isValid) {
            return null
          }

          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: 'SUPER_ADMIN',
            tenantId: null,
          }
        }

        // Try to find tenant user by email
        const user = await prisma.user.findFirst({
          where: {
            email,
            isActive: true,
          },
          include: {
            tenant: true,
          },
        })

        if (!user) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
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
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | null
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
}

export default NextAuth(authOptions)
