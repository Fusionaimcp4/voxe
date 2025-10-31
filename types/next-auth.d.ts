import 'next-auth';
import 'next-auth/jwt';
import { SubscriptionTier } from '@/lib/generated/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
      tenantId?: string | null;
      isVerified?: boolean;
      avatarUrl?: string;
      totpRequired?: boolean;
      subscriptionTier?: SubscriptionTier;
      freeTrialEndsAt?: string | Date | null;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
    tenantId?: string | null;
    isVerified?: boolean;
    avatarUrl?: string;
    totpRequired?: boolean;
    subscriptionTier?: SubscriptionTier;
    freeTrialEndsAt?: string | Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
    tenantId?: string | null;
    isVerified?: boolean;
    avatarUrl?: string;
    totpRequired?: boolean;
    subscriptionTier?: SubscriptionTier;
    freeTrialEndsAt?: string | Date | null;
  }
}
