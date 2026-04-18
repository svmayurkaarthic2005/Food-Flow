import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('AUTH DEBUG: Credentials authorize called', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('AUTH DEBUG: Missing credentials')
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
            role: true,
            status: true,
            avatar: true,
            emailVerified: true,
            donorProfile: true,
            ngoProfile: true,
            adminProfile: true,
          },
        })

        console.log('AUTH DEBUG: User found', { 
          id: user?.id, 
          email: user?.email, 
          role: user?.role,
          hasPasswordHash: !!user?.passwordHash 
        })

        if (!user || !user.passwordHash) {
          console.log('AUTH DEBUG: User not found or no password')
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        console.log('AUTH DEBUG: Password validation', { isValid: isPasswordValid })

        if (!isPasswordValid) {
          console.log('AUTH DEBUG: Invalid password')
          throw new Error('Invalid email or password')
        }

        // Check if email is verified
        if (!user.emailVerified) {
          console.log('AUTH DEBUG: Email not verified')
          throw new Error('Please verify your email before logging in')
        }

        console.log('AUTH DEBUG: Authorization successful')
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          donorId: user.donorProfile?.id,
          ngoId: user.ngoProfile?.id,
          adminId: user.adminProfile?.id,
        }
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: "672558112297-ruggk2h9bbjij866esgqorc9ih2d7dv5.apps.googleusercontent.com",
      clientSecret: "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",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      profile(profile) {
        console.log('AUTH DEBUG: Google profile received:', profile)
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
  ],

  // Log configuration on startup
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    },
  },

  pages: {
    signIn: '/signin',
    verifyRequest: '/auth/verify-email',
    error: '/signin',
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // If the URL is already a full URL starting with the base URL, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // If it's a relative URL, prepend the base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Default to base URL
      return baseUrl
    },

    async signIn({ user, account }) {
      try {
        console.log('AUTH DEBUG: signIn callback called', { 
          provider: account?.provider, 
          email: user?.email,
          userId: user?.id,
          image: user?.image 
        })

        if (account?.provider === 'google' && user.email) {
          console.log('AUTH DEBUG: Google OAuth sign in detected')
          
          // Update user avatar with Google profile picture
          if (user.image) {
            await prisma.user.update({
              where: { email: user.email },
              data: { avatar: user.image },
            })
            console.log('AUTH DEBUG: Updated user avatar from Google:', user.image)
          }
          
          // For Google OAuth, the adapter handles user creation
          // We just need to ensure profile creation if needed
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              role: true,
              status: true,
              name: true,
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })

          console.log('AUTH DEBUG: Google user found', { 
            id: dbUser?.id, 
            role: dbUser?.role,
            hasDonorProfile: !!dbUser?.donorProfile,
            hasNgoProfile: !!dbUser?.ngoProfile 
          })

          // Only create profile if missing
          if (dbUser && dbUser.role === 'DONOR' && !dbUser.donorProfile) {
            console.log('AUTH DEBUG: Creating donor profile for Google user')
            await prisma.donor.create({
              data: {
                userId: dbUser.id,
                businessName: dbUser.name || 'Donor Account',
                businessType: 'Other',
                address: '',
                latitude: 0,
                longitude: 0,
              },
            })
          }

          if (dbUser && dbUser.role === 'NGO' && !dbUser.ngoProfile) {
            console.log('AUTH DEBUG: Creating NGO profile for Google user')
            await prisma.ngo.create({
              data: {
                userId: dbUser.id,
                organizationName: dbUser.name || 'NGO Account',
                address: '',
                latitude: 0,
                longitude: 0,
                storageCapacity: 0,
              },
            })
          }

          if (dbUser && dbUser.role === 'ADMIN' && !dbUser.adminProfile) {
            console.log('AUTH DEBUG: Creating admin profile for Google user')
            await prisma.admin.create({
              data: {
                userId: dbUser.id,
              },
            })
          }
        }

        return true
      } catch (error) {
        console.error('SIGNIN ERROR FULL:', JSON.stringify(error, null, 2))
        console.error('SIGNIN ERROR:', error)
        return false
      }
    },

    async jwt({ token, user, account, trigger }) {
      try {
        // On sign in, get fresh user data only if not already in token
        if (user && !token.role) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              avatar: true,
              emailVerified: true,
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.donorId = dbUser.donorProfile?.id
            token.ngoId = dbUser.ngoProfile?.id
            token.adminId = dbUser.adminProfile?.id
            token.status = dbUser.status
          }
        }

        // On update, refresh user data from database
        if (trigger === 'update') {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              avatar: true,
              emailVerified: true,
              donorProfile: true,
              ngoProfile: true,
              adminProfile: true,
            },
          })

          if (dbUser) {
            token.role = dbUser.role
            token.donorId = dbUser.donorProfile?.id
            token.ngoId = dbUser.ngoProfile?.id
            token.adminId = dbUser.adminProfile?.id
            token.status = dbUser.status
          }
        }

        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },

    async session({ session, token }) {
      try {
        if (session.user) {
          (session.user as any).id = token.id as string
          ;(session.user as any).role = token.role
          ;(session.user as any).donorId = token.donorId
          ;(session.user as any).ngoId = token.ngoId
          ;(session.user as any).adminId = token.adminId
          ;(session.user as any).status = token.status
          ;(session.user as any).accessToken = token.accessToken
          
          // Include avatar in session if available
          if (token.picture) {
            session.user.image = token.picture as string
          }
        }

        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  events: {
    async signIn({ user, account }) {
      console.log(`✓ User ${user.email} signed in via ${account?.provider}`)
    },
    async signOut({ session, token }) {
      console.log('✓ User signed out')
      
      // Additional cleanup for OAuth sessions
      if (token) {
        try {
          // If this was an OAuth session, we might want to revoke tokens
          // This is provider-specific and optional
          console.log('Clearing session for user:', token.email)
        } catch (error) {
          console.error('Error during signOut cleanup:', error)
        }
      }
    },
    async createUser({ user }) {
      console.log('✓ New user created:', user.email)
    },
    async linkAccount({ user, account }) {
      console.log('✓ Account linked:', account.provider, 'for user:', user.email)
    },
  },
}

export default NextAuth(authOptions)
