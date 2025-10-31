import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google' // Import GoogleProvider
import { PrismaAdapter } from '@auth/prisma-adapter' // Updated PrismaAdapter import
import { prisma } from '@/lib/prisma'
// @ts-ignore
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import { rateLimiter, checkAndSetLockout } from '@/lib/rateLimit' // Import rate limiter
import { verifyTurnstile } from '@/lib/captcha' // Import captcha verifier

// Extend NextAuth types to include role, tenantId, isVerified, avatarUrl, subscriptionTier
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role?: string // Add role
      tenantId?: string | null // Add tenantId
      isVerified?: boolean // Add isVerified
      avatarUrl?: string | null // Add avatarUrl
      totpRequired?: boolean // Add totpRequired
      subscriptionTier?: string // Add subscriptionTier
      subscriptionStatus?: string // Add subscriptionStatus
      freeTrialEndsAt?: string | Date | null // Add freeTrialEndsAt
    }
  }

  interface User {
    role?: string
    tenantId?: string | null
    isVerified?: boolean
    avatarUrl?: string | null
    totpRequired?: boolean // Add totpRequired to User type
    subscriptionTier?: string // Add subscriptionTier
    subscriptionStatus?: string // Add subscriptionStatus
    freeTrialEndsAt?: string | Date | null // Add freeTrialEndsAt
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: string
    tenantId?: string | null
    isVerified?: boolean
    avatarUrl?: string | null
    totpRequired?: boolean // Add totpRequired to JWT type
    subscriptionTier?: string // Add subscriptionTier
    subscriptionStatus?: string // Add subscriptionStatus
    freeTrialEndsAt?: string | Date | null // Add freeTrialEndsAt
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // Explicitly provide the secret
  // adapter: PrismaAdapter(prisma) as any, // Temporarily disabled due to field mapping issues
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        captcha: { label: 'Captcha', type: 'text' } // Add captcha field
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const ip = (req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : 'unknown') as string;

        // Rate limiting for login attempts
        const loginAttemptKey = `login_attempts:${ip}:${credentials.email}`;
        const lockoutKey = `lockout:${credentials.email}`;

        const lockoutTtlMin = parseInt(process.env.LOCKOUT_TTL_MIN || '15');
        const isLockedOut = await checkAndSetLockout(lockoutKey, lockoutTtlMin);
        if (isLockedOut) {
          console.warn(`[Auth] User ${credentials.email} is locked out.`);
          throw new Error('Too many failed login attempts. Please try again later.');
        }

        const maxLoginAttempts = parseInt(process.env.RATE_LIMIT_MAX_LOGIN || '10');
        const loginRateLimit = await rateLimiter(loginAttemptKey, {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
          max: maxLoginAttempts,
          message: 'Too many login attempts. Please try again after some time.'
        });

        if (!loginRateLimit.success) {
          console.warn(`[Auth] Rate limit exceeded for ${credentials.email} (IP: ${ip})`);
          throw new Error(loginRateLimit.message);
        }

        // Captcha verification (if enabled and required after N failures)
        const failedLoginCount = (await prisma?.user.findUnique({ where: { email: credentials.email } }))?.failedLoginCount || 0;
        const lockoutAfterFailed = parseInt(process.env.LOCKOUT_AFTER_FAILED || '5');
        if (process.env.CAPTCHA_ENABLED === 'true' && failedLoginCount >= lockoutAfterFailed) {
          if (!credentials.captcha || !await verifyTurnstile(credentials.captcha, ip as string)) {
            console.warn(`[Auth] Captcha verification failed for ${credentials.email} (IP: ${ip})`);
            // Increment failed login count
            await prisma?.user.update({ where: { email: credentials.email }, data: { failedLoginCount: { increment: 1 } } });
            throw new Error('Captcha verification failed. Please try again.');
          }
        }

        try {
          const user = await prisma?.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user.password) {
            // Increment failed login count only if user exists but password doesn't match
            if (user) {
              await prisma?.user.update({ where: { email: credentials.email }, data: { failedLoginCount: { increment: 1 } } });
            }
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            // Increment failed login count
            await prisma?.user.update({ where: { email: credentials.email }, data: { failedLoginCount: { increment: 1 } } });
            throw new Error('Invalid email or password');
          }

          // Reset failed login count and update last login details on success
          await prisma?.user.update({
            where: { email: credentials.email },
            data: {
              failedLoginCount: 0,
              lastLoginAt: new Date(),
              lastLoginIp: ip as string || null,
            }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            isVerified: user.isVerified,
            avatarUrl: user.avatarUrl,
            totpRequired: user.totpSecret ? true : false, // Add totpRequired flag
            subscriptionTier: user.subscriptionTier, // Add subscriptionTier
            subscriptionStatus: user.subscriptionStatus, // Add subscriptionStatus
          }
        } catch (error) {
          console.error('[Auth] Credentials authorize error:', error)
          throw error; // Re-throw to be caught by NextAuth
        }
      }
    }),
    // Google Provider
    ...(process.env.OAUTH_GOOGLE_ENABLED === 'true' ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    // Placeholder for other providers
    // ...(process.env.OAUTH_MICROSOFT_ENABLED === 'true' ? [
    //   MicrosoftProvider({
    //     clientId: process.env.MICROSOFT_CLIENT_ID as string,
    //     clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    //   })
    // ] : []),
    // ...(process.env.OAUTH_GITHUB_ENABLED === 'true' ? [
    //   GithubProvider({
    //     clientId: process.env.GITHUB_CLIENT_ID as string,
    //     clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    //   })
    // ] : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Handle OAuth sign-ins
        if (account?.provider === 'google') {
          console.log('[Auth] Google OAuth signIn:', { 
            user: { id: user.id, email: user.email, name: user.name },
            account: { provider: account.provider, type: account.type },
            profile: { email: profile?.email, name: profile?.name }
          });
          
          // Create or update user in database
          if (user.email) {
            const existingUser = await prisma?.user.findUnique({
              where: { email: user.email }
            });
            
            if (!existingUser) {
              // Calculate free trial end date (14 days from now)
              const freeTrialEndsAt = new Date();
              freeTrialEndsAt.setDate(freeTrialEndsAt.getDate() + 14);

              // Create new user
              await prisma!.user.create({
                data: {
                  email: user.email,
                  name: user.name || profile?.name || '',
                  emailVerifiedAt: new Date(), // OAuth users are verified
                  isVerified: true,
                  role: 'USER',
                  subscriptionTier: 'FREE',
                  subscriptionStatus: 'ACTIVE',
                  freeTrialEndsAt, // Set free trial end date
                }
              });
              console.log('[Auth] Created new Google OAuth user:', user.email);
            } else {
              // Update existing user
              await prisma?.user.update({
                where: { email: user.email },
                data: {
                  emailVerifiedAt: new Date(),
                  isVerified: true,
                  lastLoginAt: new Date()
                }
              });
              console.log('[Auth] Updated existing Google OAuth user:', user.email);
            }
          }
          
          return true;
        }
        // For credentials provider, the authorize function handles validation
        return true;
      } catch (error) {
        console.error('[Auth] signIn callback error:', error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Always fetch the latest user data to ensure up-to-date verification status
      const dbUser = await prisma!.user.findUnique({
        where: { email: (token.email || user?.email) as string }, // Use email instead of id
        select: {
          id: true,
          role: true,
          tenantId: true,
          isVerified: true,
          avatarUrl: true,
          name: true,
          email: true,
          totpSecret: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          freeTrialEndsAt: true, // Include freeTrialEndsAt
        }
      });

      if (dbUser) {
        token.id = dbUser.id; // Ensure token.id is set from dbUser
        token.role = dbUser.role as string;
        token.tenantId = dbUser.tenantId;
        token.isVerified = dbUser.isVerified;
        token.avatarUrl = dbUser.avatarUrl;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.totpRequired = dbUser.totpSecret ? true : false;
        token.subscriptionTier = dbUser.subscriptionTier as string;
        token.subscriptionStatus = dbUser.subscriptionStatus as string;
        token.freeTrialEndsAt = dbUser.freeTrialEndsAt; // Set freeTrialEndsAt
      } else if (user) {
        // If user is new (only provided on first sign in), use its data
        token.id = user.id;
        token.role = user.role as string;
        token.tenantId = user.tenantId;
        token.isVerified = user.isVerified;
        token.avatarUrl = user.avatarUrl;
        token.name = user.name;
        token.email = user.email; // Ensure email is present
        token.subscriptionTier = user.subscriptionTier as string;
        token.subscriptionStatus = user.subscriptionStatus as string;
        token.freeTrialEndsAt = (user as any).freeTrialEndsAt; // Assuming it might be passed from a custom authorize
        if ('totpRequired' in user) {
          token.totpRequired = user.totpRequired; // Set totpRequired if present from authorize
        }
      }

      // Special handling for session update event (e.g., after email verification or 2FA setup)
      // This block is now less critical for basic user data but might be used for other updates
      if (trigger === "update" && session?.user) {
        // The user data should already be fresh from the initial dbUser fetch, but ensure session data is aligned.
        // If there are specific fields updated only via session.update(), handle them here.
        // For now, we assume dbUser fetch covers most cases.
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email; // Ensure email is always present in session
        session.user.name = token.name; // Ensure name is always present in session
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId;
        session.user.isVerified = token.isVerified;
        session.user.avatarUrl = token.avatarUrl;
        session.user.subscriptionTier = token.subscriptionTier as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.freeTrialEndsAt = token.freeTrialEndsAt; // Set freeTrialEndsAt
        if ('totpRequired' in token) {
          session.user.totpRequired = token.totpRequired; // Add totpRequired to session
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    // newUser: '/' // Optional: Redirect new users to a specific page
  },
  events: {
    async signIn(message) {
      // Update lastLoginAt and lastLoginIp for the user
      if (message.user?.email) {
        await prisma?.user.updateMany({
          where: { email: message.user.email },
          data: {
            lastLoginAt: new Date(),
          },
        });
      }
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

export default NextAuth(authOptions)